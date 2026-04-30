import { useState, useEffect } from "react";
import {
  User, Mail, Lock, Shield, Save, Eye, EyeOff, AlertCircle,
  CheckCircle, Settings, Globe,
  Activity, Clock, Key, LogOut, MapPin, Loader2 } from
"lucide-react";
import api from "../../../lib/api";
import { toast } from "sonner";

const MOCK_SESSIONS = [
{ id: "s1", device: "Chrome trên Windows 11", location: "TP. Hồ Chí Minh", ip: "118.69.xxx.xxx", lastActive: "Hiện tại", current: true },
{ id: "s2", device: "Safari trên iPhone 15", location: "TP. Hồ Chí Minh", ip: "118.70.xxx.xxx", lastActive: "2 giờ trước", current: false }];

export function AdminProfile() {
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const [account, setAccount] = useState({
    name: "", email: "", phone: "", role: "Quản trị viên hệ thống",
    department: "", timezone: "Asia/Ho_Chi_Minh", language: "vi",
    avatar: "SA", avatarColor: "#475569", joinDate: ""
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false, registrationOpen: true, aiMatchingEnabled: true,
    emailNotifications: true, smsNotifications: false, autoApproveEmployers: false,
    autoApproveContent: false, maxCVSize: "10", sessionTimeout: "60",
    maxLoginAttempts: "5", debugMode: false
  });

  const [security, setSecurity] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "", twoFactor: false
  });

  // Load profile and settings from API
  useEffect(() => {
    Promise.all([
      api.get('/api/admin/profile'),
      api.get('/api/admin/settings').catch(() => ({ data: { settings: {} } }))
    ]).then(([resProfile, resSettings]) => {
      const p = resProfile.data.data;
      if (p) {
        setAccount(prev => ({
          ...prev,
          name: p.FullName || p.Email || "",
          email: p.Email || "",
          phone: p.Phone || "",
          department: p.Department || "",
          timezone: p.Timezone || "Asia/Ho_Chi_Minh",
          language: p.Language || "vi",
          avatar: (p.FullName || p.Email || "SA").slice(0, 2).toUpperCase(),
          joinDate: p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString("vi-VN") : ""
        }));
      }
      const s = resSettings.data.settings || {};
      if (Object.keys(s).length > 0) {
        setSystemSettings(prev => ({
          ...prev,
          maxLoginAttempts: s.security_max_login_attempts?.value || prev.maxLoginAttempts,
          sessionTimeout: s.session_timeout_minutes?.value || prev.sessionTimeout,
          aiMatchingEnabled: s.ai_parsing_threshold?.value !== "0"
        }));
      }
    }).catch(err => console.error('Error loading admin profile:', err))
    .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/profile', {
        fullName: account.name, email: account.email, phone: account.phone,
        department: account.department, timezone: account.timezone, language: account.language
      });
      toast.success("Cập nhật thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật hồ sơ.");
    } finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/settings', {
        settings: {
          security_max_login_attempts: systemSettings.maxLoginAttempts,
          session_timeout_minutes: systemSettings.sessionTimeout
        }
      });
      toast.success("Cập nhật cài đặt thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật cài đặt.");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin!"); return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!"); return;
    }
    if (security.newPassword.length < 8) {
      toast.error("Mật khẩu phải ít nhất 8 ký tự!"); return;
    }
    setSaving(true);
    try {
      await api.put('/api/profile/change-password', {
        currentPassword: security.currentPassword, newPassword: security.newPassword
      });
      setSecurity(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("Đổi mật khẩu thành công!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi khi đổi mật khẩu.";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const revokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success("Đã thu hồi phiên đăng nhập!");
  };

  const tabs = [
  { key: "account", label: "Tài khoản Admin", icon: User },
  { key: "system", label: "Cài đặt hệ thống", icon: Settings },
  { key: "security", label: "Bảo mật", icon: Shield },
  { key: "sessions", label: "Phiên đăng nhập", icon: Activity }];

  const ToggleSwitch = ({ value, onChange, label, description, danger }) =>
  <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${danger && value ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50"}`}>
      <div>
        <p className={`text-sm ${danger && value ? "text-red-700" : "text-gray-700"}`} style={{ fontWeight: 500 }}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${value ? danger ? "bg-red-500" : "bg-emerald-500" : "bg-gray-200"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all`} style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
      </button>
    </div>;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500">Đang tải hồ sơ Admin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Hồ sơ & Cài đặt Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản và cấu hình hệ thống AIRecruit</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-700" style={{ fontWeight: 600 }}>{account.name || "Admin"}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Admin card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl" style={{ fontWeight: 700, backgroundColor: account.avatarColor }}>
                {account.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <div className="text-gray-900 text-sm mb-0.5" style={{ fontWeight: 700 }}>{account.name}</div>
            <div className="text-xs text-gray-500 mb-1">{account.role}</div>
            <div className="text-xs text-gray-400 mb-3">{account.department}</div>
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Thông tin tài khoản</h3>
            <div className="space-y-2">
              {[
              { icon: Mail, text: account.email },
              { icon: Clock, text: `Tham gia: ${account.joinDate || "N/A"}` },
              { icon: Globe, text: account.timezone }].
              map(({ icon: Icon, text }) =>
              <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map(tab =>
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-colors ${activeTab === tab.key ? "border-b-2 border-slate-700 text-slate-700 bg-slate-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                  <tab.icon className="w-4 h-4" />
                  <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
                </button>
              )}
            </div>

            <div className="p-6">
              {/* TAB: Account */}
              {activeTab === "account" &&
              <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Họ và tên *</label>
                      <input value={account.name} onChange={e => setAccount(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Email đăng nhập *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={account.email} onChange={e => setAccount(p => ({ ...p, email: e.target.value }))} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" type="email" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Số điện thoại</label>
                      <input value={account.phone} onChange={e => setAccount(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" type="tel" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Phòng ban</label>
                      <input value={account.department} onChange={e => setAccount(p => ({ ...p, department: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Múi giờ</label>
                      <select value={account.timezone} onChange={e => setAccount(p => ({ ...p, timezone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                        <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Ngôn ngữ</label>
                      <select value={account.language} onChange={e => setAccount(p => ({ ...p, language: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* TAB: System */}
              {activeTab === "system" &&
              <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Trạng thái hệ thống</h3>
                    <div className="space-y-3">
                      <ToggleSwitch value={systemSettings.maintenanceMode} onChange={v => setSystemSettings(p => ({ ...p, maintenanceMode: v }))} label="Chế độ bảo trì" description="Khi bật, toàn bộ người dùng sẽ thấy trang bảo trì" danger />
                      <ToggleSwitch value={systemSettings.registrationOpen} onChange={v => setSystemSettings(p => ({ ...p, registrationOpen: v }))} label="Mở đăng ký tài khoản mới" description="Cho phép người dùng mới đăng ký tài khoản" />
                      <ToggleSwitch value={systemSettings.aiMatchingEnabled} onChange={v => setSystemSettings(p => ({ ...p, aiMatchingEnabled: v }))} label="AI Matching Engine" description="Bật/tắt tính năng AI matching và scoring" />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Giới hạn hệ thống</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                    { key: "maxCVSize", label: "CV tối đa (MB)" },
                    { key: "sessionTimeout", label: "Session timeout (phút)" },
                    { key: "maxLoginAttempts", label: "Đăng nhập sai tối đa" }].
                    map(({ key, label }) =>
                    <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                          <input value={systemSettings[key]} onChange={e => setSystemSettings(p => ({ ...p, [key]: e.target.value }))} type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                        </div>
                    )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu cài đặt"}
                    </button>
                  </div>
                </div>
              }

              {/* TAB: Security */}
              {activeTab === "security" &&
              <div className="space-y-6">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">Tài khoản Admin có quyền quản trị cao nhất. Bảo mật tài khoản là ưu tiên số một.</p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Đổi mật khẩu</p>
                    {[
                  { label: "Mật khẩu hiện tại", key: "currentPassword", show: showCurrentPass, setShow: setShowCurrentPass },
                  { label: "Mật khẩu mới", key: "newPassword", show: showNewPass, setShow: setShowNewPass },
                  { label: "Xác nhận mật khẩu mới", key: "confirmPassword", show: showConfirmPass, setShow: setShowConfirmPass }].
                  map(({ label, key, show, setShow }) =>
                  <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label} *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type={show ? "text" : "password"} value={security[key]} onChange={e => setSecurity(p => ({ ...p, [key]: e.target.value }))} className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" placeholder="••••••••" />
                          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {key === "confirmPassword" && security.confirmPassword && (
                    security.newPassword !== security.confirmPassword ?
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mật khẩu không khớp</p> :
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</p>)
                    }
                      </div>
                  )}
                    <button onClick={handleChangePassword} disabled={saving} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
                      {saving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </div>
              }

              {/* TAB: Sessions */}
              {activeTab === "sessions" &&
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{sessions.length} phiên đăng nhập</p>
                    <button onClick={() => { setSessions(prev => prev.filter(s => s.current)); toast.success("Đã đăng xuất tất cả thiết bị khác!"); }} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      Đăng xuất tất cả
                    </button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map(session =>
                  <div key={session.id} className={`p-4 rounded-xl border ${session.current ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${session.current ? "bg-emerald-100" : "bg-gray-100"}`}>
                              <Activity className={`w-5 h-5 ${session.current ? "text-emerald-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{session.device}</p>
                                {session.current && <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded" style={{ fontWeight: 500 }}>Hiện tại</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                                <span className="text-xs text-gray-400">{session.ip}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">Hoạt động: {session.lastActive}</p>
                            </div>
                          </div>
                          {!session.current &&
                      <button onClick={() => revokeSession(session.id)} className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                              <LogOut className="w-3 h-3" /> Thu hồi
                            </button>
                      }
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);
}