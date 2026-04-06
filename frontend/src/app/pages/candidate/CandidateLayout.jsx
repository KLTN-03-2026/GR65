import { Outlet } from "react-router";
import { LayoutDashboard, FileText, Briefcase, ClipboardList, UserCircle } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const navItems = [
{ icon: LayoutDashboard, label: "Tổng quan", path: "/candidate" },
{ icon: FileText, label: "Quản lý CV", path: "/candidate/cv", badge: 2 },
{ icon: Briefcase, label: "Tìm việc làm", path: "/candidate/jobs" },
{ icon: ClipboardList, label: "Lịch sử ứng tuyển", path: "/candidate/applications", badge: 3 },
{ icon: UserCircle, label: "Hồ sơ cá nhân", path: "/candidate/profile" }];


export function CandidateLayout() {
  return (
    <DashboardLayout
      navItems={navItems}
      role="candidate"
      userName="Nguyễn Minh Trí"
      userAvatar="NT"
      userAvatarColor="#6366f1"
      userRole="Senior Frontend Developer"
      profilePath="/candidate/profile">
      
      <Outlet />
    </DashboardLayout>);

}