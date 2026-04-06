import { Outlet } from "react-router";
import { LayoutDashboard, Briefcase, Users, GitBranch, Calendar, Building2 } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const navItems = [
{ icon: LayoutDashboard, label: "Tổng quan", path: "/employer" },
{ icon: Briefcase, label: "Bài tuyển dụng", path: "/employer/jobs", badge: 8 },
{ icon: Users, label: "Ứng viên", path: "/employer/candidates", badge: 24 },
{ icon: GitBranch, label: "Pipeline", path: "/employer/pipeline" },
{ icon: Calendar, label: "Phỏng vấn", path: "/employer/interviews" },
{ icon: Building2, label: "Hồ sơ công ty", path: "/employer/profile" }];


export function EmployerLayout() {
  return (
    <DashboardLayout
      navItems={navItems}
      role="employer"
      userName="TechVision Vietnam"
      userAvatar="TV"
      userAvatarColor="#6366f1"
      userRole="Nhà tuyển dụng"
      profilePath="/employer/profile">
      
      <Outlet />
    </DashboardLayout>);

}