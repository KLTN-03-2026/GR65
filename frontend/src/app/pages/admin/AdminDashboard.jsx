import { useState, useEffect } from "react";
import {
  Users, Briefcase, Brain, TrendingUp, BarChart3,
  AlertCircle, CheckCircle, ArrowUpRight, Activity, Loader2 } from
"lucide-react";
import api from "../../../lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell } from
"recharts";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#94a3b8"];

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/stats/jobs'),
      api.get('/api/admin/stats/moderation')
    ]).then(([resDash, resJobs, resMod]) => {
      setStats(resDash.data.stats);
      setJobStats(resJobs.data.data);
      setModeration(resMod.data.data);
    }).catch(err => {
      console.error('Error loading admin dashboard:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500">Đang tải dữ liệu dashboard...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <span className="ml-3 text-gray-500">Không thể tải dữ liệu. Vui lòng thử lại.</span>
      </div>
    );
  }

  const growth = stats.monthlyGrowth || {};

  const topStats = [
  { label: "Tổng người dùng", value: (stats.totalUsers || 0).toLocaleString(), icon: Users, color: "bg-indigo-50 text-indigo-600", trend: `+${growth.users || 0}%` },
  { label: "Bài đăng đang hoạt động", value: (stats.activeJobs || 0).toLocaleString(), icon: Briefcase, color: "bg-violet-50 text-violet-600", trend: `+${growth.jobs || 0}%` },
  { label: "Tổng lượt Apply", value: (stats.totalApplications || 0).toLocaleString(), icon: Activity, color: "bg-cyan-50 text-cyan-600", trend: `+${growth.applications || 0}%` },
  { label: "Tuyển dụng thành công", value: (stats.successfulHires || 0).toLocaleString(), icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", trend: `+${growth.hires || 0}%` }];

  // Build category distribution from real job stats
  const categoryDistribution = jobStats?.byCategory?.map(c => ({
    name: c.Category || "Khác",
    value: c.Count
  })) || [];

  // Build chart data from job time stats
  const chartData = jobStats?.byTime?.map(t => ({
    month: t.Month,
    jobs: t.Count,
    applications: 0,
    hires: 0
  })) || [];

  // Build dynamic system alerts from moderation data
  const systemAlerts = [];
  if (moderation) {
    if (moderation.pendingJobs > 0) {
      systemAlerts.push({ type: "warning", message: `${moderation.pendingJobs} bài đăng đang chờ kiểm duyệt nội dung`, icon: AlertCircle, color: "text-amber-600 bg-amber-50 border-amber-200" });
    }
    if (moderation.pendingCVs > 0) {
      systemAlerts.push({ type: "info", message: `${moderation.pendingCVs} CV mới đang chờ duyệt`, icon: Brain, color: "text-violet-600 bg-violet-50 border-violet-200" });
    }
    if (moderation.rejectedJobs > 0) {
      systemAlerts.push({ type: "warning", message: `${moderation.rejectedJobs} bài đăng đã bị từ chối`, icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" });
    }
  }
  if (stats.aiProcessed > 0) {
    systemAlerts.push({ type: "info", message: `AI đã xử lý ${stats.aiProcessed} CV tổng cộng`, icon: Brain, color: "text-violet-600 bg-violet-50 border-violet-200" });
  }
  systemAlerts.push({ type: "success", message: "Hệ thống hoạt động ổn định", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" });

  const aiAccuracy = stats.aiAccuracy || 0;
  const aiImprovement = stats.aiImprovement || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">AIRecruit Admin Dashboard — Dữ liệu thật từ hệ thống</p>
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
        { label: "CV đã xử lý bởi AI", value: (stats.aiProcessed || 0).toLocaleString(), sub: "Bao gồm PDF, Word, OCR", color: "from-indigo-600 to-blue-700" },
        { label: "Tổng NTD đăng ký", value: (stats.totalEmployers || 0).toLocaleString(), sub: "", color: "from-cyan-600 to-teal-700" }].
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
              <h3 className="text-sm text-gray-900">Hoạt động theo tháng</h3>
              <p className="text-xs text-gray-400">Bài đăng mới theo thời gian</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px #0001", fontSize: 12 }} />
              <Area type="monotone" dataKey="jobs" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2} name="Bài đăng mới" />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
            Chưa có dữ liệu biểu đồ
          </div>
          )}
        </div>

        {/* Category pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Phân bổ ngành nghề</h3>
          {categoryDistribution.length > 0 ? (
          <>
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            )}
          </div>
          </>
          ) : (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            Chưa có dữ liệu ngành nghề
          </div>
          )}
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
            { label: "Nhà tuyển dụng", value: stats.totalEmployers || 0, total: stats.totalUsers || 1, color: "bg-violet-500" },
            { label: "Ứng viên + Khác", value: Math.max(0, (stats.totalUsers || 0) - (stats.totalEmployers || 0)), total: stats.totalUsers || 1, color: "bg-indigo-500" }].
            map((item) =>
            <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, item.value / item.total * 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs text-gray-500 mb-3">Thống kê nhanh</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
              { label: "Tổng bài đăng active", value: stats.activeJobs || 0 },
              { label: "Tổng ứng tuyển", value: stats.totalApplications || 0 },
              { label: "CV đã xử lý AI", value: stats.aiProcessed || 0 },
              { label: "Tuyển thành công", value: stats.successfulHires || 0 }].
              map((s) =>
              <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{s.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>);
}