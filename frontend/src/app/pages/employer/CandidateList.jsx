import { useState } from "react";
import {
  Brain, Mail, MapPin, Briefcase,
  Search, Download, ChevronDown, User, Zap,
  Calendar, FileText } from
"lucide-react";
import { mockCandidates, mockApplications } from "../../data/mockData";
import { toast } from "sonner";



export function CandidateList() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("aiScore");
  const [selectedCandidate, setSelectedCandidate] = useState(mockCandidates[0]);

  const filtered = mockCandidates.
  filter((c) => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterType === "ai_suggested") return c.aiScore >= 85;
    if (filterType === "applied") return mockApplications.some((a) => a.candidateId === c.id);
    return true;
  }).
  sort((a, b) => sortBy === "aiScore" ? b.aiScore - a.aiScore : a.name.localeCompare(b.name));

  const getCandidateApplications = (id) => mockApplications.filter((a) => a.candidateId === id);

  const handleContact = (name) => {
    toast.success(`Đã gửi email mời phỏng vấn tới ${name}!`);
  };

  const scoreColor = (score) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Danh sách ứng viên</h1>
          <p className="text-sm text-gray-500 mt-1">Bao gồm ứng viên tự apply và AI chủ động gợi ý</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Xuất danh sách
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm ứng viên, kỹ năng..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="flex gap-2">
          {[
          { key: "all", label: "Tất cả" },
          { key: "applied", label: "Tự Apply" },
          { key: "ai_suggested", label: "AI Gợi ý (≥85%)" }].
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
        {/* Candidate list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-sm text-gray-500">{filtered.length} ứng viên</div>
          {filtered.map((c, idx) =>
          <div
            key={c.id}
            onClick={() => setSelectedCandidate(c)}
            className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedCandidate?.id === c.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
            
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: c.avatarColor }}>
                    {c.avatar}
                  </div>
                  {idx < 3 &&
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <span className="text-white" style={{ fontSize: 9, fontWeight: 700 }}>#{idx + 1}</span>
                    </div>
                }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{c.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{c.title}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${scoreColor(c.aiScore)}`}>
                      <Brain className="w-3 h-3" />
                      <span style={{ fontWeight: 700 }}>{c.aiScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />{c.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Briefcase className="w-3 h-3" />{c.experience}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.skills.slice(0, 3).map((s) =>
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                  )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getCandidateApplications(c.id).length > 0 &&
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Đã apply</span>
                  }
                    {c.aiScore >= 90 &&
                  <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Top Pick
                      </span>
                  }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Detail */}
        <div className="lg:col-span-3">
          {selectedCandidate ?
          <div className="space-y-4">
              {/* Profile header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 20, backgroundColor: selectedCandidate.avatarColor }}>
                    {selectedCandidate.avatar}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-gray-900 mb-1">{selectedCandidate.name}</h2>
                    <p className="text-gray-500 text-sm mb-2">{selectedCandidate.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedCandidate.location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{selectedCandidate.experience}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedCandidate.email}</span>
                    </div>
                  </div>
                  <div className={`flex flex-col items-center p-3 rounded-xl border ${scoreColor(selectedCandidate.aiScore)}`}>
                    <Brain className="w-5 h-5 mb-1" />
                    <span className="text-xl" style={{ fontWeight: 800 }}>{selectedCandidate.aiScore}%</span>
                    <span className="text-xs opacity-70">AI Score</span>
                  </div>
                </div>

                {/* AI Score breakdown */}
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 mb-5">
                  <div className="text-sm text-indigo-800 mb-3" style={{ fontWeight: 500 }}>Phân tích AI</div>
                  <div className="space-y-2">
                    {[
                  { label: "Kỹ năng kỹ thuật", score: 96 },
                  { label: "Kinh nghiệm", score: 90 },
                  { label: "Học vấn", score: 85 },
                  { label: "Soft skills", score: 88 }].
                  map((item) =>
                  <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-indigo-600 w-32 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${item.score}%` }}></div>
                        </div>
                        <span className="text-xs text-indigo-700 w-8" style={{ fontWeight: 600 }}>{item.score}%</span>
                      </div>
                  )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Mức lương mong muốn</div>
                    <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedCandidate.salary}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Thời gian có thể bắt đầu</div>
                    <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedCandidate.availability}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Học vấn</div>
                    <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedCandidate.education}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Số CV</div>
                    <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedCandidate.cvCount} bản CV</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-xs text-gray-400 mb-2">Kỹ năng</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((s) =>
                  <span key={s} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{s}</span>
                  )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => handleContact(selectedCandidate.name)} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm transition-colors">
                    <Mail className="w-4 h-4" /> Gửi email mời
                  </button>
                  <button onClick={() => {toast.success("Đã đặt lịch phỏng vấn!");}} className="flex-1 flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2.5 rounded-xl text-sm transition-colors">
                    <Calendar className="w-4 h-4" /> Đặt lịch PV
                  </button>
                </div>
              </div>

              {/* Application history */}
              {getCandidateApplications(selectedCandidate.id).length > 0 &&
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Lịch sử ứng tuyển</h3>
                  <div className="space-y-2">
                    {getCandidateApplications(selectedCandidate.id).map((app) =>
                <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate" style={{ fontWeight: 500 }}>{app.jobTitle}</div>
                          <div className="text-xs text-gray-400">{app.appliedDate}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${
                  app.status === "interview" ? "bg-indigo-100 text-indigo-600" :
                  app.status === "offer" ? "bg-emerald-100 text-emerald-600" :
                  app.status === "rejected" ? "bg-red-100 text-red-500" :
                  "bg-gray-100 text-gray-500"}`
                  }>{app.status}</span>
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