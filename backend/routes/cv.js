const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../middleware/auth');

// ── Multer config ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/cvs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Định dạng file không được hỗ trợ.'));
  }
});

// ── AI Parsing chuyển giao cho FastAPI ─────────────────────
async function parseWithAI(filePath, format, cvId) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/ai/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cv_id: cvId,
        file_path: filePath,
        format: format
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      console.error('❌ FastAPI Error:', data);
      return null;
    }

    console.log(`✅ Nhận kết quả từ Python: Score=${data.aiScore}`);
    return data.extractedInfo;

  } catch (err) {
    console.error('❌ Lỗi kết nối FastAPI (nhớ bật uvicorn main:app):', err.message);
    return null;
  }
}

// Helper: cập nhật kết quả AI vào DB
async function saveAIResult(cvId, parsed) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('AIScore', sql.Decimal, Math.min(100, Math.max(0, Number(parsed.aiScore) || 0)))
      .input('AIExtractedJson', sql.NVarChar, JSON.stringify(parsed))
      .query('UPDATE CVs SET AIParsed = 1, AIScore = @AIScore, AIExtractedJson = @AIExtractedJson WHERE Id = @Id');
    console.log(`✅ Lưu kết quả AI cho CV ${cvId}: score=${parsed.aiScore}`);
  } catch (e) {
    console.error('❌  Lỗi lưu AI result vào DB:', e.message);
  }
}

// Helper: Xử lý lỗi AI (gán AIScore = -1 để frontend biết là lỗi)
async function saveAIFailure(cvId) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .query('UPDATE CVs SET AIParsed = 1, AIScore = -1, AIExtractedJson = NULL WHERE Id = @Id');
    console.log(`⚠️  Lưu trạng thái lỗi AI cho CV ${cvId}`);
  } catch (e) {
    console.error('❌  Lỗi lưu AI failure vào DB:', e.message);
  }
}

// Tất cả routes cần auth
router.use(authMiddleware);

