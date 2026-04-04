import { useState } from "react";
import { CreditCard, Users, TrendingUp, Check, Edit, DollarSign, Calendar, BarChart3, Zap, Shield, Crown, Star } from "lucide-react";
import { mockPackages } from "../../data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const revenueData = [
  { month: "T10", revenue: 4.2, subscribers: 980 },
  { month: "T11", revenue: 5.1, subscribers: 1050 },
  { month: "T12", revenue: 5.8, subscribers: 1145 },
  { month: "T1", revenue: 6.2, subscribers: 1200 },
  { month: "T2", revenue: 7.0, subscribers: 1260 },
  { month: "T3", revenue: 8.1, subscribers: 1282 },
];

const mockTransactions = [
  { id: "tx1", company: "NewStartup Co", plan: "Pro", amount: 2990000, date: "2024-03-28", status: "success", avatar: "NS", color: "#6366f1" },
  { id: "tx2", company: "BigCorp Ltd", plan: "Enterprise", amount: 8990000, date: "2024-03-27", status: "success", avatar: "BC", color: "#8b5cf6" },
  { id: "tx3", company: "SmallBiz", plan: "Basic", amount: 990000, date: "2024-03-27", status: "pending", avatar: "SB", color: "#f59e0b" },
  { id: "tx4", company: "TechHouse", plan: "Pro", amount: 2990000, date: "2024-03-26", status: "failed", avatar: "TH", color: "#ef4444" },
  { id: "tx5", company: "GreenVN", plan: "Pro", amount: 2990000, date: "2024-03-26", status: "success", avatar: "GV", color: "#10b981" },
];

const planIcons = { Basic: Shield, Pro: Star, Enterprise: Crown };
const planColors: Record<string, string> = { Basic: "#6b7280", Pro: "#6366f1", Enterprise: "#8b5cf6" };

export function PackageManagement() {
  const [packages] = useState(mockPackages);

  const totalMRR = packages.reduce((sum, pkg) => sum + (pkg.price * pkg.subscribers), 0);
  const totalSubscribers = packages.reduce((sum, pkg) => sum + pkg.subscribers, 0);

  const statusConfig: Record<string, { label: string; color: string }> = {
    success: { label: "Thành công", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    pending: { label: "Đang xử lý", color: "text-amber-600 bg-amber-50 border-amber-200" },
    failed: { label: "Thất bại", color: "text-red-500 bg-red-50 border-red-200" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900">Gói cước & Thanh toán</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý gói dịch vụ, theo dõi doanh thu và lịch sử thanh toán</p>
      </div>

      {/* Revenue highlights */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "MRR (Doanh thu tháng)", value: `${(totalMRR / 1000000).toFixed(1)}M đ`, color: "from-indigo-600 to-violet-700", icon: DollarSign },
          { label: "Tổng thuê bao", value: `${totalSubscribers.toLocaleString()}`, color: "from-violet-600 to-purple-700", icon: Users },
          { label: "ARR (Dự báo năm)", value: `${(totalMRR * 12 / 1000000000).toFixed(2)}B đ`, color: "from-emerald-600 to-teal-700", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white flex items-center gap-4`}>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl" style={{ fontWeight: 800 }}>{s.value}</div>
              <div className="text-sm text-white/80">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm text-gray-900">Doanh thu 6 tháng gần đây (triệu đ)</h3>
              <p className="text-xs text-gray-400">Tổng doanh thu và số lượng thuê bao</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px #0001", fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Doanh thu (M đ)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Package distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Phân bổ gói</h3>
          <div className="space-y-3">
            {packages.map(pkg => {
              const Icon = planIcons[pkg.name as keyof typeof planIcons] || Shield;
              const percentage = Math.round((pkg.subscribers / totalSubscribers) * 100);
              return (
                <div key={pkg.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: planColors[pkg.name] + "20" }}>
                        <Icon className="w-4 h-4" style={{ color: planColors[pkg.name] }} />
                      </div>
                      <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{pkg.name}</span>
                    </div>
                    <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{pkg.subscribers}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: planColors[pkg.name] }}></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{percentage}% tổng thuê bao</span>
                    <span className="text-xs text-gray-500">{(pkg.price * pkg.subscribers / 1000000).toFixed(1)}M đ/tháng</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Package cards */}
      <div>
        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Chi tiết gói cước</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const Icon = planIcons[pkg.name as keyof typeof planIcons] || Shield;
            return (
              <div key={pkg.id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${pkg.popular ? "border-indigo-400" : "border-gray-100"}`}>
                {pkg.popular && (
                  <div className="text-xs text-indigo-600 mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-indigo-500 text-indigo-500" /> Phổ biến nhất
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: planColors[pkg.name] + "15" }}>
                      <Icon className="w-5 h-5" style={{ color: planColors[pkg.name] }} />
                    </div>
                    <span className="text-gray-900" style={{ fontWeight: 700 }}>{pkg.name}</span>
                  </div>
                  <button onClick={() => toast.info(`Chỉnh sửa gói ${pkg.name}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 800 }}>{(pkg.price / 1000).toFixed(0)}K đ<span className="text-gray-400 text-sm" style={{ fontWeight: 400 }}>/tháng</span></div>
                <div className="text-xs text-gray-400 mb-4">{pkg.subscribers} công ty đang dùng</div>
                <div className="space-y-1.5 mb-4">
                  {pkg.features.slice(0, 4).map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Doanh thu/tháng</span>
                    <span className="text-gray-900" style={{ fontWeight: 700 }}>{(pkg.price * pkg.subscribers / 1000000).toFixed(1)}M đ</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Giao dịch gần đây</span>
          </div>
          <button className="text-xs text-indigo-600 hover:underline">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                {["Công ty", "Gói", "Số tiền", "Ngày", "Trạng thái"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockTransactions.map(tx => {
                const sc = statusConfig[tx.status];
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ fontWeight: 700, backgroundColor: tx.color }}>
                          {tx.avatar}
                        </div>
                        <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{tx.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: planColors[tx.plan] + "15", color: planColors[tx.plan] }}>{tx.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{tx.amount.toLocaleString("vi-VN")} đ</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />{tx.date}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border ${sc.color}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
