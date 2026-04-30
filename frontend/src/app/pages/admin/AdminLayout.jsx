import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { LayoutDashboard, Users, FileCheck, Brain, UserCog } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import api from "../../../lib/api";

const navItems = [
{ icon: LayoutDashboard, label: "Tổng quan hệ thống", path: "/admin" },
{ icon: Users, label: "Quản lý tài khoản", path: "/admin/accounts" },
{ icon: FileCheck, label: "Kiểm duyệt nội dung", path: "/admin/content" },
{ icon: Brain, label: "Thống kê AI Engine", path: "/admin/ai-stats" },
{ icon: UserCog, label: "Hồ sơ Admin", path: "/admin/profile" }];


export function AdminLayout() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminAvatar, setAdminAvatar] = useState("AD");

  useEffect(() => {
    api.get('/api/admin/profile').then(res => {
      const p = res.data.data;
      if (p) {
        const name = p.FullName || p.Email || "Admin";
        setAdminName(name);
        setAdminAvatar(name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase());
      }
    }).catch(() => {});
  }, []);

  return (
    <DashboardLayout
      navItems={navItems}
      role="admin"
      userName={adminName}
      userAvatar={adminAvatar}
      userAvatarColor="#475569"
      userRole="Quản trị viên hệ thống"
      profilePath="/admin/profile">
      
      <Outlet />
    </DashboardLayout>);
}