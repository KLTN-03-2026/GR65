import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Eye, Users, Clock, MapPin, DollarSign,
  Briefcase, CheckCircle, XCircle, Search, Zap, Brain, X 
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/api";

const initialForm = {
  title: "", location: "", type: "Full-time", salary: "", experience: "",
  description: "", requirements: [], benefits: [], skills: [], category: "Lập trình"
};

export function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/jobs/employer/me');
      setJobs(res.data.jobs);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách bài đăng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filtered = jobs.filter((j) => {
    if (query && !j.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterStatus !== "all" && j.status !== filterStatus) return false;
    return true;
  });

  const handleToggleStatus = async (job) => {
    try {
      const newStatus = job.status === "active" ? "closed" : "active";
      await api.patch(`/api/jobs/${job.id}/status`, { status: newStatus });
      toast.success(`Đã ${newStatus === 'active' ? 'mở' : 'đóng'} bài tuyển dụng`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này không?")) return;
    try {
      const res = await api.delete(`/api/jobs/${id}`);
      toast.success(res.data.message);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa bài đăng");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.put(`/api/jobs/${editingJob.id}`, form);
        toast.success("Đã cập nhật bài đăng");
      } else {
        await api.post('/api/jobs', form);
        toast.success("Đã đăng bài tuyển dụng thành công!");
      }
      setShowForm(false);
      setEditingJob(null);
      setForm(initialForm);
      fetchJobs();
    } catch (err) {
      toast.error("Lỗi khi lưu bài đăng");
    }
  };

  const handleAddTag = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !form[field].includes(val)) {
        setForm(f => ({ ...f, [field]: [...f[field], val] }));
      }
      e.target.value = '';
    }
  };
  const handleRemoveTag = (field, index) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Bài đăng tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các JD (Job Description) thực tế với DB</p>
        </div>
        <button onClick={() => {setShowForm(true);setEditingJob(null);setForm(initialForm);}} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Tạo JD mới
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
        { label: "Đang tuyển", value: jobs.filter((j) => j.status === "active").length, color: "bg-emerald-50 text-emerald-600" },
        { label: "Đã đóng", value: jobs.filter((j) => j.status === "closed").length, color: "bg-gray-100 text-gray-500" },
        { label: "Tổng ứng tuyển", value: jobs.reduce((sum, j) => sum + j.applicants, 0), color: "bg-indigo-50 text-indigo-600" }].
        map((s) =>
        <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-0.5" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs opacity-80">{s.label}</div>
          </div>
        )}
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Vị trí tuyển dụng", "Lương", "Ứng viên", "AI Chọn", "Ngày đăng", "Trạng thái", ""].map((h) =>
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500" style={{ fontWeight: 500 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((job) =>
              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{job.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{job.type}</span> • <span className="text-xs text-gray-500">{job.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 inline text-gray-400 mb-0.5"/> {job.salary}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" /> <span style={{ fontWeight: 600 }}>{job.applicants}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                     <span className="text-sm font-semibold text-violet-600 flex gap-1"><Brain className="w-4 h-4" /> {job.aiSuggestedCount}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                     {new Date(job.postedDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => handleToggleStatus(job)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${job.status === "active" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {job.status === "active" ? <><CheckCircle className="w-3.5 h-3.5" />Đang tuyển</> : <><XCircle className="w-3.5 h-3.5" />Đã đóng</>}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => {setEditingJob(job); setForm({ ...job }); setShowForm(true);}} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
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
        {filtered.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">Không có bài đăng nào</div>}
      </div>

      {showForm &&
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-gray-900 font-bold text-xl">{editingJob ? "Chỉnh sửa JD" : "Tạo JD mới"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tên vị trí *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Địa điểm</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Loại hình</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20">
                    {["Full-time", "Part-time", "Remote", "Hybrid", "Contract"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Kinh nghiệm</label>
                  <input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mức lương</label>
                  <input value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                
                {/* TAG INPUT CHO Kỹ năng */}
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Kỹ năng chuyên môn (Nhấn Enter để lên tag)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {form.skills && form.skills.map((s, idx) => (
                        <span key={idx} className="bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-md text-sm flex items-center gap-1">
                           {s} <X className="w-3 h-3 hover:text-red-500 cursor-pointer" onClick={() => handleRemoveTag('skills', idx)} />
                        </span>
                     ))}
                  </div>
                  <input onKeyDown={(e)=>handleAddTag(e, 'skills')} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" placeholder="VD: ReactJS rồi nhấn Enter..." />
                </div>

                {/* TAG INPUT CHO Yêu cầu */}
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Yêu cầu ứng viên (Nhấn Enter để tách dòng)</label>
                  <div className="flex flex-col gap-2 mb-2 text-sm text-gray-600">
                     {form.requirements && form.requirements.map((req, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-2 rounded-lg">
                           <span>- {req}</span>
                           <X className="w-4 h-4 hover:text-red-500 cursor-pointer text-gray-400" onClick={() => handleRemoveTag('requirements', idx)} />
                        </div>
                     ))}
                  </div>
                  <input onKeyDown={(e)=>handleAddTag(e, 'requirements')} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" placeholder="VD: Có laptop cá nhân rồi nhấn Enter..." />
                </div>
                
                 {/* TAG INPUT CHO Phúc lợi */}
                 <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Đãi ngộ / Phúc lợi (Nhấn Enter để thêm khối)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {form.benefits && form.benefits.map((b, idx) => (
                        <span key={idx} className="bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-md text-sm flex items-center gap-1">
                           {b} <X className="w-3 h-3 hover:text-red-500 cursor-pointer" onClick={() => handleRemoveTag('benefits', idx)} />
                        </span>
                     ))}
                  </div>
                  <input onKeyDown={(e)=>handleAddTag(e, 'benefits')} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" placeholder="VD: Bảo hiểm Premium rồi nhấn Enter..." />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả công việc</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Mô tả chi tiết..." />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Trở về</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" /> {editingJob ? "Lưu thay đổi JD" : "Xuất bản việc làm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);
}