import { useState, useEffect } from "react";
import {
  Briefcase, Clock, Eye, CheckCircle, XCircle, Calendar,
  Brain, ArrowRight, MessageSquare, Bell, FileText, Loader2,
  Video, MapPin, Phone } from
"lucide-react";
import { toast } from "sonner";
import api from "../../../lib/api";

const stages = [
{ key: "all", label: "Tất cả", color: "text-gray-600 bg-gray-100" },
{ key: "pending", label: "Chờ duyệt", color: "text-amber-600 bg-amber-50" },
{ key: "reviewing", label: "Đang xem xét", color: "text-blue-600 bg-blue-50" },
{ key: "interview", label: "Phỏng vấn", color: "text-indigo-600 bg-indigo-50" },
{ key: "offer", label: "Offer", color: "text-emerald-600 bg-emerald-50" },
{ key: "rejected", label: "Không phù hợp", color: "text-red-600 bg-red-50" }];


const statusConfig = {
  pending: { label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock },
  reviewing: { label: "Đang xem xét", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Eye },
  interview: { label: "Phỏng vấn", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200", icon: Calendar },
  offer: { label: "Nhận Offer 🎉", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  rejected: { label: "Không phù hợp", color: "text-red-500", bg: "bg-red-50 border-red-200", icon: XCircle }
};

const typeIcons = {
  video: { icon: Video, label: "Video call" },
  onsite: { icon: MapPin, label: "Tại văn phòng" },
  phone: { icon: Phone, label: "Điện thoại" }
};

export function CandidateApplications() {
  const [activeStage, setActiveStage] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);

  const fetchData = async () => {
    try {
      const [appsRes, interviewsRes] = await Promise.all([
        api.get('/api/applications/candidate/me').catch(() => ({ data: [] })),
        api.get('/api/interviews/candidate/me').catch(() => ({ data: [] }))
      ]);
      setMyApplications(appsRes.data);
      setMyInterviews(interviewsRes.data);
      if (appsRes.data.length > 0 && !selectedApp) {
        setSelectedApp(appsRes.data[0].id);
      }
    } catch (err) {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = activeStage === "all" ? myApplications : myApplications.filter((a) => a.status === activeStage);
  const selectedAppData = myApplications.find((a) => a.id === selectedApp);

  const countByStage = (key) => key === "all" ? myApplications.length : myApplications.filter((a) => a.status === key).length;

  // Tìm interview cho application được chọn
  const selectedInterview = myInterviews.find(i => i.applicationId === selectedAppData?.id);

  const handleConfirmInterview = async (interviewId) => {
    try {
      await api.patch(`/api/interviews/${interviewId}/confirm`);
      toast.success("Đã xác nhận tham gia phỏng vấn!");
      fetchData();
    } catch (err) {
      toast.error("Lỗi khi xác nhận");
    }
  };

  const timeline = [
  { label: "Nộp hồ sơ", done: true, date: selectedAppData?.appliedDate ? new Date(selectedAppData.appliedDate).toLocaleDateString('vi-VN') : null },
  { label: "NTD đã xem CV", done: selectedAppData?.cvRead, date: selectedAppData?.cvRead ? "Đã xem" : "Chưa xem" },
  { label: "Đang xem xét", done: ["reviewing", "interview", "offer"].includes(selectedAppData?.status || ""), date: null },
  { label: "Phỏng vấn", done: ["interview", "offer"].includes(selectedAppData?.status || ""), date: selectedInterview ? `${selectedInterview.date} lúc ${selectedInterview.time}` : null },
  { label: "Nhận offer", done: selectedAppData?.status === "offer", date: null }];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-gray-500">Đang tải lịch sử ứng tuyển...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900">Lịch sử ứng tuyển</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi trạng thái tất cả hồ sơ bạn đã nộp</p>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {stages.map((s) =>
        <button
          key={s.key}
          onClick={() => setActiveStage(s.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors ${activeStage === s.key ? `${s.color} border border-current/20` : "bg-white text-gray-500 hover:text-gray-700 border border-gray-100"}`}>
          
            {s.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeStage === s.key ? "bg-current/10" : "bg-gray-100"}`}>
              {countByStage(s.key)}
            </span>
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
        { label: "Tổng đã nộp", value: myApplications.length, color: "text-gray-700", bg: "bg-gray-50" },
        { label: "Đang tiến hành", value: myApplications.filter((a) => ["reviewing", "interview"].includes(a.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Nhận offer", value: myApplications.filter((a) => a.status === "offer").length, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Lịch phỏng vấn", value: myInterviews.filter(i => i.status !== 'cancelled').length, color: "text-indigo-600", bg: "bg-indigo-50" }].
        map((s) =>
        <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <div className={`text-2xl ${s.color} mb-1`} style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Application list */}
        <div className="lg:col-span-3 space-y-3">
          {filtered.map((app) => {
            const sc = statusConfig[app.status] || statusConfig.pending;
            const appInterview = myInterviews.find(i => i.applicationId === app.id);
            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app.id === selectedApp ? null : app.id)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all ${selectedApp === app.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ fontWeight: 700, backgroundColor: '#6366f1' }}>
                    {(app.companyName || app.company || 'C').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{app.jobTitle}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{app.companyName || app.company}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg border ${sc.bg} ${sc.color} flex-shrink-0 flex items-center gap-1`} style={{ fontWeight: 500 }}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      {/* AI Score */}
                      {app.aiScore > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Brain className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-violet-600" style={{ fontWeight: 600 }}>{app.aiScore}%</span>
                          <span className="text-gray-400">phù hợp</span>
                        </div>
                      )}

                      {/* CV Read */}
                      <div className={`flex items-center gap-1 text-xs ${app.cvRead ? "text-emerald-600" : "text-gray-400"}`}>
                        <Eye className="w-3.5 h-3.5" />
                        {app.cvRead ? "Đã xem CV" : "Chưa xem"}
                      </div>
                    </div>

                    {appInterview &&
                    <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Phỏng vấn: {appInterview.date} lúc {appInterview.time}
                      </div>
                    }

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="text-xs text-gray-400">Nộp: {new Date(app.appliedDate).toLocaleDateString('vi-VN')}</span>
                      <span className="text-xs text-indigo-600 flex items-center gap-1">
                        Chi tiết <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>);

          })}

          {filtered.length === 0 &&
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chưa có hồ sơ nào trong mục này</p>
            </div>
          }
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedAppData ?
          <div className="space-y-4">
              {/* Application detail */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Tiến trình ứng tuyển</h3>
                <div className="space-y-0">
                  {timeline.map((step, i) =>
                <div key={step.label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-emerald-500" : "bg-gray-100"}`}>
                          {step.done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                        </div>
                        {i < timeline.length - 1 && <div className={`w-0.5 h-8 mt-1 ${step.done ? "bg-emerald-200" : "bg-gray-100"}`}></div>}
                      </div>
                      <div className="pb-4">
                        <div className={`text-sm ${step.done ? "text-gray-900" : "text-gray-400"}`} style={{ fontWeight: step.done ? 500 : 400 }}>{step.label}</div>
                        {step.date && <div className="text-xs text-gray-400 mt-0.5">{step.date}</div>}
                      </div>
                    </div>
                )}
                </div>
              </div>

              {/* Interview detail card */}
              {selectedInterview && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm text-indigo-700" style={{ fontWeight: 600 }}>Lịch phỏng vấn</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span style={{ fontWeight: 600 }}>{selectedInterview.date}</span>
                      <span>lúc</span>
                      <span style={{ fontWeight: 600 }}>{selectedInterview.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      {(() => {
                        const ti = typeIcons[selectedInterview.type] || typeIcons.video;
                        return <><ti.icon className="w-3.5 h-3.5" /><span>{ti.label}</span></>;
                      })()}
                    </div>
                    {selectedInterview.location && (
                      <div className="flex items-center gap-2 text-sm text-indigo-600">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{selectedInterview.location}</span>
                      </div>
                    )}
                    {selectedInterview.interviewer && (
                      <div className="text-xs text-indigo-500 mt-1">Người PV: {selectedInterview.interviewer}</div>
                    )}
                    {selectedInterview.notes && (
                      <div className="text-xs text-indigo-500 italic mt-1">📝 {selectedInterview.notes}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${
                        selectedInterview.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        selectedInterview.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {selectedInterview.status === 'confirmed' ? 'Đã xác nhận' : selectedInterview.status === 'pending' ? 'Chờ xác nhận' : selectedInterview.status}
                      </span>
                      {selectedInterview.candidateConfirmed && (
                        <span className="text-xs text-emerald-600">✓ Bạn đã xác nhận</span>
                      )}
                    </div>
                    {!selectedInterview.candidateConfirmed && selectedInterview.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleConfirmInterview(selectedInterview.id)}
                        className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Xác nhận tham gia
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="text-sm text-gray-900 mb-3" style={{ fontWeight: 500 }}>Hành động</div>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-3 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <FileText className="w-4 h-4 text-indigo-500" /> Xem CV đã nộp
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <MessageSquare className="w-4 h-4 text-indigo-500" /> Liên hệ NTD
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left">
                    <Bell className="w-4 h-4 text-indigo-500" /> Cài đặt thông báo
                  </button>
                </div>
              </div>
            </div> :

          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn một hồ sơ để xem tiến trình</p>
            </div>
          }
        </div>
      </div>
    </div>);

}