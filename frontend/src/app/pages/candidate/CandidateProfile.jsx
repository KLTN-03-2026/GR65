import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Link2, Lock,
  Save, Camera, Plus, X, CheckCircle, DollarSign, Clock, Github,
  Linkedin, Globe, Eye, EyeOff, Sparkles, Shield, AlertCircle, Loader2 } from
"lucide-react";
import { toast } from "sonner";

import { API_URL } from "../../../lib/api";

const SKILLS_SUGGESTIONS = [
"React", "Vue.js", "Angular", "TypeScript", "JavaScript", "Node.js",
"Python", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift",
"Kotlin", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
"GraphQL", "REST API", "PostgreSQL", "MongoDB", "Redis",
"Figma", "Adobe XD", "Sketch", "Tailwind CSS", "Next.js",
"Machine Learning", "TensorFlow", "PyTorch", "SQL", "Tableau",
"Agile", "Scrum", "Product Management", "SEO", "Google Ads"];




export function CandidateProfile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "male",
    location: "",
    summary: "",
    avatar: "",
    avatarColor: "#6366f1"
  });

  const [career, setCareer] = useState({
    title: "",
    experienceYears: "0",
    salaryMin: "",
    salaryMax: "",
    availability: "immediate",
    workType: "hybrid",
    skills: []
  });

  const [education, setEducation] = useState({
    school: "",
    major: "",
    degree: "",
    graduationYear: "",
    portfolio: "",
    linkedin: "",
    github: "",
    website: ""
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // ── Lấy dữ liệu hồ sơ từ API khi component mount ──
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Không thể tải hồ sơ");
        const data = await res.json();
        const p = data.profile;

        // Điền dữ liệu cơ bản (từ đăng ký/đăng nhập)
        setProfile((prev) => ({
          ...prev,
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          location: p.location || "",
          summary: p.summary || "",
          avatar: (p.name || "").slice(0, 2).toUpperCase() || "NT",
        }));

        // Điền dữ liệu nghề nghiệp
        setCareer((prev) => ({
          ...prev,
          title: p.title || "",
          experienceYears: p.experienceYears || "0",
          availability: p.availability || "immediate",
          skills: Array.isArray(p.skills) ? p.skills : [],
          salaryMin: p.expectedSalary ? p.expectedSalary.split("-")[0]?.trim() : "",
          salaryMax: p.expectedSalary ? p.expectedSalary.split("-")[1]?.trim() : "",
        }));

        // Điền dữ liệu học vấn (nếu có)
        if (p.education) {
          try {
            const eduParsed = JSON.parse(p.education);
            setEducation((prev) => ({ ...prev, ...eduParsed }));
          } catch {
            // education là plain text, đặt vào school
            setEducation((prev) => ({ ...prev, school: p.education }));
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu hồ sơ");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const expectedSalary = career.salaryMin && career.salaryMax
        ? `${career.salaryMin} - ${career.salaryMax}`
        : career.salaryMin || career.salaryMax || "";

      const educationJson = JSON.stringify({
        school: education.school,
        major: education.major,
        degree: education.degree,
        graduationYear: education.graduationYear,
        portfolio: education.portfolio,
        linkedin: education.linkedin,
        github: education.github,
        website: education.website,
      });

      const res = await fetch(`${API_URL}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          location: profile.location,
          title: career.title,
          experienceYears: career.experienceYears,
          skills: career.skills,
          expectedSalary,
          availability: career.availability,
          education: educationJson,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Cập nhật hồ sơ thành công!");
      // Thông báo để sidebar cập nhật tên & chức danh ngay lập tức
      window.dispatchEvent(new CustomEvent("profile:updated", {
        detail: { name: profile.name, title: career.title }
      }));
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !career.skills.includes(s)) {
      setCareer((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput("");
    setShowSkillInput(false);
  };

  const removeSkill = (skill) => {
    setCareer((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
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
      toast.error("Mật khẩu mới phải ít nhất 8 ký tự!");
      return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Đổi mật khẩu thành công!");
    } catch (err) {
      toast.error(err.message || "Đổi mật khẩu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
  { key: "personal", label: "Thông tin cá nhân", icon: User },
  { key: "career", label: "Nghề nghiệp & Kỹ năng", icon: Briefcase },
  { key: "education", label: "Học vấn & Liên kết", icon: GraduationCap },
  { key: "security", label: "Bảo mật", icon: Shield }];


  const completionItems = [
  { label: "Thông tin cá nhân", done: !!profile.name && !!profile.phone },
  { label: "Ảnh đại diện", done: false },
  { label: "Tóm tắt bản thân", done: !!profile.summary },
  { label: "Kỹ năng", done: career.skills.length > 0 },
  { label: "Học vấn", done: !!education.school },
  { label: "Portfolio/Liên kết", done: !!education.portfolio || !!education.linkedin }];

  const completionPct = Math.round(completionItems.filter((i) => i.done).length / completionItems.length * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500 text-sm">Đang tải hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin để AI matching hiệu quả hơn</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-indigo-700" style={{ fontWeight: 600 }}>AI Score: 94%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Profile card + Completion */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl"
                style={{ fontWeight: 700, backgroundColor: profile.avatarColor }}>
                
                {profile.avatar}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="text-gray-900 text-sm mb-0.5" style={{ fontWeight: 600 }}>{profile.name}</div>
            <div className="text-xs text-gray-500 mb-2">{career.title}</div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />{profile.location}
            </div>
            <div className="w-full mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{profile.email}</div>
              <div className="text-xs text-gray-500">{profile.phone}</div>
            </div>
          </div>

          {/* Profile completion */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Hoàn thiện hồ sơ</h3>
              <span className="text-sm text-indigo-600" style={{ fontWeight: 700 }}>{completionPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }} />
              
            </div>
            <div className="space-y-2">
              {completionItems.map((item) =>
              <div key={item.label} className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${item.done ? "text-emerald-500" : "text-gray-200"}`} />
                  <span className={`text-xs ${item.done ? "text-gray-700" : "text-gray-400"}`}>{item.label}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-indigo-500 mt-3 bg-indigo-50 rounded-lg px-2 py-1.5">
              Hồ sơ hoàn thiện giúp AI match tốt hơn!
            </p>
          </div>
        </div>

        {/* Right: Tabs + Forms */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) =>
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key ?
                "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50" :
                "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`
                }>
                
                  <tab.icon className="w-4 h-4" />
                  <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
                </button>
              )}
            </div>

            <div className="p-6">
              {/* ── TAB: Personal ── */}
              {activeTab === "personal" &&
              <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Họ và tên *</label>
                      <input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="Nguyễn Văn A" />
                    
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="email@example.com"
                        type="email" />
                      
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="0901234567"
                        type="tel" />
                      
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Ngày sinh</label>
                      <input
                      value={profile.dob}
                      onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                    
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Giới tính</label>
                      <select
                      value={profile.gender}
                      onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                      
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                        <option value="prefer_not">Không muốn tiết lộ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Địa chỉ / Thành phố</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={profile.location}
                        onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="TP. Hồ Chí Minh" />
                      
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Tóm tắt bản thân</label>
                    <textarea
                    value={profile.summary}
                    onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                    placeholder="Mô tả ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp..." />
                  
                    <p className="text-xs text-gray-400 mt-1">{profile.summary.length}/500 ký tự • AI sẽ dùng thông tin này để matching</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ?
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

                    <Save className="w-4 h-4" />
                    }
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Career ── */}
              {activeTab === "career" &&
              <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Vị trí / Chức danh hiện tại</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={career.title}
                        onChange={(e) => setCareer((p) => ({ ...p, title: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="Senior Frontend Developer" />
                      
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Số năm kinh nghiệm</label>
                      <select
                      value={career.experienceYears}
                      onChange={(e) => setCareer((p) => ({ ...p, experienceYears: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                      
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"].map((y) =>
                      <option key={y} value={y}>{y === "0" ? "Chưa có kinh nghiệm" : `${y} năm`}</option>
                      )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Mức lương mong muốn (triệu VNĐ)</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={career.salaryMin}
                          onChange={(e) => setCareer((p) => ({ ...p, salaryMin: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="30"
                          type="number" />
                        
                        </div>
                        <span className="text-gray-400 text-sm">—</span>
                        <input
                        value={career.salaryMax}
                        onChange={(e) => setCareer((p) => ({ ...p, salaryMax: e.target.value }))}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="45"
                        type="number" />
                      
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Có thể bắt đầu</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                        value={career.availability}
                        onChange={(e) => setCareer((p) => ({ ...p, availability: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                        
                          <option value="immediate">Ngay lập tức</option>
                          <option value="1week">1 tuần</option>
                          <option value="2weeks">2 tuần</option>
                          <option value="1month">1 tháng</option>
                          <option value="2months">2 tháng</option>
                          <option value="negotiable">Thỏa thuận</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Hình thức làm việc</label>
                      <select
                      value={career.workType}
                      onChange={(e) => setCareer((p) => ({ ...p, workType: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                      
                        <option value="onsite">Tại văn phòng (Onsite)</option>
                        <option value="remote">Từ xa (Remote)</option>
                        <option value="hybrid">Kết hợp (Hybrid)</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Kỹ năng ({career.skills.length})</label>
                      <button
                      onClick={() => setShowSkillInput(true)}
                      className="text-xs text-indigo-600 flex items-center gap-1 hover:text-indigo-700">
                      
                        <Plus className="w-3 h-3" /> Thêm kỹ năng
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {career.skills.map((skill) =>
                    <span key={skill} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-lg border border-indigo-100">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                    )}
                      {career.skills.length === 0 &&
                    <p className="text-xs text-gray-400 italic">Chưa có kỹ năng nào. Hãy thêm kỹ năng của bạn!</p>
                    }
                    </div>
                    {showSkillInput &&
                  <div className="border border-indigo-200 rounded-xl p-3 bg-indigo-50/30">
                        <div className="flex gap-2 mb-2">
                          <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {if (e.key === "Enter") addSkill(skillInput);if (e.key === "Escape") setShowSkillInput(false);}}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="Nhập kỹ năng..."
                        autoFocus />
                      
                          <button onClick={() => addSkill(skillInput)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Thêm</button>
                          <button onClick={() => setShowSkillInput(false)} className="px-3 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100">Hủy</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {SKILLS_SUGGESTIONS.filter((s) => !career.skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())).slice(0, 12).map((s) =>
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        
                              + {s}
                            </button>
                      )}
                        </div>
                      </div>
                  }
                  </div>

                  <div className="flex justify-end">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Education & Links ── */}
              {activeTab === "education" &&
              <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Thông tin học vấn</h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Trường học</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={education.school}
                          onChange={(e) => setEducation((p) => ({ ...p, school: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="Tên trường đại học" />
                        
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Chuyên ngành</label>
                        <input
                        value={education.major}
                        onChange={(e) => setEducation((p) => ({ ...p, major: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="Công nghệ Thông tin" />
                      
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Bằng cấp</label>
                        <select
                        value={education.degree}
                        onChange={(e) => setEducation((p) => ({ ...p, degree: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white">
                        
                          <option value="">Chọn bằng cấp</option>
                          <option value="Trung cấp">Trung cấp</option>
                          <option value="Cao đẳng">Cao đẳng</option>
                          <option value="Cử nhân">Cử nhân</option>
                          <option value="Kỹ sư">Kỹ sư</option>
                          <option value="Thạc sĩ">Thạc sĩ</option>
                          <option value="Tiến sĩ">Tiến sĩ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Năm tốt nghiệp</label>
                        <input
                        value={education.graduationYear}
                        onChange={(e) => setEducation((p) => ({ ...p, graduationYear: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="2016"
                        type="number"
                        min="1990"
                        max="2030" />
                      
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Liên kết & Mạng xã hội</h3>
                    <div className="space-y-4">
                      {[
                    { key: "portfolio", label: "Portfolio / Website cá nhân", icon: Globe, placeholder: "https://portfolio.example.com" },
                    { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
                    { key: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/username" },
                    { key: "website", label: "Liên kết khác", icon: Link2, placeholder: "https://..." }].
                    map(({ key, label, icon: Icon, placeholder }) =>
                    <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                          value={education[key]}
                          onChange={(e) => setEducation((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder={placeholder}
                          type="url" />
                        
                          </div>
                        </div>
                    )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Security ── */}
              {activeTab === "security" &&
              <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">Mật khẩu phải ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.</p>
                  </div>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Mật khẩu hiện tại *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        type={showCurrentPass ? "text" : "password"}
                        value={security.currentPassword}
                        onChange={(e) => setSecurity((p) => ({ ...p, currentPassword: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="••••••••" />
                      
                        <button onClick={() => setShowCurrentPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Mật khẩu mới *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        type={showNewPass ? "text" : "password"}
                        value={security.newPassword}
                        onChange={(e) => setSecurity((p) => ({ ...p, newPassword: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="••••••••" />
                      
                        <button onClick={() => setShowNewPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {security.newPassword &&
                    <div className="mt-2">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                          className={`h-full rounded-full transition-all ${
                          security.newPassword.length < 6 ? "bg-red-400 w-1/4" :
                          security.newPassword.length < 8 ? "bg-amber-400 w-2/4" :
                          security.newPassword.length < 12 ? "bg-emerald-400 w-3/4" : "bg-emerald-500 w-full"}`
                          } />
                        
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Độ mạnh: {security.newPassword.length < 6 ? "Yếu" : security.newPassword.length < 8 ? "Trung bình" : security.newPassword.length < 12 ? "Khá mạnh" : "Mạnh"}
                          </p>
                        </div>
                    }
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Xác nhận mật khẩu mới *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        type={showConfirmPass ? "text" : "password"}
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity((p) => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="••••••••" />
                      
                        <button onClick={() => setShowConfirmPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {security.confirmPassword && security.newPassword !== security.confirmPassword &&
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mật khẩu không khớp</p>
                    }
                      {security.confirmPassword && security.newPassword === security.confirmPassword &&
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</p>
                    }
                    </div>
                    <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                      {saving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm text-red-600 mb-3" style={{ fontWeight: 600 }}>Vùng nguy hiểm</h3>
                    <div className="border border-red-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Xóa tài khoản</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục</p>
                      </div>
                      <button className="text-xs text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);

}