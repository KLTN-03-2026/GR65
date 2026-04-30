import { useState, useEffect, useCallback } from "react";
import {
  Search, MapPin, DollarSign, Clock, Briefcase, Brain, Target,
  ChevronDown, Eye, Zap, Building2, SlidersHorizontal,
  Bookmark, ArrowUpRight, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { API_URL as API_BASE } from "../../../lib/api";

const categories = ["Tất cả", "Lập trình", "Thiết kế", "Marketing", "Data & AI", "DevOps", "Quản lý sản phẩm"];
const locations = ["Tất cả địa điểm", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote"];
const types = ["Tất cả loại", "Full-time", "Part-time", "Remote", "Hybrid"];

export function JobSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [location, setLocation] = useState("Tất cả địa điểm");
  const [type, setType] = useState("Tất cả loại");
  const [showFilters, setShowFilters] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedJob, setSelectedJob] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applying, setApplying] = useState(false);

  // ── Fetch jobs từ API ──────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "Tất cả") params.set("category", category);
      if (location !== "Tất cả địa điểm") params.set("location", location);
      if (type !== "Tất cả loại") params.set("type", type);

      const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      const data = await res.json();

      setJobs(data.jobs || []);
      // Auto-chọn job đầu tiên nếu chưa chọn gì
      if (data.jobs?.length > 0 && !selectedJob) {
        setSelectedJob(data.jobs[0].id);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách jobs:", err);
      setError("Không thể tải danh sách công việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [query, category, location, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // ── Ứng tuyển ─────────────────────────────────
  const handleApply = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để ứng tuyển.");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi ứng tuyển");
      setAppliedJobs((prev) => new Set(prev).add(jobId));
      toast.success("Đã nộp hồ sơ thành công! Nhà tuyển dụng sẽ liên hệ sớm.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  const selectedJobData = jobs.find((j) => j.id === selectedJob);
  const activeCount = jobs.filter((j) => j.status === "active").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900">Tìm kiếm việc làm</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading
            ? "Đang tải danh sách công việc..."
            : `Tìm thấy ${activeCount} công việc phù hợp`}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên công việc, công ty, kỹ năng..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              showFilters
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-2 gap-3">
            {[
              { label: "Địa điểm", value: location, onChange: setLocation, options: locations, icon: MapPin },
              { label: "Loại hình", value: type, onChange: setType, options: types, icon: Clock },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs text-gray-500 mb-1.5 block">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
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
            <span className="text-sm text-gray-500">{jobs.length} kết quả</span>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-violet-600">Sắp xếp theo AI Match</span>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-400">Đang tải công việc...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchJobs}
                className="mt-3 text-xs text-indigo-600 hover:underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && jobs.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Không tìm thấy kết quả phù hợp</p>
            </div>
          )}

          {/* Job cards */}
          {!loading &&
            !error &&
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                  selectedJob === job.id
                    ? "border-indigo-400 shadow-md"
                    : "border-gray-100 hover:border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                    style={{ fontWeight: 700, backgroundColor: "#6366f1" }}
                  >
                    {typeof job.companyLogo === "string" && job.companyLogo.length <= 2
                      ? job.companyLogo
                      : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                          {job.title}
                        </h4>
                        <p className="text-xs text-gray-400">{job.company}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {job.aiMatchScore > 0 && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg">
                            <Target className="w-3 h-3" />
                            <span className="text-xs" style={{ fontWeight: 600 }}>
                              {job.aiMatchScore}%
                            </span>
                          </div>
                        )}
                        {job.featured && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                            ⭐ Nổi bật
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <DollarSign className="w-3 h-3" />
                        {job.salary}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skills.slice(0, 2).map((s) => (
                        <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 2 && (
                        <span className="text-xs text-gray-400">+{job.skills.length - 2}</span>
                      )}
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
        </div>

        {/* Job Detail */}
        <div className="lg:col-span-3">
          {selectedJobData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-indigo-500"
                    style={{ fontWeight: 700, fontSize: 18 }}
                  >
                    {selectedJobData.companyLogo?.length <= 2
                      ? selectedJobData.companyLogo
                      : <Building2 className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-gray-900 mb-0.5">{selectedJobData.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          {selectedJobData.company}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setBookmarked((prev) => {
                            const n = new Set(prev);
                            if (n.has(selectedJobData.id)) n.delete(selectedJobData.id);
                            else n.add(selectedJobData.id);
                            return n;
                          })
                        }
                        className={`p-2 rounded-xl transition-colors ${
                          bookmarked.has(selectedJobData.id)
                            ? "bg-amber-100 text-amber-600"
                            : "bg-gray-100 text-gray-400 hover:text-amber-600"
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${bookmarked.has(selectedJobData.id) ? "fill-amber-500" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Match Bar (nếu có score) */}
                {selectedJobData.aiMatchScore > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-indigo-700" style={{ fontWeight: 600 }}>
                          AI Match Score
                        </span>
                      </div>
                      <span className="text-indigo-700" style={{ fontWeight: 700, fontSize: 18 }}>
                        {selectedJobData.aiMatchScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{ width: `${selectedJobData.aiMatchScore}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: MapPin, label: selectedJobData.location },
                    { icon: DollarSign, label: selectedJobData.salary },
                    { icon: Clock, label: selectedJobData.type },
                    { icon: Briefcase, label: selectedJobData.experience },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      {item.label || "—"}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
                {selectedJobData.description && (
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3">Mô tả công việc</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedJobData.description}</p>
                  </div>
                )}
                {selectedJobData.requirements?.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3">Yêu cầu</h3>
                    <ul className="space-y-2">
                      {selectedJobData.requirements.map((r, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedJobData.benefits?.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3">Phúc lợi</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobData.benefits.map((b, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedJobData.skills?.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3">Kỹ năng yêu cầu</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobData.skills.map((s) => (
                        <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {selectedJobData.applicants} ứng viên
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Hạn: {selectedJobData.deadline}
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3">
                {appliedJobs.has(selectedJobData.id) ? (
                  <div className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Đã ứng tuyển thành công
                  </div>
                ) : selectedJobData.status === "active" ? (
                  <button
                    onClick={() => handleApply(selectedJobData.id)}
                    disabled={applying}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {applying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Ứng tuyển ngay
                  </button>
                ) : (
                  <div className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm text-center">
                    Đã hết hạn
                  </div>
                )}
                <button className="px-4 py-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {loading ? "Đang tải..." : "Chọn công việc để xem chi tiết"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}