import {
  Users, Briefcase, Brain, TrendingUp, BarChart3,
  AlertCircle, CheckCircle, ArrowUpRight, Activity } from
"lucide-react";
import { mockAdminStats } from "../../data/mockData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell } from
"recharts";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#94a3b8"];

export function AdminDashboard() {
  const { chartData, categoryDistribution, aiAccuracy, aiImprovement } = mockAdminStats;

  const topStats = [
  { label: "Tổng người dùng", value: mockAdminStats.totalUsers.toLocaleString(), icon: Users, color: "bg-indigo-50 text-indigo-600", trend: `+${mockAdminStats.monthlyGrowth.users}%` },
  { label: "Bài đăng đang hoạt động", value: mockAdminStats.activeJobs.toLocaleString(), icon: Briefcase, color: "bg-violet-50 text-violet-600", trend: `+${mockAdminStats.monthlyGrowth.jobs}%` },
  { label: "Tổng lượt Apply", value: mockAdminStats.totalApplications.toLocaleString(), icon: Activity, color: "bg-cyan-50 text-cyan-600", trend: `+${mockAdminStats.monthlyGrowth.applications}%` },
  { label: "Tuyển dụng thành công", value: mockAdminStats.successfulHires.toLocaleString(), icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", trend: `+${mockAdminStats.monthlyGrowth.hires}%` }];


  const systemAlerts = [
  { type: "warning", message: "3 bài đăng đang chờ kiểm duyệt nội dung", icon: AlertCircle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { type: "info", message: "AI Feedback Loop đã xử lý 14 trường hợp hôm nay", icon: Brain, color: "text-violet-600 bg-violet-50 border-violet-200" },
  { type: "success", message: "Hệ thống hoạt động ổn định — Uptime 99.9%", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { type: "info", message: "2 tài khoản mới cần xác thực email", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200" }];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">AIRecruit Admin Dashboard — Cập nhật lần cuối: hôm nay 09:15</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Hệ thống online
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((s) =>
        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl text-gray-900 mb-0.5" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {s.trend} tháng trước
            </div>
          </div>
        )}
      </div>

      {/* AI Stats highlight */}
      <div className="grid grid-cols-3 gap-4">
        {[
        { label: "Độ chính xác AI", value: `${aiAccuracy}%`, sub: `+${aiImprovement}% so với tháng trước`, color: "from-violet-600 to-purple-700" },
        { label: "CV đã xử lý bởi AI", value: mockAdminStats.aiProcessed.toLocaleString(), sub: "Bao gồm PDF, Word, OCR", color: "from-indigo-600 to-blue-700" },
        { label: "Tổng NTD đăng ký", value: mockAdminStats.totalEmployers.toLocaleString(), sub: "", color: "from-cyan-600 to-teal-700" }].
        map((s) =>
        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white`}>
            <div className="text-3xl mb-1" style={{ fontWeight: 800 }}>{s.value}</div>
            <div className="text-sm text-white/90 mb-0.5" style={{ fontWeight: 500 }}>{s.label}</div>
            <div className="text-xs text-white/60">{s.sub}</div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm text-gray-900">Hoạt động 12 tháng</h3>
              <p className="text-xs text-gray-400">Lượt ứng tuyển, tuyển dụng thành công và bài đăng mới</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px #0001", fontSize: 12 }} />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2} name="Lượt Apply" />
              <Area type="monotone" dataKey="hires" stroke="#10b981" fill="url(#hireGrad)" strokeWidth={2} name="Tuyển thành công" />
              <Area type="monotone" dataKey="jobs" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Bài đăng mới" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Phân bổ ngành nghề</h3>
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie data={categoryDistribution} cx={80} cy={80} innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {categoryDistribution.map((_, i) =>
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                )}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {categoryDistribution.map((item, i) =>
            <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>{item.value}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System alerts & Quick stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Cảnh báo hệ thống</h3>
          <div className="space-y-3">
            {systemAlerts.map((alert, i) =>
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${alert.color}`}>
                <alert.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{alert.message}</span>
                <ArrowUpRight className="w-4 h-4 flex-shrink-0 ml-auto opacity-50 cursor-pointer" />
              </div>
            )}
          </div>
        </div>

        {/* Role breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Phân bổ người dùng</h3>
          <div className="space-y-4">
            {[
            { label: "Ứng viên", value: mockAdminStats.totalCandidates, total: mockAdminStats.totalUsers, color: "bg-indigo-500" },
            { label: "Nhà tuyển dụng", value: mockAdminStats.totalEmployers, total: mockAdminStats.totalUsers, color: "bg-violet-500" },
            { label: "Admin/Sub-admin", value: 8, total: mockAdminStats.totalUsers, color: "bg-slate-500" }].
            map((item) =>
            <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value / item.total * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs text-gray-500 mb-3">Hoạt động nhanh</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
              { label: "Tài khoản mới hôm nay", value: "47" },
              { label: "Đang online", value: "1,234" },
              { label: "CV đã xử lý hôm nay", value: "127" },
              { label: "Server load", value: "23%" }].
              map((s) =>
              <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>);

}