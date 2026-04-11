import { useState, useEffect } from "react";
import axios from "axios";
import { Outlet } from "react-router";
import { LayoutDashboard, Briefcase, Users, GitBranch, Calendar, Building2 } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const navItems = [
  { icon: LayoutDashboard, label: "Tổng quan", path: "/employer" },
  { icon: Briefcase, label: "Bài tuyển dụng", path: "/employer/jobs", badge: 8 },
  { icon: Users, label: "Ứng viên", path: "/employer/candidates", badge: 24 },
  { icon: GitBranch, label: "Pipeline", path: "/employer/pipeline" },
  { icon: Calendar, label: "Phỏng vấn", path: "/employer/interviews" },
  { icon: Building2, label: "Hồ sơ công ty", path: "/employer/profile" },
];

export function EmployerLayout() {
  const [company, setCompany] = useState({
     name: "Đang tải...",
     title: "Nhà Tuyển Dụng",
     avatar: "E"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if(!token) return;
        const { data } = await axios.get('http://localhost:5000/api/profile/me', { headers: { Authorization: `Bearer ${token}` } });
        setCompany({
           name: data.CompanyName || data.Email || "Doanh nghiệp",
           title: "Nhà Tuyển Dụng",
           avatar: (data.CompanyName || data.Email || "E").charAt(0).toUpperCase()
        });
      } catch (err) {
        console.log("Lỗi tải layout Doanh nghiệp", err);
      }
    };
    fetchProfile();
  },[]);

  return (
    <DashboardLayout
      navItems={navItems}
      role="employer"
      userName={company.name}
      userAvatar={company.avatar}
      userAvatarColor="#6366f1"
      userRole={company.title}
      profilePath="/employer/profile"
    >
      <Outlet />
    </DashboardLayout>
  );
}