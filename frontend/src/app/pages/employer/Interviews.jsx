import { useState, useEffect } from "react";
import { Calendar, Clock, Video, MapPin, Phone, CheckCircle, Mail, Plus, X, Bell, ChevronLeft, ChevronRight, Loader2, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/api";

const typeConfig = {
  video: { label: "Video call", icon: Video, color: "text-blue-600 bg-blue-50" },
  onsite: { label: "Tại văn phòng", icon: MapPin, color: "text-indigo-600 bg-indigo-50" },
  phone: { label: "Điện thoại", icon: Phone, color: "text-emerald-600 bg-emerald-50" }
};

const statusConfig = {
  confirmed: { label: "Đã xác nhận", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  pending: { label: "Chờ xác nhận", color: "text-amber-600 bg-amber-50 border-amber-200" },
  cancelled: { label: "Đã hủy", color: "text-red-500 bg-red-50 border-red-200" },
  completed: { label: "Hoàn thành", color: "text-blue-600 bg-blue-50 border-blue-200" }
};

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

export function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [form, setForm] = useState({ applicationId: "", candidateName: "", jobTitle: "", date: "", time: "09:00", type: "video", notes: "", interviewer: "", location: "" });
  const [selectedDate, setSelectedDate] = useState(null);

  // Lấy danh sách ứng viên đang ở stage reviewing/pending để chọn trong form
  const [candidates, setCandidates] = useState([]);

  const fetchInterviews = async () => {
    try {
      const res = await api.get('/api/interviews/employer/me');
      setInterviews(res.data);
    } catch (err) {
      console.error("Lỗi fetch interviews:", err);
      toast.error("Lỗi tải lịch phỏng vấn");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/api/applications/employer/me');
      // Lọc ứng viên có stage là pending hoặc reviewing (chưa có lịch PV)
      setCandidates(res.data.filter(c => ['pending', 'reviewing'].includes(c.stage)));
    } catch (err) {
      console.error("Lỗi fetch candidates:", err);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
  }, []);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);

  const getInterviewsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return interviews.filter((i) => i.date === dateStr);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleSelectCandidate = (appId) => {
    const candidate = candidates.find(c => c.applicationId === appId);
    if (candidate) {
      setForm(f => ({ ...f, applicationId: appId, candidateName: candidate.name, jobTitle: candidate.jobTitle }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicationId) {
      toast.error("Vui lòng chọn ứng viên!");
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/interviews', {
        applicationId: form.applicationId,
        date: form.date,
        time: form.time,
        type: form.type,
        location: form.location,
        interviewer: form.interviewer,
        notes: form.notes
      });
      toast.success("Đã đặt lịch phỏng vấn thành công! Email xác nhận đã được gửi tới ứng viên.");
      setShowModal(false);
      setForm({ applicationId: "", candidateName: "", jobTitle: "", date: "", time: "09:00", type: "video", notes: "", interviewer: "", location: "" });
      fetchInterviews();
      fetchCandidates(); // Refresh candidates list (vì stage đã đổi)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi khi đặt lịch phỏng vấn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (id, name) => {
    try {
      await api.post(`/api/interviews/${id}/remind`);
      toast.success(`Đã gửi nhắc lịch tới ${name}`);
      fetchInterviews();
    } catch (err) {
      toast.error("Lỗi khi gửi nhắc lịch");
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.patch(`/api/interviews/${id}/confirm`);
      toast.success("Đã xác nhận lịch phỏng vấn");
      fetchInterviews();
    } catch (err) {
      toast.error("Lỗi khi xác nhận");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/api/interviews/${id}/cancel`);
      toast.success("Đã hủy lịch phỏng vấn");
      fetchInterviews();
      fetchCandidates();
    } catch (err) {
      toast.error("Lỗi khi hủy lịch");
    }
  };

  const activeInterviews = interviews.filter(i => i.status !== 'cancelled');
  const upcomingInterviews = [...activeInterviews].sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-gray-500">Đang tải lịch phỏng vấn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Lịch phỏng vấn</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi tất cả lịch phỏng vấn</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Đặt lịch mới
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng lịch PV", value: activeInterviews.length, color: "text-indigo-600 bg-indigo-50" },
          { label: "Chờ xác nhận", value: activeInterviews.filter(i => i.status === 'pending').length, color: "text-amber-600 bg-amber-50" },
          { label: "Đã xác nhận", value: activeInterviews.filter(i => i.status === 'confirmed').length, color: "text-emerald-600 bg-emerald-50" },
          { label: "Hoàn thành", value: activeInterviews.filter(i => i.status === 'completed').length, color: "text-blue-600 bg-blue-50" },
        ].map((s, idx) => (
          <div key={idx} className={`p-4 rounded-xl ${s.color}`}>
            <div className="text-xs opacity-70 mb-1">{s.label}</div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm text-gray-900">{MONTHS[currentMonth]} {currentYear}</h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) =>
            <div key={d} className="text-center text-xs text-gray-400 py-2" style={{ fontWeight: 500 }}>{d}</div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`}></div>)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayInterviews = getInterviewsForDate(day);
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative p-1.5 rounded-xl cursor-pointer transition-all min-h-10 flex flex-col items-center ${isSelected ? "bg-indigo-600 text-white" : isToday ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "hover:bg-gray-50"}`}>
                  
                  <span className="text-sm mb-1" style={{ fontWeight: dayInterviews.length > 0 ? 700 : 400 }}>{day}</span>
                  {dayInterviews.length > 0 &&
                  <div className="flex gap-0.5">
                      {dayInterviews.slice(0, 3).map((_, idx) =>
                    <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400"}`}></div>
                    )}
                    </div>
                  }
                </div>);

            })}
          </div>

          {selectedDate &&
          <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm text-gray-700 mb-3" style={{ fontWeight: 500 }}>
                Lịch ngày {selectedDate.split("-").reverse().join("/")}
              </h4>
              {interviews.filter((i) => i.date === selectedDate && i.status !== 'cancelled').length > 0 ?
            <div className="space-y-2">
                  {interviews.filter((i) => i.date === selectedDate && i.status !== 'cancelled').map((iv) => {
                const tc = typeConfig[iv.type] || typeConfig.video;
                return (
                  <div key={iv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: iv.avatarColor || '#6366f1' }}>
                          {iv.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 500 }}>{iv.candidateName}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{iv.time}
                            <span className={`px-1.5 py-0.5 rounded ${tc.color} flex items-center gap-1`}>
                              <tc.icon className="w-3 h-3" />{tc.label}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${(statusConfig[iv.status] || statusConfig.pending).color}`}>
                          {(statusConfig[iv.status] || statusConfig.pending).label}
                        </span>
                      </div>);

              })}
                </div> :

            <p className="text-sm text-gray-400">Không có lịch phỏng vấn ngày này</p>
            }
            </div>
          }
        </div>

        {/* Upcoming list */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>
              {upcomingInterviews.length > 0 ? `Sắp tới (${upcomingInterviews.length})` : 'Sắp tới'}
            </h3>
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có lịch phỏng vấn nào</p>
                <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-indigo-600 hover:text-indigo-700">
                  + Đặt lịch mới
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((iv) => {
                  const tc = typeConfig[iv.type] || typeConfig.video;
                  const sc = statusConfig[iv.status] || statusConfig.pending;
                  return (
                    <div key={iv.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: iv.avatarColor || '#6366f1' }}>
                          {iv.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{iv.candidateName}</div>
                          <div className="text-xs text-gray-400 truncate">{iv.jobTitle}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {iv.date} • {iv.time}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg w-fit ${tc.color}`}>
                          <tc.icon className="w-3 h-3" />{tc.label}
                        </div>
                        {iv.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />{iv.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${sc.color}`}>{sc.label}</span>
                        {iv.candidateConfirmed && (
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">UV đã xác nhận</span>
                        )}
                      </div>
                      {iv.notes && <p className="text-xs text-gray-400 mt-2">{iv.notes}</p>}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        {iv.status === "pending" &&
                        <button onClick={() => handleConfirm(iv.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                            <CheckCircle className="w-3 h-3" /> Xác nhận
                          </button>
                        }
                        <button onClick={() => handleSendReminder(iv.id, iv.candidateName)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                          <Bell className="w-3 h-3" /> Nhắc lịch
                        </button>
                        {iv.status !== "cancelled" && (
                          <button onClick={() => handleCancel(iv.id)} className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-1.5 px-2 rounded-lg hover:bg-red-100 transition-colors">
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>);

                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal &&
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-gray-900">Đặt lịch phỏng vấn mới</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Chọn ứng viên từ danh sách thật */}
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Chọn ứng viên *</label>
                  {candidates.length > 0 ? (
                    <select 
                      value={form.applicationId} 
                      onChange={(e) => handleSelectCandidate(e.target.value)} 
                      required 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="">-- Chọn ứng viên --</option>
                      {candidates.map(c => (
                        <option key={c.applicationId} value={c.applicationId}>
                          {c.name} — {c.jobTitle} ({c.stage === 'pending' ? 'Chờ duyệt' : 'Đang xem xét'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Không có ứng viên nào ở trạng thái chờ duyệt / đang xem xét
                    </div>
                  )}
                </div>

                {form.applicationId && (
                  <div className="col-span-2 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm" style={{ fontWeight: 700, backgroundColor: '#6366f1' }}>
                      {form.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{form.candidateName}</div>
                      <div className="text-xs text-indigo-600">{form.jobTitle}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Ngày phỏng vấn *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Giờ *</label>
                  <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Hình thức</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                    <option value="video">Video call</option>
                    <option value="onsite">Tại văn phòng</option>
                    <option value="phone">Điện thoại</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Người phỏng vấn</label>
                  <input value={form.interviewer} onChange={(e) => setForm((f) => ({ ...f, interviewer: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="HR Manager" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Địa điểm / Link meeting</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="https://meet.google.com/... hoặc 123 Đường ABC" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Ghi chú</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Vòng 1 - Technical screening..." />
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-600 flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                Email xác nhận và nhắc lịch sẽ tự động gửi tới ứng viên
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={submitting || candidates.length === 0} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {submitting ? 'Đang xử lý...' : 'Xác nhận lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}