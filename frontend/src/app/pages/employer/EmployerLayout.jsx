import { Outlet } from "react-router";
import { LayoutDashboard, Briefcase, Users, GitBranch, Calendar, Building2 } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import api from "../../../lib/api";

const navItems = [
{ icon: LayoutDashboard, label: "Tổng quan", path: "/employer" },
{ icon: Briefcase, label: "Bài tuyển dụng", path: "/employer/jobs" },
{ icon: Users, label: "Ứng viên", path: "/employer/candidates" },
{ icon: GitBranch, label: "Pipeline", path: "/employer/pipeline" },
{ icon: Calendar, label: "Phỏng vấn", path: "/employer/interviews" },
{ icon: Building2, label: "Hồ sơ công ty", path: "/employer/profile" }];

export function EmployerLayout() {
  const [name, setName] = useState("Đang tải...");
  const [avatar, setAvatar] = useState("?");

  useEffect(() => {
    api.get('/api/profile/me').then(res => {
      const p = res.data?.profile;
      if (p) {
        const cName = p.companyName || p.email || "Nhà Tuyển Dụng";
        setName(cName);
        setAvatar(cName.substring(0, 2).toUpperCase());
      }
    }).catch(console.error);
  }, []);

  return (
    <DashboardLayout
      navItems={navItems}
      role="employer"
      userName={name}
      userAvatar={avatar}
      userAvatarColor="#6366f1"
      userRole="Nhà tuyển dụng"
      profilePath="/employer/profile">
      
      <Outlet />
    </DashboardLayout>);

}