import { Outlet } from "react-router";
import { LayoutDashboard, Users, FileCheck, Brain, UserCog } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const navItems = [
  { icon: LayoutDashboard, label: "Tổng quan hệ thống", path: "/admin" },
  { icon: Users, label: "Quản lý tài khoản", path: "/admin/accounts" },
  { icon: FileCheck, label: "Kiểm duyệt nội dung", path: "/admin/content" },
  { icon: Brain, label: "Thống kê AI Engine", path: "/admin/ai-stats" },
  { icon: UserCog, label: "Hồ sơ Admin", path: "/admin/profile" },
];

export function AdminLayout() {
  return (
    <DashboardLayout
      navItems={navItems}
      role="admin"
      userName="Super Admin"
      userAvatar="SA"
      userAvatarColor="#475569"
      userRole="Quản trị viên hệ thống"
      profilePath="/admin/profile"
    >
      <Outlet />
    </DashboardLayout>
  );
}