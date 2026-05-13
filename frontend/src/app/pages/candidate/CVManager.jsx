import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, FileText, Brain, Trash2, Star, Eye, Download,
  CheckCircle, AlertCircle, Clock, File, ImageIcon,
  RefreshCw, Plus, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

import { API_URL as API_BASE } from "../../../lib/api";

const formatIcons = {
  PDF:   FileText,
  DOCX:  File,
  DOC:   File,
  Image: ImageIcon,
};

const formatColors = {
  PDF:   "text-red-500",
  DOCX:  "text-blue-500",
  DOC:   "text-blue-500",
  Image: "text-amber-500",
};

export function CVManager() {
  const [cvs, setCvs]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  // Map: cvId → đang poll AI
  const [polling, setPolling] = useState({});
  const fileInputRef = useRef(null);
  const pollTimers   = useRef({});

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch danh sách CV ─────────────────────────
  const fetchCVs = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/cv`, { headers });
      const data = await res.json();
      if (res.ok) setCvs(data.cvs || []);
    } catch {
      toast.error("Không thể tải danh sách CV.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchCVs(); }, [fetchCVs]);

  // Tự động chọn CV đầu tiên
  useEffect(() => {
    if (cvs.length > 0 && !selectedCV) setSelectedCV(cvs[0].id);
  }, [cvs]); // eslint-disable-line

  // ── Poll kết quả AI (sau khi upload) ──────────
  const startPolling = useCallback((cvId) => {
    setPolling(prev => ({ ...prev, [cvId]: true }));
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 2 phút (5s * 24)

    const poll = async () => {
      attempts++;
      try {
        const res  = await fetch(`${API_BASE}/api/cv/${cvId}/ai-result`, { headers });
        const data = await res.json();
        if (res.ok && data.aiParsed) {
          // Xử lý nếu backend báo lỗi API/Timeout (trả về aiScore = -1)
          const isError = data.aiScore < 0;
          
          setCvs(prev => prev.map(cv =>
            cv.id === cvId
              ? { ...cv, aiParsed: true, aiScore: data.aiScore, extractedInfo: data.extractedInfo }
              : cv
          ));
          setPolling(prev => { const n = { ...prev }; delete n[cvId]; return n; });
          clearInterval(pollTimers.current[cvId]);
          delete pollTimers.current[cvId];
          
          if (isError) toast.error(`Lỗi phân tích AI. Vui lòng thử lại sau!`);
          else toast.success(`AI đã phân tích xong! Điểm: ${data.aiScore}%`);
          
          return;
        }
      } catch { /* im lặng */ }

      if (attempts >= MAX_ATTEMPTS) {
        setPolling(prev => { const n = { ...prev }; delete n[cvId]; return n; });
        clearInterval(pollTimers.current[cvId]);
        delete pollTimers.current[cvId];
      }
    };

    pollTimers.current[cvId] = setInterval(poll, 5000);
  }, []); // eslint-disable-line

  // Cleanup khi unmount
  useEffect(() => () => Object.values(pollTimers.current).forEach(clearInterval), []);

  // ── Upload file ────────────────────────────────
  const handleUpload = async (file) => {
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) { toast.error("File vượt quá 10MB."); return; }

    const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(`.${ext}`)) {
      toast.error("Chỉ hỗ trợ PDF, DOCX, DOC, JPG, PNG.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res  = await fetch(`${API_BASE}/api/cv/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Thêm CV mới vào danh sách
      setCvs(prev => [data.cv, ...prev]);
      setSelectedCV(data.cv.id);
      toast.success("Upload thành công! AI đang phân tích CV...");

      // Bắt đầu poll kết quả AI
      startPolling(data.cv.id);
    } catch (err) {
      toast.error(err.message || "Upload thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  // ── Phân tích lại AI ────────────────────────
  const handleReparse = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/cv/${id}/reparse`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Đang phân tích lại...");
      startPolling(id);
    } catch (err) {
      toast.error(err.message || "Không thể phân tích lại CV.");
    }
  };

  // ── Đặt mặc định ──────────────────────────────
  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/cv/${id}/default`, {
        method: "PUT",
        headers,
      });
      if (!res.ok) throw new Error();
      setCvs(prev => prev.map(cv => ({ ...cv, isDefault: cv.id === id })));
      toast.success("Đã đặt làm CV mặc định.");
    } catch {
      toast.error("Không thể đặt mặc định.");
    }
  };

  // ── Xóa CV ────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa CV này?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/cv/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error();
      setCvs(prev => prev.filter(cv => cv.id !== id));
      if (selectedCV === id) setSelectedCV(null);
      toast.success("Đã xóa CV.");
    } catch {
      toast.error("Không thể xóa CV.");
    }
  };

  // ── Download ───────────────────────────────────
  const handleDownload = (id, fileName) => {
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/cv/${id}/download?token=${token}`;
    // Dùng window.open cho đơn giản, hoặc fetch + blob
    fetch(`${API_BASE}/api/cv/${id}/download`, { headers })
      .then(res => res.blob())
      .then(blob => {
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Không thể tải file."));
  };

  const selectedCVData = cvs.find(cv => cv.id === selectedCV);

  // Helper: đảm bảo giá trị luôn là string (tránh React error #31 khi AI trả object)
  const safeRender = (val) => {
    if (val == null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") {
      return val.degree || val.school || val.name || val.summary || val.value || JSON.stringify(val);
    }
    return String(val);
  };

  // ── Render ─────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Quản lý CV</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lưu và quản lý nhiều bản CV cho từng vị trí ứng tuyển
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Thêm CV mới
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={onFileChange} />
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white text-sm mb-1">AI CV Parser — Google Gemini</h3>
          <p className="text-violet-100 text-xs">
            Tự động trích xuất kỹ năng, kinh nghiệm, học vấn từ PDF & DOCX. Chấm điểm CV của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-white">Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* CV List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-indigo-500 animate-spin" />
                <p className="text-sm text-indigo-600" style={{ fontWeight: 500 }}>Đang tải lên...</p>
              </>
            ) : (
              <>
                <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? "text-indigo-500" : "text-gray-300"}`} />
                <p className="text-sm text-gray-600 mb-1" style={{ fontWeight: 500 }}>Kéo & thả file vào đây</p>
                <p className="text-xs text-gray-400">Hỗ trợ PDF, DOCX, JPG, PNG — Tối đa 10MB</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  {["PDF", "DOCX", "JPG", "PNG"].map(f => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{f}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-400">Đang tải danh sách CV...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && cvs.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Bạn chưa có CV nào. Hãy tải lên CV đầu tiên!</p>
            </div>
          )}

          {/* CV Cards */}
          {!loading && cvs.map(cv => {
            const Icon = formatIcons[cv.format] || FileText;
            const iconColor = formatColors[cv.format] || "text-gray-400";
            const isPolling = !!polling[cv.id];

            return (
              <div
                key={cv.id}
                onClick={() => setSelectedCV(cv.id === selectedCV ? null : cv.id)}
                className={`bg-white rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedCV === cv.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      cv.isDefault ? "bg-indigo-100" : "bg-gray-100"
                    }`}>
                      {isPolling
                        ? <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                        : <Icon className={`w-5 h-5 ${cv.isDefault ? "text-indigo-600" : iconColor}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                          {cv.fileName}
                        </h4>
                        {cv.isDefault && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span>{cv.fileSize}</span>
                        <span>•</span>
                        <span>{cv.format}</span>
                        <span>•</span>
                        <span>
                          {cv.uploadedDate
                            ? new Date(cv.uploadedDate).toLocaleDateString("vi-VN")
                            : "—"}
                        </span>
                      </div>

                      {isPolling ? (
                        <div className="flex items-center gap-2 text-xs text-indigo-600">
                          <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                          AI đang phân tích...
                        </div>
                      ) : cv.aiParsed && cv.aiScore >= 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                style={{ width: `${cv.aiScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-indigo-600 flex-shrink-0" style={{ fontWeight: 600 }}>
                              AI: {cv.aiScore}%
                            </span>
                          </div>
                          {cv.extractedInfo?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cv.extractedInfo.skills.slice(0, 4).map(s => (
                                <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : cv.aiParsed && cv.aiScore < 0 ? (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" /> Phân tích AI bị lỗi định dạng / timeout
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" /> Chưa được AI phân tích
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedCV(cv.id); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDownload(cv.id, cv.fileName); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải về
                    </button>
                    {!cv.isDefault && (
                      <button
                        onClick={e => { e.stopPropagation(); handleSetDefault(cv.id); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Đặt mặc định
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(cv.id); }}
                      className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CV Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCVData ? (
            <>
              {/* AI Result Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                    Kết quả AI Parsing
                  </h3>
                  {!polling[selectedCVData.id] && (
                    <button
                      onClick={() => handleReparse(selectedCVData.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Brain className="w-3.5 h-3.5" /> Phân tích lại
                    </button>
                  )}
                </div>

                {polling[selectedCVData.id] ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-indigo-600" style={{ fontWeight: 500 }}>AI đang phân tích...</p>
                    <p className="text-xs text-gray-400 mt-1">Đã bật timeout (max 45 giây)</p>
                  </div>
                ) : selectedCVData.aiParsed && selectedCVData.aiScore >= 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500">AI Score</span>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl text-indigo-600" style={{ fontWeight: 800 }}>
                          {selectedCVData.aiScore}%
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{ width: `${selectedCVData.aiScore}%` }}
                      />
                    </div>

                    <div className="space-y-3">
                      {selectedCVData.extractedInfo.summary && (
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <div className="text-xs text-indigo-500 mb-1">Tóm tắt</div>
                          <div className="text-sm text-indigo-800" style={{ fontWeight: 500 }}>
                            {safeRender(selectedCVData.extractedInfo.summary)}
                          </div>
                        </div>
                      )}
                      {selectedCVData.extractedInfo.experience && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="text-xs text-gray-400 mb-1">Kinh nghiệm</div>
                          <div className="text-sm text-gray-700" style={{ fontWeight: 500 }}>
                            {safeRender(selectedCVData.extractedInfo.experience)}
                          </div>
                        </div>
                      )}
                      {selectedCVData.extractedInfo.education && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="text-xs text-gray-400 mb-1">Học vấn</div>
                          <div className="text-sm text-gray-700" style={{ fontWeight: 500 }}>
                            {safeRender(selectedCVData.extractedInfo.education)}
                          </div>
                        </div>
                      )}
                      {selectedCVData.extractedInfo.languages?.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="text-xs text-gray-400 mb-2">Ngôn ngữ</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCVData.extractedInfo.languages.map(l => (
                              <span key={l} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{l}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedCVData.extractedInfo.skills?.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="text-xs text-gray-400 mb-2">Kỹ năng được trích xuất</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCVData.extractedInfo.skills.map(s => (
                              <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : selectedCVData.aiParsed && selectedCVData.aiScore < 0 ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-600" style={{ fontWeight: 500 }}>Phân tích AI thất bại</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      File có thể quá lớn, quá mờ (nếu là ảnh), hoặc API quá tải. Bạn hãy thử phân tích lại.
                    </p>
                    <button
                      onClick={() => handleReparse(selectedCVData.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Bấm để thử lại
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">CV chưa được AI phân tích</p>
                    <p className="text-xs text-gray-300 mt-1">
                      <button
                        onClick={() => handleReparse(selectedCVData.id)}
                        className="mt-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 mx-auto transition-colors"
                      >
                        <Brain className="w-4 h-4" /> Bấm để phân tích AI
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
                <h3 className="text-sm text-gray-900 mb-3">Mẹo cải thiện CV</h3>
                <div className="space-y-2">
                  {[
                    "Thêm portfolio/GitHub link",
                    "Mô tả thành tích cụ thể hơn (con số, %, kết quả)",
                    "Cập nhật kỹ năng mới nhất phù hợp JD",
                  ].map(tip => (
                    <div key={tip} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Chọn một CV để xem kết quả phân tích AI</p>
              </div>

              {/* Format support */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm text-gray-900 mb-3">Định dạng hỗ trợ</h3>
                <div className="space-y-2">
                  {[
                    { format: "PDF", desc: "Hỗ trợ đầy đủ + AI parsing", icon: FileText, color: "text-red-500" },
                    { format: "Word (.docx)", desc: "Hỗ trợ đầy đủ + AI parsing", icon: File, color: "text-blue-500" },
                    { format: "Ảnh (JPG/PNG)", desc: "Gemini Vision đọc hiểu ảnh CV", icon: ImageIcon, color: "text-amber-500" },
                  ].map(item => (
                    <div key={item.format} className="flex items-center gap-3 p-2 rounded-lg">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <div className="flex-1">
                        <div className="text-xs text-gray-700" style={{ fontWeight: 500 }}>{item.format}</div>
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}