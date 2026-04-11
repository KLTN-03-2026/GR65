import { useState, useEffect } from "react";
import axios from "axios";
import { Outlet } from "react-router";
import { LayoutDashboard, FileText, Briefcase, ClipboardList, UserCircle } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const navItems = [
  { icon: LayoutDashboard, label: "Tổng quan", path: "/candidate" },
  { icon: FileText, label: "Quản lý CV", path: "/candidate/cv", badge: 2 },
  { icon: Briefcase, label: "Tìm việc làm", path: "/candidate/jobs" },
  { icon: ClipboardList, label: "Lịch sử ứng tuyển", path: "/candidate/applications", badge: 3 },
  { icon: UserCircle, label: "Hồ sơ cá nhân", path: "/candidate/profile" },
];

export function CandidateLayout() {
  const [profile, setProfile] = useState({
     name: "Đang tải...",
     title: "Tài khoản Ứng viên",
     avatar: "C"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if(!token) return;
        const { data } = await axios.get('http://localhost:5000/api/profile/me', { headers: { Authorization: `Bearer ${token}` } });
        setProfile({
           name: data.FullName || data.Email || "Ứng Viên Trống",
           title: data.Title || "Tài khoản Ứng viên",
           avatar: (data.FullName || data.Email || "C").charAt(0).toUpperCase()
        });
      } catch (err) {
        console.log("Lỗi tải layout Ứng viên", err);
      }
    };
    fetchProfile();
  },[]);

  return (
    <DashboardLayout
      navItems={navItems}
      role="candidate"
      userName={profile.name}
      userAvatar={profile.avatar}
      userAvatarColor="#6366f1"
      userRole={profile.title}
      profilePath="/candidate/profile"
    >
      <Outlet />
    </DashboardLayout>
  );
}