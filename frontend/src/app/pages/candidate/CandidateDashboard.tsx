import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles, Brain, Eye, FileText, Briefcase, TrendingUp,
  MapPin, DollarSign, Clock, Star, ArrowRight, ChevronRight,
  CheckCircle, Target, Zap, Upload
} from "lucide-react";
import { mockJobs, mockApplications, mockCVs } from "../../data/mockData";

const aiSuggestedJobs = mockJobs.filter(j => j.status === "active").slice(0, 4);

export function CandidateDashboard() {
  const navigate = useNavigate();
  const [activeApplication] = useState(mockApplications.filter(a => a.candidateId === "c1"));

  const stats = [
    { label: "CV đã nộp", value: activeApplication.length, icon: FileText, color: "bg-indigo-50 text-indigo-600", trend: "+2 tuần này" },
    { label: "NTD đã xem CV", value: 8, icon: Eye, color: "bg-violet-50 text-violet-600", trend: "+3 hôm nay" },
    { label: "Lịch phỏng vấn", value: 2, icon: Briefcase, color: "bg-cyan-50 text-cyan-600", trend: "Sắp tới" },
    { label: "AI Match Score", value: "94%", icon: Brain, color: "bg-emerald-50 text-emerald-600", trend: "Top 5%" },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    reviewing: { label: "Đang xem xét", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    interview: { label: "Phỏng vấn", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    offer: { label: "Nhận offer", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    rejected: { label: "Không phù hợp", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white/5 translate-y-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <span className="text-indigo-200 text-sm">AI đã cập nhật gợi ý của bạn</span>
          </div>
          <h1 className="text-white mb-2">Xin chào, Minh Trí! 👋</h1>
          <p className="text-indigo-100 text-sm mb-5">AI đã tìm thấy <strong>12 công việc phù hợp</strong> với hồ sơ của bạn hôm nay.</p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/candidate/jobs")} className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors">
              <Briefcase className="w-4 h-4" /> Xem công việc phù hợp
            </button>
            <button onClick={() => navigate("/candidate/cv")} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm border border-white/20 transition-colors">
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
            <div className="text-2xl text-gray-900 mb-0.5" style={{ fontWeight: 700 }}>{stat.value}</div>
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
            <button onClick={() => navigate("/candidate/jobs")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {aiSuggestedJobs.map(job => (
              <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: job.companyLogoColor }}>
                    {job.companyLogo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{job.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg flex-shrink-0">
                        <Target className="w-3 h-3" />
                        <span className="text-xs" style={{ fontWeight: 600 }}>{job.aiMatchScore}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{job.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <DollarSign className="w-3 h-3" />{job.salary}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{job.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {job.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Ứng tuyển nhanh
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* CV Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-900">Hồ sơ của bạn</h3>
              <button onClick={() => navigate("/candidate/cv")} className="text-xs text-indigo-600">Quản lý</button>
            </div>
            <div className="space-y-3">
              {mockCVs.map(cv => (
                <div key={cv.id} className={`p-3 rounded-xl border ${cv.isDefault ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className={`w-4 h-4 ${cv.isDefault ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className="text-xs text-gray-900 truncate flex-1" style={{ fontWeight: 500 }}>{cv.name}</span>
                    {cv.isDefault && <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">Mặc định</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{cv.uploadDate}</span>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Brain className="w-3 h-3" />
                      <span style={{ fontWeight: 600 }}>AI: {cv.aiScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/candidate/cv")} className="w-full mt-3 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 text-xs rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
              <Upload className="w-3 h-3" /> Tải lên CV mới
            </button>
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-900">Ứng tuyển gần đây</h3>
              <button onClick={() => navigate("/candidate/applications")} className="text-xs text-indigo-600">Xem tất cả</button>
            </div>
            <div className="space-y-3">
              {activeApplication.slice(0, 3).map(app => {
                const sc = statusConfig[app.status] || statusConfig.pending;
                return (
                  <div key={app.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: app.companyLogoColor }}>
                      {app.companyLogo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 500 }}>{app.jobTitle}</div>
                      <div className="text-xs text-gray-400">{app.company}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border ${sc.bg} ${sc.color} flex-shrink-0`} style={{ fontWeight: 500 }}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3">Hoàn thiện hồ sơ</h3>
            <div className="space-y-2 mb-3">
              {[
                { label: "Thông tin cá nhân", done: true },
                { label: "Kinh nghiệm làm việc", done: true },
                { label: "Upload CV", done: true },
                { label: "Portfolio/Liên kết", done: false },
                { label: "Kỹ năng chi tiết", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${item.done ? "text-emerald-500" : "text-gray-200"}`} />
                  <span className={`text-xs ${item.done ? "text-gray-700" : "text-gray-400"}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Mức độ hoàn thiện</span>
                <span className="text-indigo-600" style={{ fontWeight: 600 }}>60%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: "60%" }}></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Hồ sơ hoàn thiện hơn → AI match tốt hơn!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
