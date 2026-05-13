import { useState, useEffect } from "react";
import { FileCheck, Briefcase, FileText, CheckCircle, XCircle, AlertCircle, Clock, Loader2, Search, ChevronDown, Trash2, Eye, ExternalLink, Download } from "lucide-react";
import api from "../../../lib/api";
import { toast } from "sonner";

const riskConfig = {
  low: { label: "Thấp", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  medium: { label: "Trung bình", color: "text-amber-600 bg-amber-50 border-amber-200" },
  high: { label: "Cao ⚠️", color: "text-red-600 bg-red-50 border-red-200" }
};

// Evaluate risk based on job data
const evaluateJobRisk = (job) => {
  if (!job.Title || !job.Category) return "high";
  const suspiciousWords = ["kiếm tiền", "get rich", "không cần", "dễ dàng", "100+"];
  const titleLower = (job.Title || "").toLowerCase();
  const descLower = (job.Description || "").toLowerCase();
  if (suspiciousWords.some(w => titleLower.includes(w) || descLower.includes(w))) return "high";
  if (!job.Description || job.Description.length < 30) return "medium";
  return "low";
};

const evaluateCVRisk = (cv) => {
  if (!cv.FileName) return "high";
  const ext = cv.FileName.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return "medium";
  return "low";
};

export function ContentModeration() {
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingCVs, setPendingCVs] = useState([]);
  const [activeTab, setActiveTab] = useState("jd");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (status = "pending", search = "") => {
    setLoading(true);
    try {
      let jobUrl = `/api/admin/jobs?limit=50&status=${status}`;
      let cvUrl = `/api/admin/cvs?limit=50&status=${status}`;
      if (search) { jobUrl += `&search=${search}`; cvUrl += `&search=${search}`; }
      const [resJobs, resCVs] = await Promise.all([api.get(jobUrl), api.get(cvUrl)]);
      setPendingJobs(resJobs.data.data || []);
      setPendingCVs(resCVs.data.data || []);
    } catch (err) {
      console.error("Error loading moderation data:", err);
      toast.error("Lỗi khi tải dữ liệu kiểm duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(statusFilter, searchQuery); }, [statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => fetchData(statusFilter, searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectJob = async (job) => {
    setSelectedItem({ ...job, _type: "job" });
    try {
      const res = await api.get(`/api/admin/jobs/${job.Id}`);
      setSelectedDetail({ ...res.data.data, _type: "job" });
    } catch (err) {
      console.error("Error loading job detail:", err);
      setSelectedDetail(null);
    }
  };

  const handleSelectCV = async (cv) => {
    setSelectedItem({ ...cv, _type: "cv" });
    try {
      const res = await api.get(`/api/admin/cvs/${cv.Id}`);
      setSelectedDetail({ ...res.data.data, _type: "cv" });
    } catch (err) {
      console.error("Error loading CV detail:", err);
      setSelectedDetail(null);
    }
  };

  const deleteCV = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa CV này?")) return;
    try {
      await api.delete(`/api/admin/cvs/${id}`);
      setPendingCVs(prev => prev.filter(c => c.Id !== id));
      if (selectedItem?.Id === id) { setSelectedItem(null); setSelectedDetail(null); }
      toast.success("Đã xóa CV");
    } catch (err) {
      toast.error("Lỗi khi xóa CV");
    }
  };

  const approveJD = async (id) => {
    try {
      await api.put(`/api/admin/jobs/${id}/status`, { status: "active" });
      const item = pendingJobs.find(j => j.Id === id);
      setPendingJobs(prev => prev.filter(j => j.Id !== id));
      if (selectedItem?.Id === id) { setSelectedItem(null); setSelectedDetail(null); }
      toast.success(`Đã duyệt bài đăng "${item?.Title}"`);
    } catch (err) {
      console.error("Error approving JD:", err);
      toast.error("Lỗi khi duyệt bài đăng");
    }
  };

  const rejectJD = async (id) => {
    try {
      await api.put(`/api/admin/jobs/${id}/status`, { status: "rejected" });
      const item = pendingJobs.find(j => j.Id === id);
      setPendingJobs(prev => prev.filter(j => j.Id !== id));
      if (selectedItem?.Id === id) { setSelectedItem(null); setSelectedDetail(null); }
      toast.success(`Đã từ chối bài đăng "${item?.Title}"`);
    } catch (err) {
      console.error("Error rejecting JD:", err);
      toast.error("Lỗi khi từ chối bài đăng");
    }
  };

  const approveCV = async (id) => {
    try {
      await api.put(`/api/admin/cvs/${id}/status`, { status: "approved" });
      const item = pendingCVs.find(c => c.Id === id);
      setPendingCVs(prev => prev.filter(c => c.Id !== id));
      toast.success(`Đã duyệt CV của "${item?.CandidateName}"`);
    } catch (err) {
      console.error("Error approving CV:", err);
      toast.error("Lỗi khi duyệt CV");
    }
  };

  const rejectCV = async (id) => {
    try {
      await api.put(`/api/admin/cvs/${id}/status`, { status: "rejected" });
      const item = pendingCVs.find(c => c.Id === id);
      setPendingCVs(prev => prev.filter(c => c.Id !== id));
      toast.error(`Đã từ chối CV của "${item?.CandidateName}"`);
    } catch (err) {
      console.error("Error rejecting CV:", err);
      toast.error("Lỗi khi từ chối CV");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500">Đang tải dữ liệu kiểm duyệt...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900">Kiểm duyệt nội dung</h1>
        <p className="text-sm text-gray-500 mt-1">Xem xét và duyệt các bài đăng JD và CV mới — Dữ liệu thật từ hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
        { label: "JD hiển thị", value: pendingJobs.length, color: "bg-amber-50 text-amber-600", icon: Briefcase },
        { label: "CV hiển thị", value: pendingCVs.length, color: "bg-blue-50 text-blue-600", icon: FileText },
        { label: "Nguy cơ cao", value: pendingJobs.filter(j => evaluateJobRisk(j) === "high").length + pendingCVs.filter(c => evaluateCVRisk(c) === "high").length, color: "bg-red-50 text-red-600", icon: AlertCircle }].
        map((s) =>
        <div key={s.label} className={`${s.color} rounded-2xl p-4 flex items-center gap-3`}>
            <s.icon className="w-6 h-6 opacity-70" />
            <div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-xs opacity-80">{s.label}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
          { key: "jd", label: "Bài đăng JD", count: pendingJobs.length },
          { key: "cv", label: "CV ứng viên", count: pendingCVs.length }].
          map((tab) =>
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedItem(null); setSelectedDetail(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>
            </button>
          )}
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none text-gray-600">
            <option value="pending">Chờ duyệt</option>
            <option value="active">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {activeTab === "jd" ?
          pendingJobs.length > 0 ? pendingJobs.map((item) => {
            const risk = riskConfig[evaluateJobRisk(item)];
            const logoText = (item.CompanyName || "?").slice(0, 2).toUpperCase();
            return (
              <div key={item.Id} onClick={() => handleSelectJob(item)} className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedItem?.Id === item.Id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: "#6366f1" }}>
                      {logoText}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{item.Title}</h4>
                      <p className="text-xs text-gray-400">{item.CompanyName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border flex-shrink-0 ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Clock className="w-3 h-3" /> {item.PostedDate ? new Date(item.PostedDate).toLocaleDateString("vi-VN") : "N/A"}
                    <span>•</span>
                    {item.SalaryRange || "Thỏa thuận"}
                  </div>
                  {statusFilter === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={(e) => {e.stopPropagation();approveJD(item.Id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={(e) => {e.stopPropagation();rejectJD(item.Id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                  )}
                </div>);
          }) :
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Không có JD nào chờ duyệt</p>
              </div> :

          pendingCVs.length > 0 ? pendingCVs.map((cv) => {
            const risk = riskConfig[evaluateCVRisk(cv)];
            const initials = (cv.CandidateName || "?").split(" ").map(n => n[0]).join("").slice(0, 2);
            const ext = cv.FileName?.split('.').pop()?.toUpperCase() || "N/A";
            return (
              <div key={cv.Id} onClick={() => handleSelectCV(cv)} className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedItem?.Id === cv.Id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{cv.CandidateName}</h4>
                      <p className="text-xs text-gray-400">{ext} • AI Score: {cv.AIScore ?? "N/A"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border flex-shrink-0 ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {cv.UploadedDate ? new Date(cv.UploadedDate).toLocaleDateString("vi-VN") : "N/A"}
                  </div>
                  {statusFilter === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={(e) => {e.stopPropagation();approveCV(cv.Id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={(e) => {e.stopPropagation();rejectCV(cv.Id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                  )}
                </div>);
          }) :
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Không có CV nào</p>
              </div>
          }
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedDetail && selectedDetail._type === "job" ?
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 18, backgroundColor: "#6366f1" }}>
                  {(selectedDetail.CompanyName || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{selectedDetail.Title}</h2>
                  <p className="text-gray-500 text-sm">{selectedDetail.CompanyName}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl border ${riskConfig[evaluateJobRisk(selectedDetail)].color}`}>
                  Nguy cơ: {riskConfig[evaluateJobRisk(selectedDetail)].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Mức lương</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.SalaryRange || "Thỏa thuận"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Ngày đăng</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.PostedDate ? new Date(selectedDetail.PostedDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Loại hình</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.JobType || "Full-time"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Địa điểm</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.Location || "N/A"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-2">Nội dung mô tả</div>
                <div className={`p-4 rounded-xl text-sm text-gray-600 leading-relaxed ${evaluateJobRisk(selectedDetail) === "high" ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                  {selectedDetail.Description || "Không có mô tả."}
                </div>
              </div>

              {evaluateJobRisk(selectedDetail) === "high" &&
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-red-700" style={{ fontWeight: 500 }}>Nội dung có rủi ro cao</div>
                    <div className="text-xs text-red-500">Phát hiện dấu hiệu spam hoặc nội dung thiếu thông tin. Khuyến nghị từ chối.</div>
                  </div>
                </div>
            }

              {statusFilter === "pending" && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => rejectJD(selectedDetail.Id)} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối bài đăng
                </button>
                <button onClick={() => approveJD(selectedDetail.Id)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm transition-colors">
                  <CheckCircle className="w-4 h-4" /> Duyệt & Công khai
                </button>
              </div>
              )}
            </div> :

          selectedDetail && selectedDetail._type === "cv" ?
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0" style={{ fontWeight: 700, fontSize: 18 }}>
                  {(selectedDetail.CandidateName || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{selectedDetail.CandidateName}</h2>
                  <p className="text-gray-500 text-sm">{selectedDetail.CandidateEmail}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl border ${riskConfig[evaluateCVRisk(selectedDetail)].color}`}>
                  Nguy cơ: {riskConfig[evaluateCVRisk(selectedDetail)].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Tên file</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.FileName || "N/A"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Ngày tải lên</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.UploadedDate ? new Date(selectedDetail.UploadedDate).toLocaleDateString("vi-VN") : "N/A"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">AI Score</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.AIScore ?? "Chưa phân tích"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">AI Parsed</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDetail.AIParsed ? "✅ Đã bóc tách" : "❌ Chưa bóc tách"}</div>
                </div>
              </div>
              {selectedDetail.FileUrl && (
              <a href={selectedDetail.FileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-3 rounded-xl">
                <ExternalLink className="w-4 h-4" /> Xem / Tải CV gốc
              </a>
              )}
              {selectedDetail.ParsedContent && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Nội dung bóc tách</div>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">{typeof selectedDetail.ParsedContent === 'string' ? selectedDetail.ParsedContent : JSON.stringify(selectedDetail.ParsedContent, null, 2)}</div>
              </div>
              )}
              {statusFilter === "pending" && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => { rejectCV(selectedDetail.Id); }} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối CV
                </button>
                <button onClick={() => { approveCV(selectedDetail.Id); }} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm transition-colors">
                  <CheckCircle className="w-4 h-4" /> Duyệt CV
                </button>
              </div>
              )}
              <button onClick={() => deleteCV(selectedDetail.Id)} className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 py-2.5 rounded-xl text-sm transition-colors">
                <Trash2 className="w-4 h-4" /> Xóa CV vĩnh viễn
              </button>
            </div> :
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <FileCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn một mục để xem chi tiết và kiểm duyệt</p>
            </div>
          }
        </div>
      </div>
    </div>);
}