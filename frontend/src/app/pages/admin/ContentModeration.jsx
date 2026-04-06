import { useState } from "react";
import { FileCheck, Briefcase, FileText, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const mockPendingJDs = [
{ id: "jd1", title: "Senior React Developer", company: "StartupXYZ", logo: "SX", logoColor: "#6366f1", postedDate: "2024-03-28", skills: ["React", "TypeScript"], salary: "25-40 triệu", risk: "low", description: "Tuyển senior react developer với 3+ năm kinh nghiệm..." },
{ id: "jd2", title: "Marketing Specialist", company: "AdAgency", logo: "AA", logoColor: "#f59e0b", postedDate: "2024-03-27", skills: ["SEO", "Ads"], salary: "15-22 triệu", risk: "medium", description: "Cần người có kinh nghiệm digital marketing và content..." },
{ id: "jd3", title: "Data Analyst", company: "FinTech Ltd", logo: "FL", logoColor: "#10b981", postedDate: "2024-03-27", skills: ["SQL", "Python"], salary: "20-35 triệu", risk: "low", description: "Phân tích dữ liệu tài chính, xây dựng báo cáo..." },
{ id: "jd4", title: "🚨 Get Rich Quick!", company: "UnknownCo", logo: "UC", logoColor: "#ef4444", postedDate: "2024-03-26", skills: [], salary: "100+ triệu", risk: "high", description: "Kiếm tiền dễ dàng không cần kỹ năng, liên hệ ngay..." }];


const mockPendingCVs = [
{ id: "cv1", name: "Nguyễn Văn Test", title: "Frontend Developer", uploadDate: "2024-03-28", format: "PDF", risk: "low", size: "1.2 MB" },
{ id: "cv2", name: "Anonymous User", title: "N/A", uploadDate: "2024-03-27", format: "Image", risk: "medium", size: "3.8 MB" },
{ id: "cv3", name: "Trần Thị A", title: "Marketing", uploadDate: "2024-03-26", format: "DOCX", risk: "low", size: "0.8 MB" }];


const riskConfig = {
  low: { label: "Thấp", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  medium: { label: "Trung bình", color: "text-amber-600 bg-amber-50 border-amber-200" },
  high: { label: "Cao ⚠️", color: "text-red-600 bg-red-50 border-red-200" }
};

export function ContentModeration() {
  const [jdItems, setJdItems] = useState(mockPendingJDs);
  const [cvItems, setCvItems] = useState(mockPendingCVs);
  const [activeTab, setActiveTab] = useState("jd");
  const [selectedItem, setSelectedItem] = useState(null);

  const approveJD = (id) => {
    const item = jdItems.find((j) => j.id === id);
    setJdItems((prev) => prev.filter((j) => j.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    toast.success(`Đã duyệt bài đăng "${item?.title}"`);
  };

  const rejectJD = (id) => {
    const item = jdItems.find((j) => j.id === id);
    setJdItems((prev) => prev.filter((j) => j.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    toast.success(`Đã từ chối bài đăng "${item?.title}"`);
  };

  const approveCV = (id) => {
    const item = cvItems.find((c) => c.id === id);
    setCvItems((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Đã duyệt CV của "${item?.name}"`);
  };

  const rejectCV = (id) => {
    const item = cvItems.find((c) => c.id === id);
    setCvItems((prev) => prev.filter((c) => c.id !== id));
    toast.error(`Đã từ chối CV của "${item?.name}"`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900">Kiểm duyệt nội dung</h1>
        <p className="text-sm text-gray-500 mt-1">Xem xét và duyệt các bài đăng JD và CV mới trước khi hiển thị công khai</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
        { label: "JD chờ duyệt", value: jdItems.length, color: "bg-amber-50 text-amber-600", icon: Briefcase },
        { label: "CV chờ duyệt", value: cvItems.length, color: "bg-blue-50 text-blue-600", icon: FileText },
        { label: "Nguy cơ cao", value: jdItems.filter((j) => j.risk === "high").length + cvItems.filter((c) => c.risk === "high").length, color: "bg-red-50 text-red-600", icon: AlertCircle }].
        map((s) =>
        <div key={s.label} className={`${s.color} rounded-2xl p-4 flex items-center gap-3`}>
            <s.icon className="w-6 h-6 opacity-70" />
            <div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-xs opacity-80">{s.label}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
        { key: "jd", label: "Bài đăng JD", count: jdItems.length },
        { key: "cv", label: "CV ứng viên", count: cvItems.length }].
        map((tab) =>
        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {activeTab === "jd" ?
          jdItems.length > 0 ? jdItems.map((item) => {
            const risk = riskConfig[item.risk];
            return (
              <div key={item.id} onClick={() => setSelectedItem(item)} className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedItem?.id === item.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: item.logoColor }}>
                      {item.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.company}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border flex-shrink-0 ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Clock className="w-3 h-3" /> {item.postedDate}
                    <span>•</span>
                    {item.salary}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => {e.stopPropagation();approveJD(item.id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={(e) => {e.stopPropagation();rejectJD(item.id);}} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>);

          }) :
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Không có JD nào chờ duyệt</p>
              </div> :


          cvItems.length > 0 ? cvItems.map((cv) => {
            const risk = riskConfig[cv.risk];
            return (
              <div key={cv.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                      {cv.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{cv.name}</h4>
                      <p className="text-xs text-gray-400">{cv.title} • {cv.format} • {cv.size}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border flex-shrink-0 ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {cv.uploadDate}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveCV(cv.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={() => rejectCV(cv.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>);

          }) :
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Không có CV nào chờ duyệt</p>
              </div>

          }
        </div>

        {/* JD detail */}
        <div className="lg:col-span-3">
          {selectedItem && activeTab === "jd" ?
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 18, backgroundColor: selectedItem.logoColor }}>
                  {selectedItem.logo}
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{selectedItem.title}</h2>
                  <p className="text-gray-500 text-sm">{selectedItem.company}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl border ${riskConfig[selectedItem.risk].color}`}>
                  Nguy cơ: {riskConfig[selectedItem.risk].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Mức lương</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedItem.salary}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Ngày đăng</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedItem.postedDate}</div>
                </div>
              </div>

              {selectedItem.skills.length > 0 &&
            <div>
                  <div className="text-xs text-gray-400 mb-2">Kỹ năng yêu cầu</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.skills.map((s) => <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">{s}</span>)}
                  </div>
                </div>
            }

              <div>
                <div className="text-xs text-gray-400 mb-2">Nội dung mô tả</div>
                <div className={`p-4 rounded-xl text-sm text-gray-600 leading-relaxed ${selectedItem.risk === "high" ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.risk === "high" &&
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-red-700" style={{ fontWeight: 500 }}>Nội dung có rủi ro cao</div>
                    <div className="text-xs text-red-500">AI phát hiện dấu hiệu spam hoặc lừa đảo. Khuyến nghị từ chối.</div>
                  </div>
                </div>
            }

              <div className="flex gap-3 pt-2">
                <button onClick={() => rejectJD(selectedItem.id)} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối bài đăng
                </button>
                <button onClick={() => approveJD(selectedItem.id)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm transition-colors">
                  <CheckCircle className="w-4 h-4" /> Duyệt & Công khai
                </button>
              </div>
            </div> :

          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <FileCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">{activeTab === "jd" ? "Chọn một bài đăng để xem chi tiết và kiểm duyệt" : "Danh sách CV đang hiển thị bên trái"}</p>
            </div>
          }
        </div>
      </div>
    </div>);

}