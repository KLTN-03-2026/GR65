import { useState } from "react";
import {
  Plus, Edit, Trash2, Eye, Users, Clock, MapPin, DollarSign,
  Briefcase, CheckCircle, XCircle,
  Search, Zap, Brain, X } from
"lucide-react";
import { mockJobs } from "../../data/mockData";
import { toast } from "sonner";



const initialForm = {
  title: "", location: "", type: "Full-time", salary: "", experience: "",
  description: "", requirements: "", benefits: "", skills: "", category: "Lập trình"
};

export function JobPostings() {
  const [jobs, setJobs] = useState(mockJobs.filter((j) => j.employerId === "e1" || j.employerId === "e2"));
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = jobs.filter((j) => {
    if (query && !j.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterStatus !== "all" && j.status !== filterStatus) return false;
    return true;
  });

  const handleToggleStatus = (id) => {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: j.status === "active" ? "closed" : "active" } : j));
    toast.success("Đã cập nhật trạng thái bài đăng");
  };

  const handleDelete = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    toast.success("Đã xóa bài đăng tuyển dụng");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingJob) {
      setJobs((prev) => prev.map((j) => j.id === editingJob.id ? { ...j, title: form.title, location: form.location } : j));
      toast.success("Đã cập nhật bài đăng");
    } else {
      const newJob = {
        id: `j${Date.now()}`,
        title: form.title,
        company: "TechVision Vietnam",
        companyLogo: "TV",
        companyLogoColor: "#6366f1",
        location: form.location,
        type: form.type,
        salary: form.salary,
        experience: form.experience,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        description: form.description,
        requirements: form.requirements.split("\n").filter(Boolean),
        benefits: form.benefits.split(",").map((s) => s.trim()).filter(Boolean),
        status: "active",
        postedDate: new Date().toISOString().split("T")[0],
        deadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        applicants: 0,
        aiSuggestedCount: 0,
        views: 0,
        employerId: "e1",
        category: form.category,
        featured: false,
        aiMatchScore: 0
      };
      setJobs((prev) => [newJob, ...prev]);
      toast.success("Đã đăng bài tuyển dụng thành công!");
    }
    setShowForm(false);
    setEditingJob(null);
    setForm(initialForm);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Bài đăng tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các JD (Job Description) của bạn</p>
        </div>
        <button onClick={() => {setShowForm(true);setEditingJob(null);setForm(initialForm);}} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Tạo JD mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
        { label: "Đang tuyển", value: jobs.filter((j) => j.status === "active").length, color: "bg-emerald-50 text-emerald-600" },
        { label: "Đã đóng", value: jobs.filter((j) => j.status === "closed").length, color: "bg-gray-100 text-gray-500" },
        { label: "Tổng ứng viên", value: jobs.reduce((sum, j) => sum + j.applicants, 0), color: "bg-indigo-50 text-indigo-600" }].
        map((s) =>
        <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-0.5" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs opacity-80">{s.label}</div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm JD..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        {["all", "active", "closed"].map((s) =>
        <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${filterStatus === s ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"}`}>
            {s === "all" ? "Tất cả" : s === "active" ? "Đang tuyển" : "Đã đóng"}
          </button>
        )}
      </div>

      {/* Job table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Vị trí tuyển dụng", "Địa điểm / Lương", "Ứng viên", "AI Gợi ý", "Lượt xem", "Hạn nộp", "Trạng thái", ""].map((h) =>
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((job) =>
              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: job.companyLogoColor }}>
                        {job.companyLogo}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{job.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{job.type}</span>
                          {job.featured && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Nổi bật</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <MapPin className="w-3 h-3 text-gray-400" />{job.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <DollarSign className="w-3 h-3 text-gray-400" />{job.salary}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span style={{ fontWeight: 600 }}>{job.applicants}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-violet-600">
                      <Brain className="w-4 h-4" />
                      <span style={{ fontWeight: 600 }}>{job.aiSuggestedCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye className="w-4 h-4 text-gray-400" />{job.views}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />{job.deadline}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => handleToggleStatus(job.id)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${job.status === "active" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {job.status === "active" ? <><CheckCircle className="w-3.5 h-3.5" />Đang tuyển</> : <><XCircle className="w-3.5 h-3.5" />Đã đóng</>}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => {setEditingJob(job);setForm({ ...initialForm, title: job.title, location: job.location, type: job.type, salary: job.salary, experience: job.experience, description: job.description, skills: job.skills.join(", "), requirements: job.requirements.join("\n"), benefits: job.benefits.join(", "), category: job.category });setShowForm(true);}} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 &&
        <div className="py-12 text-center text-gray-400 text-sm">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            Không có bài đăng nào
          </div>
        }
      </div>

      {/* Create/Edit Modal */}
      {showForm &&
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-gray-900">{editingJob ? "Chỉnh sửa JD" : "Tạo JD mới"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Tên vị trí *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="VD: Senior Frontend Developer" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Địa điểm</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="TP. Hồ Chí Minh" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Loại hình</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                    {["Full-time", "Part-time", "Remote", "Hybrid", "Contract"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Mức lương</label>
                  <input value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="30-50 triệu" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Kinh nghiệm</label>
                  <input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="3-5 năm" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Kỹ năng (cách nhau bởi dấu phẩy)</label>
                  <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="React, TypeScript, Node.js" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Mô tả công việc</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Mô tả chi tiết về công việc..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Yêu cầu (mỗi yêu cầu một dòng)</label>
                  <textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="React 5+ năm&#10;TypeScript 3+ năm" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Phúc lợi (cách nhau bởi dấu phẩy)</label>
                  <input value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Lương cạnh tranh, Remote, Bảo hiểm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> {editingJob ? "Lưu thay đổi" : "Đăng tuyển dụng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}