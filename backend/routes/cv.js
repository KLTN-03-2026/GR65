const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// ── Multer config ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => { const dir = path.join(__dirname, '../uploads/cvs'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); cb(null, dir); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']; const ext = path.extname(file.originalname).toLowerCase(); if (allowed.includes(ext)) cb(null, true); else cb(new Error('Định dạng file không được hỗ trợ.')); } });

async function parseWithAI(filePath, format, cvId) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/ai/parse-cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cv_id: cvId, file_path: filePath, format }) });
    const data = await response.json();
    if (!response.ok || !data.success) { console.error('❌ FastAPI Error:', data); return null; }
    console.log(`✅ Nhận kết quả từ Python: Score=${data.aiScore}`);
    return data.extractedInfo;
  } catch (err) { console.error('❌ Lỗi kết nối FastAPI:', err.message); return null; }
}

async function saveAIResult(cvId, parsed) {
  try { await pool.query('UPDATE CVs SET AIParsed = true, AIScore = $1, AIExtractedJson = $2 WHERE Id = $3', [Math.min(100, Math.max(0, Number(parsed.aiScore) || 0)), JSON.stringify(parsed), cvId]); console.log(`✅ Lưu kết quả AI cho CV ${cvId}`); }
  catch (e) { console.error('❌ Lỗi lưu AI result:', e.message); }
}

async function saveAIFailure(cvId) {
  try { await pool.query('UPDATE CVs SET AIParsed = true, AIScore = -1, AIExtractedJson = NULL WHERE Id = $1', [cvId]); }
  catch (e) { console.error('❌ Lỗi lưu AI failure:', e.message); }
}

router.use(authMiddleware);

