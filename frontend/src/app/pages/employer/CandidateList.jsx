import { useState, useEffect } from "react";
import {
  Brain, Mail, MapPin, Briefcase,
  Search, Download, ChevronDown, User, Zap,
  Calendar, FileText 
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/api";

export function CandidateList() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("aiScore");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/api/applications/employer/me');
      setCandidates(res.data);
      if (res.data.length > 0 && !selectedCandidate) {
        setSelectedCandidate(res.data[0]);
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách ứng viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filtered = candidates
    .filter((c) => {
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filterType === "ai_suggested") return c.matchScore >= 85; 
      // Về mặt Logic hiện tại ai đã nộp thì có trong danh sách, nên "applied" = tất cả
      return true;
    })
    .sort((a, b) => sortBy === "aiScore" ? b.matchScore - a.matchScore : a.name.localeCompare(b.name));

  // Gom nhóm các application theo ứng viên nếu 1 ứng viên nộp nhiều job
  const getCandidateApplications = (id) => candidates.filter((a) => a.candidateId === id);

  const handleContact = (name) => {
    toast.success(`Đã gửi email mời phỏng vấn tới ${name}!`);
  };

  const handleUpdateStage = async (appId, newStage) => {
    try {
      await api.patch(`/api/applications/${appId}/stage`, { stage: newStage });
      toast.success("Cập nhật trạng thái thành công!");
      fetchCandidates();
    } catch (error) {
      toast.error("Lỗi khi chuyển trạng thái");
    }
  };

  const scoreColor = (score) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  if (loading) return <div>Đang tải ứng viên...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Danh sách ứng viên</h1>
          <p className="text-sm text-gray-500 mt-1">Bao gồm ứng viên đã ứng tuyển từ Database CSDL thật</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Xuất danh sách
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm ứng viên, kỹ năng..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="flex gap-2">
          {[
          { key: "all", label: "Tất cả" },
          { key: "ai_suggested", label: "AI Đề xuất (≥85%)" }].
          map((f) =>
          <button key={f.key} onClick={() => setFilterType(f.key)} className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${filterType === f.key ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"}`}>
              {f.label}
            </button>
          )}
        </div>
        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none text-gray-600">
            <option value="aiScore">Sắp xếp: AI Score</option>
            <option value="name">Sắp xếp: Tên</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="text-sm text-gray-500">{filtered.length} ứng viên</div>
          {filtered.map((c, idx) =>
          <div
            key={c.applicationId}
            onClick={() => setSelectedCandidate(c)}
            className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedCandidate?.applicationId === c.applicationId ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
            
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: "#6366f1" }}>
                    {typeof c.avatar === 'string' && c.avatar.length === 1 ? c.avatar : <User />}
                  </div>
                  {idx < 3 && sortBy === "aiScore" &&
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <span className="text-white" style={{ fontSize: 9, fontWeight: 700 }}>#{idx + 1}</span>
                    </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{c.name}</h4>
                      <p className="text-xs text-indigo-500 truncate" title="Job ứng tuyển">{c.jobTitle}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${scoreColor(c.matchScore)}`}>
                      <Brain className="w-3 h-3" />
                      <span style={{ fontWeight: 700 }}>{c.matchScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />{c.location || "Việt Nam"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Briefcase className="w-3 h-3" />{c.experience}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.skills && c.skills.slice(0, 3).map((s) =>
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedCandidate ?
          <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 20, backgroundColor: "#6366f1" }}>
                    {typeof selectedCandidate.avatar === 'string' && selectedCandidate.avatar.length === 1 ? selectedCandidate.avatar : <User className="w-8 h-8"/>}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-gray-900 mb-1">{selectedCandidate.name}</h2>
                    <p className="text-gray-500 text-sm mb-2">{selectedCandidate.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedCandidate.location || "VN"}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{selectedCandidate.experience}</span>
                    </div>
                  </div>
                  <div className={`flex flex-col items-center p-3 rounded-xl border ${scoreColor(selectedCandidate.matchScore)}`}>
                    <Brain className="w-5 h-5 mb-1" />
                    <span className="text-xl" style={{ fontWeight: 800 }}>{selectedCandidate.matchScore}%</span>
                    <span className="text-xs opacity-70">AI Match Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Ứng tuyển cho vị trí</div>
                    <div className="text-sm text-gray-900 font-semibold">{selectedCandidate.jobTitle}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="text-xs text-gray-400 mb-1">Thời gian nộp do AI phân tích</div>
                    <div className="text-sm text-gray-900 font-semibold">{new Date(selectedCandidate.appliedDate).toLocaleString('vi-VN')}</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-xs text-gray-400 mb-2">Kỹ năng ứng viên (AI tự trích xuất)</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills && selectedCandidate.skills.map((s) =>
                      <span key={s} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{s}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {selectedCandidate.cvUrl && (
                     <a href={`http://localhost:5000${selectedCandidate.cvUrl}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm transition-colors text-gray-700">
                       <FileText className="w-4 h-4" /> Xem trực tiếp CV
                     </a>
                  )}
                  <button onClick={() => handleContact(selectedCandidate.name)} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm transition-colors">
                    <Mail className="w-4 h-4" /> Gửi email mời
                  </button>
                  <button onClick={() => handleUpdateStage(selectedCandidate.applicationId, 'interview')} className="flex-1 flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2.5 rounded-xl text-sm transition-colors">
                    <Calendar className="w-4 h-4" /> Duyệt & Đặt PV
                  </button>
                </div>
              </div>

              {getCandidateApplications(selectedCandidate.candidateId).length > 0 &&
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Lịch sử ứng tuyển các Job khác của bạn</h3>
                  <div className="space-y-2">
                    {getCandidateApplications(selectedCandidate.candidateId).map((app) =>
                      <div key={app.applicationId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate" style={{ fontWeight: 500 }}>{app.jobTitle}</div>
                          <div className="text-xs text-gray-400">{new Date(app.appliedDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <select 
                           value={app.stage} 
                           onChange={(e) => handleUpdateStage(app.applicationId, e.target.value)}
                           className={`text-xs px-2 py-1 rounded-lg border-none outline-none ${
                             app.stage === "interview" ? "bg-indigo-100 text-indigo-600" :
                             app.stage === "offer" ? "bg-emerald-100 text-emerald-600" :
                             app.stage === "rejected" ? "bg-red-100 text-red-500" :
                             "bg-gray-200 text-gray-600"
                           }`}
                        >
                           <option value="pending">Chờ Duyệt</option>
                           <option value="reviewing">Đang xem xét</option>
                           <option value="interview">Phỏng vấn</option>
                           <option value="offer">Đã Offer</option>
                           <option value="rejected">Từ chối</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              }
            </div> :

          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn ứng viên để xem chi tiết</p>
            </div>
          }
        </div>
      </div>
    </div>);
}