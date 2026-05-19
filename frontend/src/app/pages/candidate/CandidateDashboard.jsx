import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles, Brain, Eye, FileText, Briefcase, TrendingUp,
  MapPin, DollarSign, Clock, ChevronRight,
  CheckCircle, Target, Zap, Upload, Loader2, Building2,
} from "lucide-react";

import { API_URL as API_BASE } from "../../../lib/api";

const statusConfig = {
  pending:   { label: "Chờ duyệt",     color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  reviewing: { label: "Đang xem xét",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  interview: { label: "Phỏng vấn",     color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  offer:     { label: "Nhận offer",    color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200" },
  rejected:  { label: "Không phù hợp",color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

export function CandidateDashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  // ── State ────────────────────────────────────────
  const [profile, setProfile]           = useState(null);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cvs, setCvs]                   = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Fetch dữ liệu từ API ─────────────────────────
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        // 1. Lấy profile (tên + thông tin)
        const profileRes = await fetch(`${API_BASE}/api/profile/me`, { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
        }

        // 2. Lấy jobs gợi ý (4 jobs active mới nhất)
        const jobsRes = await fetch(`${API_BASE}/api/jobs`);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setSuggestedJobs((jobsData.jobs || []).slice(0, 4));
        }

        // 3. Lấy đơn ứng tuyển của ứng viên
        const appRes = await fetch(`${API_BASE}/api/applications/candidate/me`, { headers });
        if (appRes.ok) {
          const appData = await appRes.json();
          // Endpoint trả array trực tiếp, map status → stage cho tương thích
          const apps = (Array.isArray(appData) ? appData : appData.applications || []).map(a => ({
            ...a,
            stage: a.stage || a.status || 'pending',
          }));
          setApplications(apps);
        }

        // 4. Lấy danh sách CV
        const cvRes = await fetch(`${API_BASE}/api/cv`, { headers });
        if (cvRes.ok) {
          const cvData = await cvRes.json();
          setCvs(cvData.cvs || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ── Tính toán stats ──────────────────────────────
  const firstName = profile?.name?.split(" ").pop() || "bạn";

  // Tính % hoàn thiện hồ sơ
  const profileFields = [
    { label: "Thông tin cá nhân", done: !!(profile?.name && profile?.phone) },
    { label: "Chức danh nghề nghiệp", done: !!profile?.title },
    { label: "Upload CV", done: cvs.length > 0 },
    { label: "Kỹ năng", done: !!(profile?.skills && profile.skills.length > 0) },
    { label: "Mức lương kỳ vọng", done: !!profile?.expectedSalary },
  ];
  const completedCount = profileFields.filter((f) => f.done).length;
  const completionPct = Math.round((completedCount / profileFields.length) * 100);

  const stats = [
    {
      label: "CV đã nộp",
      value: applications.length,
      icon: FileText,
      color: "bg-indigo-50 text-indigo-600",
      trend: "Tổng số đơn",
    },
    {
      label: "NTD đã xem CV",
      value: applications.filter((a) => a.cvRead).length,
      icon: Eye,
      color: "bg-violet-50 text-violet-600",
      trend: "Lượt xem CV",
    },
    {
      label: "Lịch phỏng vấn",
      value: applications.filter((a) => a.stage === "interview").length,
      icon: Briefcase,
      color: "bg-cyan-50 text-cyan-600",
      trend: "Sắp tới",
    },
    {
      label: "Hồ sơ hoàn thiện",
      value: `${completionPct}%`,
      icon: Brain,
      color: "bg-emerald-50 text-emerald-600",
      trend: `${completedCount}/${profileFields.length} mục`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <span className="text-indigo-200 text-sm">AI đã cập nhật gợi ý của bạn</span>
          </div>
          <h1 className="text-white mb-2">
            Xin chào, {firstName}! 👋
          </h1>
          <p className="text-indigo-100 text-sm mb-5">
            AI đã tìm thấy{" "}
            <strong>{suggestedJobs.length} công việc phù hợp</strong> với hồ sơ của bạn hôm nay.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/candidate/jobs")}
              className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
            >
              <Briefcase className="w-4 h-4" /> Xem công việc phù hợp
            </button>
            <button
              onClick={() => navigate("/candidate/cv")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm border border-white/20 transition-colors"
            >
              <Upload className="w-4 h-4" /> Cập nhật CV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl text-gray-900 mb-0.5" style={{ fontWeight: 700 }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Suggested Jobs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">AI Gợi ý việc làm</h3>
                <p className="text-xs text-gray-400">Dựa trên CV & hành vi của bạn</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/candidate/jobs")}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {suggestedJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chưa có công việc gợi ý</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {suggestedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate("/candidate/jobs")}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 bg-indigo-500"
                      style={{ fontWeight: 700 }}
                    >
                      {job.companyLogo?.length <= 2 ? job.companyLogo : <Building2 className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {job.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                        </div>
                        {job.featured && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex-shrink-0">
                            ⭐ Nổi bật
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />{job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <DollarSign className="w-3 h-3" />{job.salary}
                          </span>
                        )}
                        {job.type && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{job.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {job.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate("/candidate/jobs"); }}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* CV Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-900">Hồ sơ của bạn</h3>
              <button onClick={() => navigate("/candidate/cv")} className="text-xs text-indigo-600">
                Quản lý
              </button>
            </div>
            {cvs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có CV nào được tải lên</p>
            ) : (
              <div className="space-y-3">
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    className={`p-3 rounded-xl border ${cv.isDefault ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className={`w-4 h-4 ${cv.isDefault ? "text-indigo-600" : "text-gray-400"}`} />
                      <span className="text-xs text-gray-900 truncate flex-1" style={{ fontWeight: 500 }}>
                        {cv.fileName || cv.name}
                      </span>
                      {cv.isDefault && (
                        <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">Mặc định</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {cv.uploadedDate
                          ? new Date(cv.uploadedDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                      {cv.aiScore > 0 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <Brain className="w-3 h-3" />
                          <span style={{ fontWeight: 600 }}>AI: {cv.aiScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate("/candidate/cv")}
              className="w-full mt-3 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 text-xs rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-3 h-3" /> Tải lên CV mới
            </button>
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-900">Ứng tuyển gần đây</h3>
              <button
                onClick={() => navigate("/candidate/applications")}
                className="text-xs text-indigo-600"
              >
                Xem tất cả
              </button>
            </div>
            {applications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Bạn chưa ứng tuyển công việc nào</p>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 3).map((app) => {
                  const sc = statusConfig[app.stage] || statusConfig.pending;
                  return (
                    <div key={app.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 bg-indigo-500">
                        {app.companyLogo?.length <= 2 ? app.companyLogo : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 500 }}>
                          {app.jobTitle || app.title}
                        </div>
                        <div className="text-xs text-gray-400">{app.companyName || app.company}</div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg border ${sc.bg} ${sc.color} flex-shrink-0`}
                        style={{ fontWeight: 500 }}
                      >
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3">Hoàn thiện hồ sơ</h3>
            <div className="space-y-2 mb-3">
              {profileFields.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-4 h-4 flex-shrink-0 ${item.done ? "text-emerald-500" : "text-gray-200"}`}
                  />
                  <span className={`text-xs ${item.done ? "text-gray-700" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Mức độ hoàn thiện</span>
                <span className="text-indigo-600" style={{ fontWeight: 600 }}>{completionPct}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Hồ sơ hoàn thiện hơn → AI match tốt hơn!</p>
          </div>
        </div>
      </div>
    </div>
  );
}