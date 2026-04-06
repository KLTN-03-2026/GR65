import { useState } from "react";
import {
  Building2, Mail, Phone, MapPin, Globe, Linkedin, Twitter, Facebook,
  Lock, Save, Camera, Users, Eye, EyeOff,
  Shield, AlertCircle, CheckCircle, Link2 } from
"lucide-react";
import { toast } from "sonner";



const INDUSTRIES = [
"Công nghệ thông tin", "Tài chính - Ngân hàng", "Thương mại điện tử",
"Y tế - Dược phẩm", "Giáo dục - Đào tạo", "Bất động sản", "Sản xuất - Công nghiệp",
"Thiết kế - Sáng tạo", "Marketing - Truyền thông", "Logistics - Vận tải",
"Du lịch - Khách sạn", "Xây dựng - Kiến trúc", "Luật - Tư vấn", "Khác"];


const COMPANY_SIZES = [
"1-10 nhân viên", "11-50 nhân viên", "51-100 nhân viên",
"101-200 nhân viên", "200-500 nhân viên", "500-1000 nhân viên",
"1000-5000 nhân viên", "Trên 5000 nhân viên"];


export function EmployerProfile() {
  const [activeTab, setActiveTab] = useState("company");
  const [saving, setSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [company, setCompany] = useState({
    name: "TechVision Vietnam",
    taxCode: "0123456789",
    industry: "Công nghệ thông tin",
    size: "200-500 nhân viên",
    founded: "2015",
    location: "TP. Hồ Chí Minh",
    address: "123 Nguyễn Huệ, Q.1, TP.HCM",
    website: "https://www.techvision.vn",
    description: "TechVision Vietnam là công ty công nghệ hàng đầu Việt Nam, chuyên phát triển các giải pháp phần mềm doanh nghiệp và SaaS. Chúng tôi có đội ngũ hơn 300 kỹ sư tài năng và khách hàng tại 15+ quốc gia.",
    logo: "TV",
    logoColor: "#6366f1",

    benefits: "Bảo hiểm sức khỏe cao cấp, Remote friendly, Team building hàng tháng, Budget học tập 5 triệu/năm"
  });

  const [contact, setContact] = useState({
    hrName: "Nguyễn Thị Hoa",
    hrEmail: "hr@techvision.vn",
    hrPhone: "028-3822-1234",
    hrTitle: "HR Manager",
    contactEmail: "contact@techvision.vn",
    contactPhone: "028-3822-5678"
  });

  const [social, setSocial] = useState({
    linkedin: "https://linkedin.com/company/techvision-vn",
    facebook: "https://facebook.com/techvisionvn",
    twitter: "",
    youtube: "",
    otherLink: ""
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast.success("Cập nhật hồ sơ công ty thành công!");
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
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast.success("Đổi mật khẩu thành công!");
  };

  const tabs = [
  { key: "company", label: "Thông tin công ty", icon: Building2 },
  { key: "contact", label: "Liên hệ HR", icon: Phone },
  { key: "social", label: "Mạng xã hội", icon: Globe },
  { key: "security", label: "Bảo mật", icon: Shield }];




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Hồ sơ công ty</h1>
          <p className="text-sm text-gray-500 mt-1">Thông tin chính xác giúp thu hút ứng viên chất lượng hơn</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Company card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm"
                style={{ fontWeight: 700, backgroundColor: company.logoColor }}>
                
                {company.logo}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors shadow-sm">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="text-gray-900 text-sm mb-0.5" style={{ fontWeight: 700 }}>{company.name}</div>
            <div className="text-xs text-gray-500 mb-3">{company.industry}</div>


            <div className="w-full mt-4 pt-4 border-t border-gray-100 space-y-2 text-left">
              {[
              { icon: MapPin, text: company.location },
              { icon: Users, text: company.size },
              { icon: Globe, text: company.website.replace("https://", "") }].
              map(({ icon: Icon, text }) =>
              <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>Thống kê tài khoản</h3>
            <div className="space-y-3">
              {[
              { label: "Bài đăng đang active", value: "8" },
              { label: "Tổng ứng viên", value: "24" },
              { label: "Tuyển thành công", value: "14" },
              { label: "Credits còn lại", value: "150" }].
              map(({ label, value }) =>
              <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900" style={{ fontWeight: 600 }}>{value}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Tabs + Forms */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) =>
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key ?
                "border-b-2 border-violet-600 text-violet-600 bg-violet-50/50" :
                "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`
                }>
                
                  <tab.icon className="w-4 h-4" />
                  <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
                </button>
              )}
            </div>

            <div className="p-6">
              {/* ── TAB: Company Info ── */}
              {activeTab === "company" &&
              <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Tên công ty *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={company.name}
                        onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="TechVision Vietnam" />
                      
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Mã số thuế</label>
                      <input
                      value={company.taxCode}
                      onChange={(e) => setCompany((p) => ({ ...p, taxCode: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                      placeholder="0123456789" />
                    
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Lĩnh vực hoạt động *</label>
                      <select
                      value={company.industry}
                      onChange={(e) => setCompany((p) => ({ ...p, industry: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white">
                      
                        {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Quy mô công ty</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                        value={company.size}
                        onChange={(e) => setCompany((p) => ({ ...p, size: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white">
                        
                          {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Năm thành lập</label>
                      <input
                      value={company.founded}
                      onChange={(e) => setCompany((p) => ({ ...p, founded: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                      placeholder="2015"
                      type="number"
                      min="1900"
                      max="2030" />
                    
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Tỉnh / Thành phố *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={company.location}
                        onChange={(e) => setCompany((p) => ({ ...p, location: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="TP. Hồ Chí Minh" />
                      
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Địa chỉ chi tiết</label>
                      <input
                      value={company.address}
                      onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                      placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                    
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Website công ty</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        value={company.website}
                        onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="https://www.company.com"
                        type="url" />
                      
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Giới thiệu công ty *</label>
                    <textarea
                    value={company.description}
                    onChange={(e) => setCompany((p) => ({ ...p, description: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                    placeholder="Mô tả về công ty, sứ mệnh, giá trị cốt lõi và môi trường làm việc..." />
                  
                    <p className="text-xs text-gray-400 mt-1">{company.description.length}/2000 ký tự</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Phúc lợi công ty</label>
                    <textarea
                    value={company.benefits}
                    onChange={(e) => setCompany((p) => ({ ...p, benefits: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                    placeholder="Liệt kê các phúc lợi hấp dẫn: bảo hiểm, thưởng, remote work..." />
                  
                  </div>

                  <div className="flex justify-end">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Contact ── */}
              {activeTab === "contact" &&
              <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Thông tin HR phụ trách</h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Họ và tên HR *</label>
                        <input
                        value={contact.hrName}
                        onChange={(e) => setContact((p) => ({ ...p, hrName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="Nguyễn Thị Hoa" />
                      
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Chức danh</label>
                        <input
                        value={contact.hrTitle}
                        onChange={(e) => setContact((p) => ({ ...p, hrTitle: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="HR Manager" />
                      
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Email HR *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={contact.hrEmail}
                          onChange={(e) => setContact((p) => ({ ...p, hrEmail: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          placeholder="hr@company.com"
                          type="email" />
                        
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Điện thoại HR</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={contact.hrPhone}
                          onChange={(e) => setContact((p) => ({ ...p, hrPhone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          placeholder="028-1234-5678" />
                        
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Thông tin liên hệ công ty</h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Email chung của công ty</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={contact.contactEmail}
                          onChange={(e) => setContact((p) => ({ ...p, contactEmail: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          placeholder="contact@company.com"
                          type="email" />
                        
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>Điện thoại tổng đài</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                          value={contact.contactPhone}
                          onChange={(e) => setContact((p) => ({ ...p, contactPhone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          placeholder="028-1234-5678" />
                        
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Social ── */}
              {activeTab === "social" &&
              <div className="space-y-5">
                  <p className="text-xs text-gray-500">Thêm liên kết mạng xã hội để ứng viên tìm hiểu về công ty bạn</p>
                  {[
                { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/...", color: "text-blue-600" },
                { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/...", color: "text-blue-500" },
                { key: "twitter", label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/...", color: "text-sky-500" },
                { key: "youtube", label: "YouTube", icon: Globe, placeholder: "https://youtube.com/...", color: "text-red-500" },
                { key: "otherLink", label: "Liên kết khác", icon: Link2, placeholder: "https://...", color: "text-gray-500" }].
                map(({ key, label, icon: Icon, placeholder, color }) =>
                <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                      <div className="relative">
                        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${color}`} />
                        <input
                      value={social[key]}
                      onChange={(e) => setSocial((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                      placeholder={placeholder}
                      type="url" />
                    
                      </div>
                    </div>
                )}

                  <div className="flex justify-end mt-2">
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              }

              {/* ── TAB: Security ── */}
              {activeTab === "security" &&
              <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Tài khoản nhà tuyển dụng chứa thông tin nhạy cảm. Hãy sử dụng mật khẩu mạnh và bảo mật.</p>
                  </div>

                  <div className="max-w-md space-y-4">
                    {[
                  { label: "Mật khẩu hiện tại", key: "currentPassword", show: showCurrentPass, setShow: setShowCurrentPass },
                  { label: "Mật khẩu mới", key: "newPassword", show: showNewPass, setShow: setShowNewPass },
                  { label: "Xác nhận mật khẩu mới", key: "confirmPassword", show: showConfirmPass, setShow: setShowConfirmPass }].
                  map(({ label, key, show, setShow }) =>
                  <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 500 }}>{label} *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                        type={show ? "text" : "password"}
                        value={security[key]}
                        onChange={(e) => setSecurity((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        placeholder="••••••••" />
                      
                          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {key === "confirmPassword" && security.confirmPassword && (
                    security.newPassword !== security.confirmPassword ?
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mật khẩu không khớp</p> :
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</p>)
                    }
                      </div>
                  )}

                    <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm transition-colors">
                    
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                      {saving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);

}