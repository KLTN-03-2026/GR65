import { useState } from "react";
import { Calendar, Clock, Video, MapPin, Phone, CheckCircle, Mail, Plus, X, Bell, User, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const mockInterviews = [
  { id: "i1", candidateName: "Nguyễn Minh Trí", jobTitle: "Senior Frontend Developer", date: "2024-04-05", time: "14:00", type: "video", status: "confirmed", avatar: "NT", avatarColor: "#6366f1", notes: "Phỏng vấn vòng 2 - Technical", interviewer: "Nguyễn HR" },
  { id: "i2", candidateName: "Lê Văn Hoàng", jobTitle: "DevOps Engineer", date: "2024-04-08", time: "10:00", type: "onsite", status: "pending", avatar: "LH", avatarColor: "#06b6d4", notes: "Phỏng vấn vòng 1 - Culture fit", interviewer: "Trần Manager" },
  { id: "i3", candidateName: "Trần Thị Lan Anh", jobTitle: "Product Manager", date: "2024-04-10", time: "09:30", type: "video", status: "pending", avatar: "LA", avatarColor: "#8b5cf6", notes: "Vòng cuối - Offer discussion", interviewer: "CEO" },
  { id: "i4", candidateName: "Võ Thanh Nam", jobTitle: "Senior Frontend Developer", date: "2024-04-12", time: "15:00", type: "phone", status: "pending", avatar: "VN", avatarColor: "#10b981", notes: "Screening call", interviewer: "Nguyễn HR" },
];

const typeConfig = {
  video: { label: "Video call", icon: Video, color: "text-blue-600 bg-blue-50" },
  onsite: { label: "Tại văn phòng", icon: MapPin, color: "text-indigo-600 bg-indigo-50" },
  phone: { label: "Điện thoại", icon: Phone, color: "text-emerald-600 bg-emerald-50" },
};

const statusConfig = {
  confirmed: { label: "Đã xác nhận", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  pending: { label: "Chờ xác nhận", color: "text-amber-600 bg-amber-50 border-amber-200" },
  cancelled: { label: "Đã hủy", color: "text-red-500 bg-red-50 border-red-200" },
};

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

export function Interviews() {
  const [interviews, setInterviews] = useState(mockInterviews);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(3); // April
  const [currentYear] = useState(2024);
  const [form, setForm] = useState({ candidateName: "", jobTitle: "", date: "", time: "09:00", type: "video", notes: "", interviewer: "" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);

  const getInterviewsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return interviews.filter(i => i.date === dateStr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInterview = {
      id: `i${Date.now()}`,
      ...form,
      status: "pending",
      avatar: form.candidateName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      avatarColor: "#6366f1",
    };
    setInterviews(prev => [...prev, newInterview]);
    toast.success("Đã đặt lịch phỏng vấn thành công! Email xác nhận đã được gửi tới ứng viên.");
    setShowModal(false);
    setForm({ candidateName: "", jobTitle: "", date: "", time: "09:00", type: "video", notes: "", interviewer: "" });
  };

  const handleSendReminder = (name: string) => {
    toast.success(`Đã gửi nhắc lịch tới ${name}`);
  };

  const handleConfirm = (id: string) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: "confirmed" } : i));
    toast.success("Đã xác nhận lịch phỏng vấn");
  };

  const upcomingInterviews = interviews.sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm text-gray-900">{MONTHS[currentMonth]} {currentYear}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(m => Math.max(0, m - 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => setCurrentMonth(m => Math.min(11, m + 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 py-2" style={{ fontWeight: 500 }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`}></div>)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayInterviews = getInterviewsForDate(day);
              const isToday = day === 28 && currentMonth === 3;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative p-1.5 rounded-xl cursor-pointer transition-all min-h-10 flex flex-col items-center ${isSelected ? "bg-indigo-600 text-white" : isToday ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "hover:bg-gray-50"}`}
                >
                  <span className="text-sm mb-1" style={{ fontWeight: dayInterviews.length > 0 ? 700 : 400 }}>{day}</span>
                  {dayInterviews.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayInterviews.slice(0, 3).map((_, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400"}`}></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm text-gray-700 mb-3" style={{ fontWeight: 500 }}>
                Lịch ngày {selectedDate.split("-").reverse().join("/")}
              </h4>
              {interviews.filter(i => i.date === selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {interviews.filter(i => i.date === selectedDate).map(iv => {
                    const tc = typeConfig[iv.type as keyof typeof typeConfig];
                    return (
                      <div key={iv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: iv.avatarColor }}>
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Không có lịch phỏng vấn ngày này</p>
              )}
            </div>
          )}
        </div>

        {/* Upcoming list */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Sắp tới</h3>
            <div className="space-y-3">
              {upcomingInterviews.map(iv => {
                const tc = typeConfig[iv.type as keyof typeof typeConfig];
                const sc = statusConfig[iv.status as keyof typeof statusConfig];
                return (
                  <div key={iv.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700, backgroundColor: iv.avatarColor }}>
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
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border ${sc.color}`}>{sc.label}</span>
                    {iv.notes && <p className="text-xs text-gray-400 mt-2">{iv.notes}</p>}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {iv.status === "pending" && (
                        <button onClick={() => handleConfirm(iv.id)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Xác nhận
                        </button>
                      )}
                      <button onClick={() => handleSendReminder(iv.candidateName)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Bell className="w-3 h-3" /> Nhắc lịch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-gray-900">Đặt lịch phỏng vấn mới</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Tên ứng viên *</label>
                  <input value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Nguyễn Văn A" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Vị trí tuyển dụng</label>
                  <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Senior Frontend Developer" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Ngày phỏng vấn *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Giờ *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Hình thức</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                    <option value="video">Video call</option>
                    <option value="onsite">Tại văn phòng</option>
                    <option value="phone">Điện thoại</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1.5 block">Người phỏng vấn</label>
                  <input value={form.interviewer} onChange={e => setForm(f => ({ ...f, interviewer: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="HR Manager" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-700 mb-1.5 block">Ghi chú</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Vòng 1 - Technical screening..." />
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-600 flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                Email xác nhận và nhắc lịch sẽ tự động gửi tới ứng viên
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Xác nhận lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
