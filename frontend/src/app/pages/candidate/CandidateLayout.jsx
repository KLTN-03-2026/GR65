import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { LayoutDashboard, FileText, Briefcase, ClipboardList, UserCircle } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

import { API_URL as API_BASE } from "../../../lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "Tổng quan",          path: "/candidate" },
  { icon: FileText,        label: "Quản lý CV",          path: "/candidate/cv" },
  { icon: Briefcase,       label: "Tìm việc làm",        path: "/candidate/jobs" },
  { icon: ClipboardList,   label: "Lịch sử ứng tuyển",  path: "/candidate/applications" },
  { icon: UserCircle,      label: "Hồ sơ cá nhân",       path: "/candidate/profile" },
];

/** Lấy 2 chữ cái đầu của tên để làm avatar */
function getInitials(fullName = "") {
  const parts = fullName.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function CandidateLayout() {
  const [userName, setUserName]   = useState("...");
  const [userRole, setUserRole]   = useState("");
  const [userAvatar, setUserAvatar] = useState("?");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.profile) return;
        const { name, title } = data.profile;
        setUserName(name || "Ứng viên");
        setUserRole(title || "");
        setUserAvatar(getInitials(name));
      })
      .catch(() => {/* giữ giá trị mặc định */});
  }, []);

  // Lắng nghe sự kiện lưu profile → cập nhật sidebar ngay lập tức
  useEffect(() => {
    const handler = (e) => {
      const { name, title } = e.detail || {};
      if (name) {
        setUserName(name);
        setUserAvatar(getInitials(name));
      }
      setUserRole(title || "");
    };
    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, []);

  return (
    <DashboardLayout
      navItems={navItems}
      role="candidate"
      userName={userName}
      userAvatar={userAvatar}
      userAvatarColor="#6366f1"
      userRole={userRole}
      profilePath="/candidate/profile"
    >
      <Outlet />
    </DashboardLayout>
  );
}