// ────────────────────────────────────────────────
// GET /api/cv  – Lấy danh sách CV của ứng viên
// ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'Candidate') return res.status(403).json({ message: 'Chỉ ứng viên mới có CV.' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CandidateId', sql.UniqueIdentifier, id)
      .query(`
        SELECT Id, FileName, FileUrl, FileSize, Format,
               IsDefault, AIParsed, AIScore, AIExtractedJson, UploadedDate
        FROM CVs
        WHERE CandidateId = @CandidateId
        ORDER BY IsDefault DESC, UploadedDate DESC
      `);

    const cvs = result.recordset.map(cv => ({
      id: cv.Id,
      fileName: cv.FileName,
      fileUrl: cv.FileUrl,
      fileSize: cv.FileSize,
      format: cv.Format,
      isDefault: !!cv.IsDefault,
      aiParsed: !!cv.AIParsed,
      aiScore: parseFloat(cv.AIScore) || 0,
      extractedInfo: cv.AIExtractedJson ? JSON.parse(cv.AIExtractedJson) : null,
      uploadedDate: cv.UploadedDate,
    }));

    res.json({ cvs });
  } catch (err) {
    console.error('GET /api/cv error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// POST /api/cv/upload  – Upload CV mới
// (PHẢI đặt TRƯỚC route /:id để tránh conflict)
// ────────────────────────────────────────────────
router.post('/upload', upload.single('cv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file.' });

  const { id, role } = req.user;
  if (role !== 'Candidate') return res.status(403).json({ message: 'Chỉ ứng viên mới có thể upload CV.' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const formatMap = { '.pdf': 'PDF', '.doc': 'DOC', '.docx': 'DOCX', '.jpg': 'Image', '.jpeg': 'Image', '.png': 'Image' };
  const format = formatMap[ext] || 'Other';

  const fileSizeKB = req.file.size / 1024;
  const fileSize = fileSizeKB >= 1024
    ? `${(fileSizeKB / 1024).toFixed(1)} MB`
    : `${Math.round(fileSizeKB)} KB`;

  const fileUrl = `/uploads/cvs/${req.file.filename}`;

  try {
    const pool = await poolPromise;

    const countRes = await pool.request()
      .input('CandidateId', sql.UniqueIdentifier, id)
      .query('SELECT COUNT(*) AS cnt FROM CVs WHERE CandidateId = @CandidateId');
    const isFirstCV = countRes.recordset[0].cnt === 0;

    const cvId = (await pool.request()
      .input('CandidateId', sql.UniqueIdentifier, id)
      .input('FileName', sql.NVarChar, req.file.originalname)
      .input('FileUrl', sql.NVarChar, fileUrl)
      .input('FileSize', sql.NVarChar, fileSize)
      .input('Format', sql.NVarChar, format)
      .input('IsDefault', sql.Bit, isFirstCV ? 1 : 0)
      .query(`
        INSERT INTO CVs (Id, CandidateId, FileName, FileUrl, FileSize, Format, IsDefault, AIParsed, AIScore, UploadedDate)
        OUTPUT INSERTED.Id
        VALUES (NEWID(), @CandidateId, @FileName, @FileUrl, @FileSize, @Format, @IsDefault, 0, 0, GETDATE())
      `)).recordset[0].Id;

    res.json({
      message: 'Upload CV thành công! AI đang phân tích...',
      cv: {
        id: cvId,
        fileName: req.file.originalname,
        fileUrl,
        fileSize,
        format,
        isDefault: isFirstCV,
        aiParsed: false,
        aiScore: 0,
        extractedInfo: null,
        uploadedDate: new Date(),
      }
    });

    // Gửi sang Python API chạy ngầm
    const filePath = req.file.path;
    parseWithAI(filePath, format, cvId).then(parsed => {
      if (parsed) saveAIResult(cvId, parsed);
      else saveAIFailure(cvId);
    });

  } catch (err) {
    console.error('POST /api/cv/upload error:', err);
    fs.unlink(req.file.path, () => { });
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/cv/:id/default  – Đặt CV mặc định
// ────────────────────────────────────────────────
router.put('/:id/default', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cvId = req.params.id;
    const pool = await poolPromise;

    const own = await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('SELECT Id FROM CVs WHERE Id = @Id AND CandidateId = @CandidateId');
    if (own.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });

    await pool.request()
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('UPDATE CVs SET IsDefault = 0 WHERE CandidateId = @CandidateId');

    await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .query('UPDATE CVs SET IsDefault = 1 WHERE Id = @Id');

    res.json({ message: 'Đã đặt CV mặc định.' });
  } catch (err) {
    console.error('PUT /api/cv/:id/default error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// POST /api/cv/:id/reparse  – Phân tích lại CV với AI
// ────────────────────────────────────────────────
router.post('/:id/reparse', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cvId = req.params.id;
    const pool = await poolPromise;

    const cvRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('SELECT FileUrl, Format FROM CVs WHERE Id = @Id AND CandidateId = @CandidateId');

    if (cvRes.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });

    const { FileUrl, Format } = cvRes.recordset[0];
    const filePath = path.join(__dirname, '..', FileUrl);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File không còn trên server.' });

    // Reset trạng thái AI
    await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .query('UPDATE CVs SET AIParsed = 0, AIScore = 0, AIExtractedJson = NULL WHERE Id = @Id');

    res.json({ message: 'Đang phân tích lại, vui lòng chờ...' });

    // Gửi sang Python API chạy ngầm
    parseWithAI(filePath, Format, cvId).then(parsed => {
      if (parsed) saveAIResult(cvId, parsed);
      else saveAIFailure(cvId);
    });

  } catch (err) {
    console.error('POST /api/cv/:id/reparse error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// DELETE /api/cv/:id  – Xóa CV
// ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cvId = req.params.id;
    const pool = await poolPromise;

    const cvRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('SELECT FileUrl FROM CVs WHERE Id = @Id AND CandidateId = @CandidateId');

    if (cvRes.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });

    const fileUrl = cvRes.recordset[0].FileUrl;

    await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .query('DELETE FROM CVs WHERE Id = @Id');

    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => { });

    res.json({ message: 'Đã xóa CV.' });
  } catch (err) {
    console.error('DELETE /api/cv/:id error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// GET /api/cv/:id/download  – Tải CV về máy
// ────────────────────────────────────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cvId = req.params.id;
    const pool = await poolPromise;

    const cvRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('SELECT FileName, FileUrl FROM CVs WHERE Id = @Id AND CandidateId = @CandidateId');

    if (cvRes.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });

    const { FileName, FileUrl } = cvRes.recordset[0];
    const filePath = path.join(__dirname, '..', FileUrl);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File không tồn tại trên server.' });

    res.download(filePath, FileName);
  } catch (err) {
    console.error('GET /api/cv/:id/download error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

// ────────────────────────────────────────────────
// GET /api/cv/:id/ai-result  – Poll kết quả AI
// ────────────────────────────────────────────────
router.get('/:id/ai-result', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cvId = req.params.id;
    const pool = await poolPromise;

    const cvRes = await pool.request()
      .input('Id', sql.UniqueIdentifier, cvId)
      .input('CandidateId', sql.UniqueIdentifier, userId)
      .query('SELECT AIParsed, AIScore, AIExtractedJson FROM CVs WHERE Id = @Id AND CandidateId = @CandidateId');

    if (cvRes.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy CV.' });

    const cv = cvRes.recordset[0];
    res.json({
      aiParsed: !!cv.AIParsed,
      aiScore: parseFloat(cv.AIScore) || 0,
      extractedInfo: cv.AIExtractedJson ? JSON.parse(cv.AIExtractedJson) : null,
    });
  } catch (err) {
    console.error('GET /api/cv/:id/ai-result error:', err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
});

module.exports = router;
