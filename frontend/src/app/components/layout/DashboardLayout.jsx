import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Brain, Bell, Search, LogOut, Menu, X, ChevronRight, Settings } from "lucide-react";
import { mockNotifications } from "../../data/mockData";



















export function DashboardLayout({ children, navItems, role, userName, userAvatar, userAvatarColor, userRole, profilePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const roleColors = {
    candidate: "from-indigo-600 to-violet-600",
    employer: "from-violet-600 to-purple-700",
    admin: "from-slate-700 to-slate-900"
  };

  const isActive = (path) => {
    if (path === `/${role}` || path === `/${role}/`) return location.pathname === `/${role}` || location.pathname === `/${role}/`;
    return location.pathname.startsWith(path);
  };

  const handleProfileClick = () => {
    if (profilePath) navigate(profilePath);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar overlay mobile */}
      {sidebarOpen &&
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      }

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColors[role]} flex items-center justify-center`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>AI<span className="text-indigo-600">Recruit</span></span>
          </button>
        </div>

        {/* User profile — clickable */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group text-left">
            
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: userAvatarColor }}>
              {userAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userRole}</div>
            </div>
            <Settings className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) =>
          <button
            key={item.path}
            onClick={() => {navigate(item.path);setSidebarOpen(false);}}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive(item.path) ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-sm` : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
            
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 &&
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive(item.path) ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"}`} style={{ fontWeight: 600 }}>
                  {item.badge}
                </span>
            }
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
              
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 &&
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                }
              </button>

              {/* Notification dropdown */}
              {notifOpen &&
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Thông báo</span>
                    <button onClick={markAllRead} className="text-xs text-indigo-600 cursor-pointer hover:underline">Đánh dấu tất cả đã đọc</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 4).map((n) =>
                  <div
                    key={n.id}
                    onClick={() => {navigate(n.link);setNotifOpen(false);setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));}}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-indigo-50/50" : ""}`}>
                    
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: n.avatarColor }}>
                            {n.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 mb-0.5" style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                            <div className="text-xs text-gray-500 leading-relaxed mb-1">{n.message}</div>
                            <div className="text-xs text-gray-400">{n.time}</div>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>}
                        </div>
                      </div>
                  )}
                  </div>
                  <div className="p-3 text-center">
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mx-auto">
                      Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              }
            </div>

            {/* Avatar — clickable → profile */}
            <button
              onClick={handleProfileClick}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm hover:opacity-80 transition-opacity"
              style={{ fontWeight: 700, backgroundColor: userAvatarColor }}
              title="Chỉnh sửa hồ sơ">
              
              {userAvatar}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>);

}