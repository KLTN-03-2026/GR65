import { useNavigate } from "react-router";
import {
  Users, Briefcase, Brain, TrendingUp, Eye, Star, Clock,
  ChevronRight, Zap, Target, ArrowUpRight, CheckCircle, AlertCircle,
  BarChart3, Plus
} from "lucide-react";
import { mockApplications, mockJobs, mockCandidates } from "../../data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const chartData = [
  { day: "T2", applications: 12, views: 45 },
  { day: "T3", applications: 18, views: 62 },
  { day: "T4", applications: 9, views: 38 },
  { day: "T5", applications: 24, views: 78 },
  { day: "T6", applications: 31, views: 95 },
  { day: "T7", applications: 15, views: 52 },
  { day: "CN", applications: 8, views: 29 },
];

export function EmployerDashboard() {
  const navigate = useNavigate();
  const activeJobs = mockJobs.filter(j => j.employerId === "e1" && j.status === "active");
  const recentApps = mockApplications.slice(0, 5);
  const topCandidates = mockCandidates.sort((a, b) => b.aiScore - a.aiScore).slice(0, 4);

  const stats = [
    { label: "Bài đăng đang active", value: activeJobs.length, icon: Briefcase, color: "bg-indigo-50 text-indigo-600", trend: "+2 tuần này" },
    { label: "Tổng ứng viên", value: 24, icon: Users, color: "bg-violet-50 text-violet-600", trend: "+8 hôm nay" },
    { label: "AI Gợi ý mới", value: 11, icon: Brain, color: "bg-cyan-50 text-cyan-600", trend: "Score > 90%" },
    { label: "Tuyển thành công", value: 3, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", trend: "Tháng này" },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50" },
    reviewing: { label: "Đang xem", color: "text-blue-600", bg: "bg-blue-50" },
    interview: { label: "Phỏng vấn", color: "text-indigo-600", bg: "bg-indigo-50" },
    offer: { label: "Offer", color: "text-emerald-600", bg: "bg-emerald-50" },
    rejected: { label: "Từ chối", color: "text-red-500", bg: "bg-red-50" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Tổng quan tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-1">Chào mừng trở lại, TechVision Vietnam! Hôm nay có 8 hồ sơ mới.</p>
        </div>
        <button onClick={() => navigate("/employer/jobs")} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Đăng tuyển mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl text-gray-900 mb-0.5" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {s.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm text-gray-900">Hoạt động tuần này</h3>
              <p className="text-xs text-gray-400">Số lượng hồ sơ & lượt xem JD</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px #0001" }} />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} name="Hồ sơ" />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="#f5f3ff" strokeWidth={2} name="Lượt xem" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Alert Panel */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-violet-200" />
              <span className="text-sm" style={{ fontWeight: 600 }}>AI Engine Status</span>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "CV đã xử lý", value: "127 hôm nay" },
                { label: "Độ chính xác", value: "87.3%" },
                { label: "Feedback loops", value: "14 tuần này" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-violet-200">{item.label}</span>
                  <span className="text-white" style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl p-2.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white">Hệ thống đang hoạt động bình thường</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm text-gray-900 mb-3">Việc cần làm</h3>
            <div className="space-y-2">
              {[
                { text: "2 hồ sơ cần duyệt gấp", color: "text-red-500", icon: AlertCircle },
                { text: "3 ứng viên AI đề xuất mới", color: "text-violet-500", icon: Brain },
                { text: "1 lịch phỏng vấn sắp tới", color: "text-indigo-500", icon: Clock },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <item.icon className={`w-3.5 h-3.5 ${item.color} flex-shrink-0`} />
                  <span className="text-gray-600">{item.text}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm text-gray-900">Hồ sơ gần đây</h3>
            <button onClick={() => navigate("/employer/candidates")} className="text-xs text-indigo-600 flex items-center gap-1">Xem tất cả <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentApps.map(app => {
              const sc = statusConfig[app.status] || statusConfig.pending;
              return (
                <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/employer/candidates")}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: "#6366f1" }}>
                      {app.candidateName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 500 }}>{app.candidateName}</div>
                          <div className="text-xs text-gray-400 truncate">{app.jobTitle}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${sc.bg} ${sc.color} flex-shrink-0`}>{sc.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-violet-600">
                          <Brain className="w-3 h-3" />
                          <span style={{ fontWeight: 600 }}>{app.aiScore}%</span>
                        </div>
                        {app.cvRead && <span className="text-xs text-emerald-600 flex items-center gap-1"><Eye className="w-3 h-3" />CV đã xem</span>}
                        {app.type === "ai_suggested" && <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">AI</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top AI Candidates */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm text-gray-900">Top AI-Ranked Candidates</h3>
            </div>
            <button onClick={() => navigate("/employer/candidates")} className="text-xs text-indigo-600 flex items-center gap-1">Xem tất cả <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="divide-y divide-gray-50">
            {topCandidates.map((c, idx) => (
              <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/employer/candidates")}>
                <div className="flex items-center gap-3">
                  <div className="text-lg text-gray-300 w-5 text-center" style={{ fontWeight: 700 }}>#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: c.avatarColor }}>
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 500 }}>{c.name}</div>
                        <div className="text-xs text-gray-400 truncate">{c.title}</div>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg flex-shrink-0">
                        <Target className="w-3 h-3" />
                        <span className="text-xs" style={{ fontWeight: 700 }}>{c.aiScore}%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm text-gray-900">Bài đăng đang tuyển</h3>
          <button onClick={() => navigate("/employer/jobs")} className="text-xs text-indigo-600 flex items-center gap-1">Quản lý <ChevronRight className="w-3 h-3" /></button>
        </div>
        <div className="divide-y divide-gray-50">
          {activeJobs.map(job => (
            <div key={job.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/employer/jobs")}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 500 }}>{job.title}</h4>
                  {job.featured && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Nổi bật</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicants} ứng viên</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-400" />{job.aiSuggestedCount} AI gợi ý</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{job.views} lượt xem</span>
                  <span>Hạn: {job.deadline}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((job.applicants / 50) * 100, 100)}%` }}></div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
