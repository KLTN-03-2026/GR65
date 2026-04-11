import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search, MapPin, DollarSign, Clock, Briefcase, Brain, Target,
  Filter, ChevronDown, Star, Eye, Zap, Building2, SlidersHorizontal,
  X, Bookmark, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

const categories = ["Tất cả", "Lập trình", "Thiết kế", "Marketing", "Data & AI", "DevOps", "Quản lý sản phẩm"];
const locations = ["Tất cả địa điểm", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote"];
const salaryRanges = ["Tất cả mức lương", "10-20 triệu", "20-35 triệu", "35-50 triệu", "50+ triệu"];
const types = ["Tất cả loại", "Full-time", "Part-time", "Remote", "Hybrid"];

export function JobSearch() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [location, setLocation] = useState("Tất cả địa điểm");
  const [salary, setSalary] = useState("Tất cả mức lương");
  const [type, setType] = useState("Tất cả loại");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    axios.get('http://localhost:5000/api/jobs').then(res => {
      const parsedJobs = res.data.map((j: any) => ({
         id: j.Id,
         title: j.Title,
         company: j.CompanyName || 'No Name CO',
         companyLogo: (j.CompanyName || 'J').charAt(0),
         companyLogoColor: j.CompanyLogoColor || '#4F46E5',
         location: j.Location || '',
         salary: j.SalaryRange || '',
         experience: j.ExperienceReq || '',
         type: j.JobType || '',
         category: j.Category || 'Tất cả',
         skills: j.SkillsReqJson ? JSON.parse(j.SkillsReqJson) : [],
         requirements: j.Requirements ? j.Requirements.split('\\n') : ["Đang cập nhật..."],
         benefits: j.Benefits ? j.Benefits.split('\\n') : ["Bảo hiểm", "Lương thưởng"],
         description: j.Description || "Updating...",
         aiMatchScore: Math.floor(Math.random() * 30) + 70, // Giả lập chờ AI Vector Module Phase 3
         status: j.Status || 'active',
         featured: j.IsFeatured,
         views: j.Views || 0,
         applicants: j.Applicants || 0,
         deadline: "20-10-2026"
      }));
      setJobs(parsedJobs);
      if(parsedJobs.length > 0) setSelectedJob(parsedJobs[0].id);
    });
  }, []);

  const filtered = jobs.filter(j => {
    if (query && !j.title.toLowerCase().includes(query.toLowerCase()) && !j.company.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "Tất cả" && j.category !== category) return false;
    if (location !== "Tất cả địa điểm" && !j.location.includes(location.replace("Tất cả địa điểm", ""))) return false;
    return true;
  });

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  const handleApply = (jobId: string) => {
    setAppliedJobs(prev => new Set(prev).add(jobId));
    toast.success("Đã nộp hồ sơ thành công! Nhà tuyển dụng sẽ liên hệ với bạn sớm.");
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-200",
    closed: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900">Tìm kiếm việc làm</h1>
        <p className="text-sm text-gray-500 mt-1">Hệ thống gợi ý {jobs.length} công việc phù hợp</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo tên công việc, công ty, kỹ năng..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${category === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {cat}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Địa điểm", value: location, onChange: setLocation, options: locations, icon: MapPin },
              { label: "Mức lương", value: salary, onChange: setSalary, options: salaryRanges, icon: DollarSign },
              { label: "Loại hình", value: type, onChange: setType, options: types, icon: Clock },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs text-gray-500 mb-1.5 block">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <select value={f.value} onChange={e => f.onChange(e.target.value)} className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Job list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{filtered.length} kết quả</span>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-violet-600">Sắp xếp theo AI Match</span>
            </div>
          </div>

          {filtered.map(job => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedJob === job.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: job.companyLogoColor }}>
                  {job.companyLogo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{job.title}</h4>
                      <p className="text-xs text-gray-400">{job.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg">
                        <Target className="w-3 h-3" />
                        <span className="text-xs" style={{ fontWeight: 600 }}>{job.aiMatchScore}%</span>
                      </div>
                      {job.featured && <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">⭐ Nổi bật</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />{job.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <DollarSign className="w-3 h-3" />{job.salary}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills.slice(0, 2).map(s => (
                      <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{s}</span>
                    ))}
                    {job.skills.length > 2 && <span className="text-xs text-gray-400">+{job.skills.length - 2}</span>}
                  </div>
                </div>
              </div>

              {appliedJobs.has(job.id) && (
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2">
                  <Zap className="w-3 h-3" /> Đã ứng tuyển
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Không tìm thấy kết quả phù hợp</p>
            </div>
          )}
        </div>

        {/* Job Detail */}
        <div className="lg:col-span-3">
          {selectedJobData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 18, backgroundColor: selectedJobData.companyLogoColor }}>
                    {selectedJobData.companyLogo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-gray-900 mb-0.5">{selectedJobData.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />{selectedJobData.company}
                        </div>
                      </div>
                      <button onClick={() => setBookmarked(prev => { const n = new Set(prev); if (n.has(selectedJobData.id)) n.delete(selectedJobData.id); else n.add(selectedJobData.id); return n; })} className={`p-2 rounded-xl transition-colors ${bookmarked.has(selectedJobData.id) ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 hover:text-amber-600"}`}>
                        <Bookmark className={`w-4 h-4 ${bookmarked.has(selectedJobData.id) ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Match Bar */}
                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs text-indigo-700" style={{ fontWeight: 600 }}>AI Match Score</span>
                    </div>
                    <span className="text-indigo-700" style={{ fontWeight: 700, fontSize: 18 }}>{selectedJobData.aiMatchScore}%</span>
                  </div>
                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${selectedJobData.aiMatchScore}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: MapPin, label: selectedJobData.location },
                    { icon: DollarSign, label: selectedJobData.salary },
                    { icon: Clock, label: selectedJobData.type },
                    { icon: Briefcase, label: selectedJobData.experience },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <item.icon className="w-4 h-4 text-gray-400" />{item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Mô tả công việc</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedJobData.description}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Yêu cầu</h3>
                  <ul className="space-y-2">
                    {selectedJobData.requirements.map(r => (
                      <li key={r} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></div>{r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Phúc lợi</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobData.benefits.map(b => (
                      <span key={b} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">{b}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Kỹ năng yêu cầu</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobData.skills.map(s => (
                      <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{selectedJobData.views} lượt xem</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{selectedJobData.applicants} ứng viên</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Hạn: {selectedJobData.deadline}</span>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3">
                {appliedJobs.has(selectedJobData.id) ? (
                  <div className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Đã ứng tuyển thành công
                  </div>
                ) : selectedJobData.status === "active" ? (
                  <button onClick={() => handleApply(selectedJobData.id)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Ứng tuyển ngay
                  </button>
                ) : (
                  <div className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm text-center">Đã hết hạn</div>
                )}
                <button className="px-4 py-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn công việc để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