// GET /api/cv
router.get('/', async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Chỉ ứng viên mới có CV.' });
    const result = await pool.query('SELECT Id, FileName, FileUrl, FileSize, Format, IsDefault, AIParsed, AIScore, AIExtractedJson, UploadedDate FROM CVs WHERE CandidateId = $1 ORDER BY IsDefault DESC, UploadedDate DESC', [id]);
    const cvs = result.rows.map(cv => ({ id: cv.id, fileName: cv.filename, fileUrl: cv.fileurl, fileSize: cv.filesize, format: cv.format, isDefault: !!cv.isdefault, aiParsed: !!cv.aiparsed, aiScore: parseFloat(cv.aiscore) || 0, extractedInfo: cv.aiextractedjson ? JSON.parse(cv.aiextractedjson) : null, uploadedDate: cv.uploadeddate }));
    res.json({ cvs });
  } catch (err) { console.error('GET /api/cv error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// POST /api/cv/upload
router.post('/upload', upload.single('cv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file.' });
  const { id, role } = req.user;
  if (role !== 'Candidate') return res.status(403).json({ message: 'Chỉ ứng viên mới có thể upload CV.' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  const formatMap = { '.pdf': 'PDF', '.doc': 'DOC', '.docx': 'DOCX', '.jpg': 'Image', '.jpeg': 'Image', '.png': 'Image' };
  const format = formatMap[ext] || 'Other';
  const fileSizeKB = req.file.size / 1024;
  const fileSize = fileSizeKB >= 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${Math.round(fileSizeKB)} KB`;
  const fileUrl = `/uploads/cvs/${req.file.filename}`;
  try {
    const countRes = await pool.query('SELECT COUNT(*) AS cnt FROM CVs WHERE CandidateId = $1', [id]);
    const isFirstCV = parseInt(countRes.rows[0].cnt) === 0;
    const cvRes = await pool.query(
      `INSERT INTO CVs (Id, CandidateId, FileName, FileUrl, FileSize, Format, IsDefault, AIParsed, AIScore, UploadedDate)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, false, 0, NOW()) RETURNING Id`,
      [id, req.file.originalname, fileUrl, fileSize, format, isFirstCV]);
    const cvId = cvRes.rows[0].id;
    await logActivity(id, 'UPLOAD_CV', 'CV', cvId, `Candidate uploaded CV: ${req.file.originalname}`);
    res.json({ message: 'Upload CV thành công! AI đang phân tích...', cv: { id: cvId, fileName: req.file.originalname, fileUrl, fileSize, format, isDefault: isFirstCV, aiParsed: false, aiScore: 0, extractedInfo: null, uploadedDate: new Date() } });
    const filePath = req.file.path;
    parseWithAI(filePath, format, cvId).then(parsed => { if (parsed) saveAIResult(cvId, parsed); else saveAIFailure(cvId); });
  } catch (err) { console.error('POST /api/cv/upload error:', err); fs.unlink(req.file.path, () => {}); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// PUT /api/cv/:id/default
router.put('/:id/default', async (req, res) => {
  try {
    const { id: userId } = req.user; const cvId = req.params.id;
    const own = await pool.query('SELECT Id FROM CVs WHERE Id = $1 AND CandidateId = $2', [cvId, userId]);
    if (own.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    await pool.query('UPDATE CVs SET IsDefault = false WHERE CandidateId = $1', [userId]);
    await pool.query('UPDATE CVs SET IsDefault = true WHERE Id = $1', [cvId]);
    await logActivity(userId, 'SET_DEFAULT_CV', 'CV', cvId, 'Candidate set a CV as default');
    res.json({ message: 'Đã đặt CV mặc định.' });
  } catch (err) { console.error('PUT /api/cv/:id/default error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// POST /api/cv/:id/reparse
router.post('/:id/reparse', async (req, res) => {
  try {
    const { id: userId } = req.user; const cvId = req.params.id;
    const cvRes = await pool.query('SELECT FileUrl, Format FROM CVs WHERE Id = $1 AND CandidateId = $2', [cvId, userId]);
    if (cvRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    const { fileurl, format } = cvRes.rows[0];
    const filePath = path.join(__dirname, '..', fileurl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File không còn trên server.' });
    await pool.query('UPDATE CVs SET AIParsed = false, AIScore = 0, AIExtractedJson = NULL WHERE Id = $1', [cvId]);
    await logActivity(userId, 'REPARSE_CV', 'CV', cvId, 'Candidate requested CV re-parsing');
    res.json({ message: 'Đang phân tích lại, vui lòng chờ...' });
    parseWithAI(filePath, format, cvId).then(parsed => { if (parsed) saveAIResult(cvId, parsed); else saveAIFailure(cvId); });
  } catch (err) { console.error('POST /api/cv/:id/reparse error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// DELETE /api/cv/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id: userId } = req.user; const cvId = req.params.id;
    const cvRes = await pool.query('SELECT FileUrl FROM CVs WHERE Id = $1 AND CandidateId = $2', [cvId, userId]);
    if (cvRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    await pool.query('DELETE FROM CVs WHERE Id = $1', [cvId]);
    await logActivity(userId, 'DELETE_CV', 'CV', cvId, 'Candidate deleted a CV');
    const filePath = path.join(__dirname, '..', cvRes.rows[0].fileurl);
    fs.unlink(filePath, () => {});
    res.json({ message: 'Đã xóa CV.' });
  } catch (err) { console.error('DELETE /api/cv/:id error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// GET /api/cv/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const { id: userId } = req.user; const cvId = req.params.id;
    const cvRes = await pool.query('SELECT FileName, FileUrl FROM CVs WHERE Id = $1 AND CandidateId = $2', [cvId, userId]);
    if (cvRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    const { filename, fileurl } = cvRes.rows[0];
    const filePath = path.join(__dirname, '..', fileurl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File không tồn tại trên server.' });
    res.download(filePath, filename);
  } catch (err) { console.error('GET /api/cv/:id/download error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

// GET /api/cv/:id/ai-result
router.get('/:id/ai-result', async (req, res) => {
  try {
    const { id: userId } = req.user; const cvId = req.params.id;
    const cvRes = await pool.query('SELECT AIParsed, AIScore, AIExtractedJson FROM CVs WHERE Id = $1 AND CandidateId = $2', [cvId, userId]);
    if (cvRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    const cv = cvRes.rows[0];
    res.json({ aiParsed: !!cv.aiparsed, aiScore: parseFloat(cv.aiscore) || 0, extractedInfo: cv.aiextractedjson ? JSON.parse(cv.aiextractedjson) : null });
  } catch (err) { console.error('GET /api/cv/:id/ai-result error:', err); res.status(500).json({ message: 'Lỗi hệ thống.' }); }
});

module.exports = router;
