import { useState } from "react";
import {
  User, Mail, Lock, Shield, Save, Eye, EyeOff, AlertCircle,
  CheckCircle, Settings, Bell, Globe, Database, Server, 
  Activity, Clock, Key, LogOut, MapPin, UserCog
} from "lucide-react";
import { toast } from "sonner";

type Tab = "account" | "system" | "security" | "sessions";

const MOCK_SESSIONS = [
  { id: "s1", device: "Chrome trên Windows 11", location: "TP. Hồ Chí Minh", ip: "118.69.xxx.xxx", lastActive: "Hiện tại", current: true },
  { id: "s2", device: "Safari trên iPhone 15", location: "TP. Hồ Chí Minh", ip: "118.70.xxx.xxx", lastActive: "2 giờ trước", current: false },
  { id: "s3", device: "Firefox trên macOS", location: "Hà Nội", ip: "14.232.xxx.xxx", lastActive: "3 ngày trước", current: false },
];

export function AdminProfile() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [saving, setSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const [account, setAccount] = useState({
    name: "Super Admin",
    email: "admin@airecruit.vn",
    phone: "0901999888",
    role: "Quản trị viên hệ thống",
    department: "Platform Operations",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    avatar: "SA",
    avatarColor: "#475569",
    joinDate: "2023-01-15",
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    aiMatchingEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    autoApproveEmployers: false,
    autoApproveContent: false,
    maxCVSize: "10",
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    debugMode: false,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    toast.success("Cập nhật thành công!");
  };

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error("Mật khẩu phải ít nhất 8 ký tự!");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSecurity(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    toast.success("Đổi mật khẩu thành công!");
  };

  const revokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success("Đã thu hồi phiên đăng nhập!");
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "account", label: "Tài khoản Admin", icon: User },
    { key: "system", label: "Cài đặt hệ thống", icon: Settings },
    { key: "security", label: "Bảo mật", icon: Shield },
    { key: "sessions", label: "Phiên đăng nhập", icon: Activity },
  ];

  const ToggleSwitch = ({
    value,
    onChange,
    label,
    description,
    danger
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
    danger?: boolean;
  }) => (
    <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${danger && value ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50"}`}>
      <div>
        <p className={`text-sm ${danger && value ? "text-red-700" : "text-gray-700"}`} style={{ fontWeight: 500 }}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${value ? (danger ? "bg-red-500" : "bg-emerald-500") : "bg-gray-200"}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${value ? "left-5.5 translate-x-0.5" : "left-0.5"}`} style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Hồ sơ & Cài đặt Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản và cấu hình hệ thống AIRecruit</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-700" style={{ fontWeight: 600 }}>Super Admin</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Admin card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl"
                style={{ fontWeight: 700, backgroundColor: account.avatarColor }}
              >
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

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Trạng thái hệ thống</h3>
            <div className="space-y-2.5">
              {[
                { label: "API Server", status: "online", value: "99.9% uptime" },
                { label: "Database", status: "online", value: "12ms latency" },
                { label: "AI Engine", status: systemSettings.aiMatchingEnabled ? "online" : "offline", value: systemSettings.aiMatchingEnabled ? "Active" : "Paused" },
                { label: "Maintenance", status: systemSettings.maintenanceMode ? "warning" : "online", value: systemSettings.maintenanceMode ? "ON" : "OFF" },
              ].map(({ label, status, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
                    <span className="text-gray-600">{label}</span>
                  </div>
                  <span className={`${status === "online" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-red-600"}`} style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Thông tin tài khoản</h3>
            <div className="space-y-2">
              {[
                { icon: Mail, text: account.email },
                { icon: Clock, text: `Tham gia: ${account.joinDate}` },
                { icon: Globe, text: account.timezone },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-b-2 border-slate-700 text-slate-700 bg-slate-50/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── TAB: Account ── */}
              {activeTab === "account" && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Họ và tên *</label>
                      <input
                        value={account.name}
                        onChange={e => setAccount(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                        placeholder="Super Admin"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Email đăng nhập *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={account.email}
                          onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                          placeholder="admin@airecruit.vn"
                          type="email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Số điện thoại</label>
                      <input
                        value={account.phone}
                        onChange={e => setAccount(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                        placeholder="0901234567"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Phòng ban</label>
                      <input
                        value={account.department}
                        onChange={e => setAccount(p => ({ ...p, department: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                        placeholder="Platform Operations"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Múi giờ</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={account.timezone}
                          onChange={e => setAccount(p => ({ ...p, timezone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 bg-white"
                        >
                          <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                          <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                          <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                          <option value="UTC">UTC (GMT+0)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Ngôn ngữ giao diện</label>
                      <select
                        value={account.language}
                        onChange={e => setAccount(p => ({ ...p, language: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 bg-white"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700" style={{ fontWeight: 500 }}>Vai trò: {account.role}</p>
                      <p className="text-xs text-amber-600 mt-0.5">Thay đổi vai trò cần được phê duyệt bởi hệ thống. Liên hệ kỹ thuật để được hỗ trợ.</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB: System ── */}
              {activeTab === "system" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Trạng thái hệ thống</h3>
                    <div className="space-y-3">
                      <ToggleSwitch
                        value={systemSettings.maintenanceMode}
                        onChange={v => setSystemSettings(p => ({ ...p, maintenanceMode: v }))}
                        label="Chế độ bảo trì"
                        description="Khi bật, toàn bộ người dùng sẽ thấy trang bảo trì"
                        danger
                      />
                      <ToggleSwitch
                        value={systemSettings.registrationOpen}
                        onChange={v => setSystemSettings(p => ({ ...p, registrationOpen: v }))}
                        label="Mở đăng ký tài khoản mới"
                        description="Cho phép người dùng mới đăng ký tài khoản"
                      />
                      <ToggleSwitch
                        value={systemSettings.aiMatchingEnabled}
                        onChange={v => setSystemSettings(p => ({ ...p, aiMatchingEnabled: v }))}
                        label="AI Matching Engine"
                        description="Bật/tắt tính năng AI matching và scoring"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Phê duyệt tự động</h3>
                    <div className="space-y-3">
                      <ToggleSwitch
                        value={systemSettings.autoApproveEmployers}
                        onChange={v => setSystemSettings(p => ({ ...p, autoApproveEmployers: v }))}
                        label="Tự động duyệt nhà tuyển dụng"
                        description="Tự động kích hoạt tài khoản NTD mới không cần kiểm duyệt"
                      />
                      <ToggleSwitch
                        value={systemSettings.autoApproveContent}
                        onChange={v => setSystemSettings(p => ({ ...p, autoApproveContent: v }))}
                        label="Tự động duyệt nội dung JD"
                        description="JD không qua kiểm duyệt trước khi đăng lên hệ thống"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Thông báo hệ thống</h3>
                    <div className="space-y-3">
                      <ToggleSwitch
                        value={systemSettings.emailNotifications}
                        onChange={v => setSystemSettings(p => ({ ...p, emailNotifications: v }))}
                        label="Email thông báo"
                        description="Gửi email khi có sự kiện quan trọng xảy ra"
                      />
                      <ToggleSwitch
                        value={systemSettings.smsNotifications}
                        onChange={v => setSystemSettings(p => ({ ...p, smsNotifications: v }))}
                        label="SMS thông báo"
                        description="Gửi SMS cho các cảnh báo khẩn cấp"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Giới hạn hệ thống</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { key: "maxCVSize", label: "Dung lượng CV tối đa (MB)", min: "1", max: "50" },
                        { key: "sessionTimeout", label: "Session timeout (phút)", min: "15", max: "480" },
                        { key: "maxLoginAttempts", label: "Số lần đăng nhập sai tối đa", min: "3", max: "10" },
                      ].map(({ key, label, min, max }) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                          <input
                            value={systemSettings[key as keyof typeof systemSettings] as string}
                            onChange={e => setSystemSettings(p => ({ ...p, [key]: e.target.value }))}
                            type="number"
                            min={min}
                            max={max}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu cài đặt"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB: Security ── */}
              {activeTab === "security" && (
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
                      { label: "Xác nhận mật khẩu mới", key: "confirmPassword", show: showConfirmPass, setShow: setShowConfirmPass },
                    ].map(({ label, key, show, setShow }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label} *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={show ? "text" : "password"}
                            value={security[key as keyof typeof security] as string}
                            onChange={e => setSecurity(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400"
                            placeholder="••••••••"
                          />
                          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {key === "confirmPassword" && security.confirmPassword && (
                          security.newPassword !== security.confirmPassword
                            ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mật khẩu không khớp</p>
                            : <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
                      {saving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-700 mb-3" style={{ fontWeight: 500 }}>Xác thực hai yếu tố (2FA)</p>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-700">Authenticator App</p>
                        <p className="text-xs text-gray-400 mt-0.5">{security.twoFactor ? "Đã bật • Google Authenticator" : "Chưa bật xác thực 2 yếu tố"}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSecurity(p => ({ ...p, twoFactor: !p.twoFactor }));
                          toast.success(security.twoFactor ? "Đã tắt 2FA" : "Đã bật 2FA thành công!");
                        }}
                        className={`text-xs px-4 py-2 rounded-lg border transition-colors ${
                          security.twoFactor
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {security.twoFactor ? "Tắt 2FA" : "Bật 2FA"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Sessions ── */}
              {activeTab === "sessions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{sessions.length} phiên đăng nhập đang hoạt động</p>
                    <button
                      onClick={() => {
                        setSessions(prev => prev.filter(s => s.current));
                        toast.success("Đã đăng xuất tất cả thiết bị khác!");
                      }}
                      className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất tất cả
                    </button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-xl border ${session.current ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100 bg-gray-50/50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${session.current ? "bg-emerald-100" : "bg-gray-100"}`}>
                              <Activity className={`w-5 h-5 ${session.current ? "text-emerald-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{session.device}</p>
                                {session.current && (
                                  <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded" style={{ fontWeight: 500 }}>Hiện tại</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{session.location}
                                </span>
                                <span className="text-xs text-gray-400">{session.ip}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">Hoạt động: {session.lastActive}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <button
                              onClick={() => revokeSession(session.id)}
                              className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <LogOut className="w-3 h-3" /> Thu hồi
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}