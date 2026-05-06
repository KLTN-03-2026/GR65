import { useState, useEffect } from "react";
import {
  Users, Shield, Lock, Unlock, Search,
  Mail, Calendar,
  Eye, ChevronDown, Crown, Plus, Loader2,
  ChevronLeft, ChevronRight, AlertCircle } from
"lucide-react";
import api from "../../../lib/api";
import { toast } from "sonner";

export function AccountManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const fetchUsers = async (page = 1, role = null, status = null, search = null) => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=${page}&limit=20`;
      const roleMap = { candidates: "Candidate", employers: "Employer", admins: "Admin" };
      const effectiveRole = role || (activeTab !== "all" ? roleMap[activeTab] : null);
      if (effectiveRole) url += `&role=${effectiveRole}`;
      if (status && status !== "all") url += `&status=${status}`;
      if (search) url += `&search=${search}`;

      const res = await api.get(url);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, null, statusFilter !== "all" ? statusFilter : null, query || null);
  }, [activeTab, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, null, statusFilter !== "all" ? statusFilter : null, query || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleToggleStatus = async (userId, currentStatus, name) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const action = newStatus === "active" ? "mở khóa" : "khóa";
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${name}" không?`)) return;
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`Tài khoản ${name} đã được ${action}`);
      // Update local state
      setUsers(prev => prev.map(u =>
        u.Id === userId ? { ...u, Status: newStatus } : u
      ));
    } catch (err) {
      console.error("Error toggling user status:", err);
      toast.error("Lỗi khi cập nhật trạng thái tài khoản");
    }
  };

  const handleSendEmail = async (userId, email) => {
    try {
      await api.post(`/api/admin/email/user/${userId}`, {
        subject: "Thông báo từ AIRecruit",
        content: `<h2>Thông báo từ hệ thống AIRecruit</h2><p>Xin chào, đây là thông báo từ quản trị viên hệ thống.</p>`,
        isHtml: true
      });
      toast.success(`Email đã gửi tới ${email}`);
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Lỗi khi gửi email. Kiểm tra cấu hình SMTP.");
    }
  };

  const statusBadge = (status) => {
    const configs = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-200",
      suspended: "bg-red-50 text-red-500 border-red-200",
      pending: "bg-amber-50 text-amber-600 border-amber-200"
    };
    const labels = { active: "Hoạt động", suspended: "Đã khóa", pending: "Chờ xác thực" };
    return { class: configs[status] || configs.pending, label: labels[status] || status };
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (role) => {
    const colors = { Candidate: "#6366f1", Employer: "#8b5cf6", Admin: "#475569" };
    return colors[role] || "#94a3b8";
  };

  // Group users by role for "all" tab
  const candidates = users.filter(u => u.Role?.toLowerCase() === "candidate");
  const employers = users.filter(u => u.Role?.toLowerCase() === "employer");
  const admins = users.filter(u => u.Role?.toLowerCase() === "admin");

  const tabs = [
  { key: "all", label: "Tất cả", count: pagination.total },
  { key: "candidates", label: "Ứng viên" },
  { key: "employers", label: "Nhà tuyển dụng" },
  { key: "admins", label: "Quản trị viên" }];


  const renderUserTable = (userList, roleLabel, roleIcon, roleColor) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        {roleIcon}
        <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{roleLabel}</span>
        <span className={`text-xs ${roleColor} px-2 py-0.5 rounded-full`}>{userList.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              {["Tên / Email", "Vai trò", "Ngày tham gia", "Trạng thái", "Hành động"].map((h) =>
            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {userList.map((u) => {
              const status = u.Status || "active";
              const sb = statusBadge(status);
              const displayName = u.DisplayName || u.Email;
              return (
                <tr key={u.Id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: getAvatarColor(u.Role) }}>
                        {u.AvatarUrl ? <img src={u.AvatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover" /> : getInitials(displayName)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{displayName}</div>
                        <div className="text-xs text-gray-400">{u.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg ${u.Role === "Admin" ? "bg-amber-100 text-amber-700" : u.Role === "Employer" ? "bg-violet-100 text-violet-600" : "bg-indigo-100 text-indigo-600"}`}>{u.Role}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />{u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString("vi-VN") : "N/A"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border ${sb.class}`}>{sb.label}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.info(`Xem chi tiết ${displayName}`)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {u.Role === "Candidate" && (
                      <button onClick={() => handleSendEmail(u.Id, u.Email)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      )}
                      {u.Role !== "Admin" && (
                      <button onClick={() => handleToggleStatus(u.Id, status, displayName)} className={`p-2 rounded-lg transition-colors ${status === "active" ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-red-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                        {status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      )}
                    </div>
                  </td>
                </tr>);
            })}
            {userList.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý, khóa/mở và phân quyền tài khoản người dùng — Dữ liệu thật</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Tạo Sub-Admin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) =>
        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            {tab.count != null && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>
            )}
          </button>
        )}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, email..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none text-gray-600">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Đã khóa</option>
            <option value="pending">Chờ xác thực</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
        </div>
      ) : (
      <>
        {/* Render tables based on active tab */}
        {(activeTab === "all" || activeTab === "candidates") &&
          renderUserTable(
            activeTab === "all" ? candidates : users,
            "Ứng viên",
            <Users className="w-4 h-4 text-indigo-500" />,
            "bg-indigo-100 text-indigo-600"
          )
        }

        {(activeTab === "all" || activeTab === "employers") &&
          renderUserTable(
            activeTab === "all" ? employers : users,
            "Nhà tuyển dụng",
            <Shield className="w-4 h-4 text-violet-500" />,
            "bg-violet-100 text-violet-600"
          )
        }

        {(activeTab === "all" || activeTab === "admins") &&
          renderUserTable(
            activeTab === "all" ? admins : users,
            "Quản trị viên",
            <Crown className="w-4 h-4 text-amber-500" />,
            "bg-amber-100 text-amber-600"
          )
        }

        {/* Pagination */}
        {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Trang {pagination.page} / {pagination.totalPages} — Tổng {pagination.total} tài khoản
          </span>
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        )}
      </>
      )}
    </div>);
}