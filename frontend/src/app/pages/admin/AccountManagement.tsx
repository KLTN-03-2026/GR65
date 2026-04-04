import { useState } from "react";
import {
  Users, Shield, Lock, Unlock, Search, Filter, MoreVertical,
  CheckCircle, XCircle, AlertCircle, Mail, Calendar, Ban,
  Eye, ChevronDown, UserCheck, UserX, Crown, Plus
} from "lucide-react";
import { mockCandidates, mockEmployers } from "../../data/mockData";
import { toast } from "sonner";

type TabType = "all" | "candidates" | "employers" | "admins";

const mockAdmins = [
  { id: "a1", name: "Nguyễn Admin", email: "admin@airecruit.vn", avatar: "NA", avatarColor: "#475569", role: "Super Admin", status: "active", joinDate: "2023-01-01", lastActive: "Hôm nay" },
  { id: "a2", name: "Trần Sub-Admin", email: "subadmin@airecruit.vn", avatar: "TA", avatarColor: "#64748b", role: "Sub-Admin", status: "active", joinDate: "2023-06-15", lastActive: "Hôm qua" },
];

export function AccountManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, string>>(
    Object.fromEntries(mockCandidates.map(c => [c.id, c.status]))
  );
  const [employerStatuses, setEmployerStatuses] = useState<Record<string, string>>(
    Object.fromEntries(mockEmployers.map(e => [e.id, e.status]))
  );

  const handleToggleCandidateStatus = (id: string, name: string) => {
    setCandidateStatuses(prev => {
      const newStatus = prev[id] === "active" ? "suspended" : "active";
      toast.success(`Tài khoản ${name} đã được ${newStatus === "active" ? "mở khóa" : "khóa"}`);
      return { ...prev, [id]: newStatus };
    });
  };

  const handleToggleEmployerStatus = (id: string, name: string) => {
    setEmployerStatuses(prev => {
      const newStatus = prev[id] === "active" ? "suspended" : "active";
      toast.success(`Tài khoản ${name} đã được ${newStatus === "active" ? "mở khóa" : "khóa"}`);
      return { ...prev, [id]: newStatus };
    });
  };

  const statusBadge = (status: string) => {
    const configs = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-200",
      suspended: "bg-red-50 text-red-500 border-red-200",
      pending: "bg-amber-50 text-amber-600 border-amber-200",
    };
    const labels = { active: "Hoạt động", suspended: "Đã khóa", pending: "Chờ xác thực" };
    return { class: configs[status as keyof typeof configs] || configs.pending, label: labels[status as keyof typeof labels] || status };
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: mockCandidates.length + mockEmployers.length + mockAdmins.length },
    { key: "candidates", label: "Ứng viên", count: mockCandidates.length },
    { key: "employers", label: "Nhà tuyển dụng", count: mockEmployers.length },
    { key: "admins", label: "Quản trị viên", count: mockAdmins.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý, khóa/mở và phân quyền tài khoản người dùng</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Tạo Sub-Admin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, email..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none text-gray-600">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Đã khóa</option>
            <option value="pending">Chờ xác thực</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Candidates table */}
      {(activeTab === "all" || activeTab === "candidates") && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Ứng viên</span>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{mockCandidates.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {["Tên / Email", "Vị trí", "CV đã nộp", "Ngày tham gia", "Trạng thái", "Hành động"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockCandidates.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase())).map(c => {
                  const status = candidateStatuses[c.id] || c.status;
                  const sb = statusBadge(status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: c.avatarColor }}>
                            {c.avatar}
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{c.name}</div>
                            <div className="text-xs text-gray-400">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-600">{c.title}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-600">{c.appliedJobs} hồ sơ</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />{c.joinDate}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border ${sb.class}`}>{sb.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toast.info(`Đang xem hồ sơ ${c.name}`)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => toast.success(`Email đã gửi tới ${c.email}`)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleCandidateStatus(c.id, c.name)} className={`p-2 rounded-lg transition-colors ${status === "active" ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-red-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                            {status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employers table */}
      {(activeTab === "all" || activeTab === "employers") && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Nhà tuyển dụng</span>
            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">{mockEmployers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {["Công ty / Email", "Ngành nghề", "JD đang tuyển", "Gói cước", "Trạng thái", "Hành động"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockEmployers.map(e => {
                  const status = employerStatuses[e.id] || e.status;
                  const sb = statusBadge(status);
                  const planColors: Record<string, string> = { Basic: "bg-gray-100 text-gray-600", Pro: "bg-indigo-100 text-indigo-600", Enterprise: "bg-violet-100 text-violet-600" };
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: e.logoColor }}>
                            {e.logo}
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{e.name}</div>
                            <div className="text-xs text-gray-400">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-600">{e.industry}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-600">{e.openJobs} bài</span></td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg ${planColors[e.plan] || planColors.Basic}`}>{e.plan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border ${sb.class}`}>{sb.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toast.info(`Xem chi tiết ${e.name}`)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleEmployerStatus(e.id, e.name)} className={`p-2 rounded-lg transition-colors ${status === "active" ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-red-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                            {status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admins table */}
      {(activeTab === "all" || activeTab === "admins") && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Quản trị viên</span>
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{mockAdmins.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {["Tên / Email", "Vai trò", "Ngày tham gia", "Hoạt động gần nhất", "Trạng thái", "Hành động"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockAdmins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: a.avatarColor }}>
                          {a.avatar}
                        </div>
                        <div>
                          <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{a.name}</div>
                          <div className="text-xs text-gray-400">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg ${a.role === "Super Admin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{a.role}</span>
                    </td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-600">{a.joinDate}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-gray-600">{a.lastActive}</span></td>
                    <td className="px-4 py-4"><span className="text-xs px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200">Hoạt động</span></td>
                    <td className="px-4 py-4">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
