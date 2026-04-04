import { useState } from "react";
import {
  Brain, Target, Clock, Calendar, Mail, CheckCircle,
  XCircle, Zap, ArrowRight, User, Eye, MoreVertical, Plus
} from "lucide-react";
import { mockPipeline } from "../../data/mockData";
import { toast } from "sonner";

type PipelineEntry = {
  id: string;
  jobTitle: string;
  candidateName: string;
  aiScore: number;
  avatar: string;
  avatarColor: string;
  appliedDate: string;
  cvRead: boolean;
  interviewDate?: string | null;
  type: string;
  notes?: string;
};

type PipelineKey = "pending" | "reviewing" | "interview" | "offer" | "rejected";

const columns: { key: PipelineKey; label: string; color: string; bg: string; border: string }[] = [
  { key: "pending", label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { key: "reviewing", label: "Đánh giá", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { key: "interview", label: "Phỏng vấn", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { key: "offer", label: "Nhận việc", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { key: "rejected", label: "Từ chối", color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
];

export function Pipeline() {
  const [pipeline, setPipeline] = useState<Record<PipelineKey, PipelineEntry[]>>(mockPipeline as any);
  const [dragging, setDragging] = useState<{ id: string; from: PipelineKey } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PipelineKey | null>(null);

  const handleDragStart = (id: string, from: PipelineKey) => {
    setDragging({ id, from });
  };

  const handleDrop = (to: PipelineKey) => {
    if (!dragging || dragging.from === to) {
      setDragging(null);
      setDragOverCol(null);
      return;
    }
    const card = pipeline[dragging.from].find(c => c.id === dragging.id);
    if (!card) return;
    setPipeline(prev => ({
      ...prev,
      [dragging.from]: prev[dragging.from].filter(c => c.id !== dragging.id),
      [to]: [...prev[to], card],
    }));
    toast.success(`Đã chuyển ${card.candidateName} sang "${columns.find(c => c.key === to)?.label}"`);
    setDragging(null);
    setDragOverCol(null);
  };

  const moveCard = (id: string, from: PipelineKey, to: PipelineKey) => {
    const card = pipeline[from].find(c => c.id === id);
    if (!card) return;
    setPipeline(prev => ({
      ...prev,
      [from]: prev[from].filter(c => c.id !== id),
      [to]: [...prev[to], card],
    }));
    toast.success(`Đã chuyển ${card.candidateName} sang "${columns.find(c => c.key === to)?.label}"`);
  };

  const totalCards = Object.values(pipeline).flat().length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Pipeline Ứng viên</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý phễu tuyển dụng — kéo thả để di chuyển ứng viên giữa các giai đoạn</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2">
            <User className="w-4 h-4" />
            <span>{totalCards} ứng viên</span>
          </div>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {columns.map(col => (
          <div key={col.key} className={`flex items-center gap-2 px-4 py-2 rounded-xl border flex-shrink-0 ${col.bg} ${col.border}`}>
            <span className={`text-sm ${col.color}`} style={{ fontWeight: 500 }}>{col.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/60 ${col.color}`} style={{ fontWeight: 700 }}>{pipeline[col.key].length}</span>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-5 gap-4 min-h-96">
        {columns.map(col => (
          <div
            key={col.key}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.key); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col.key)}
            className={`rounded-2xl transition-all ${dragOverCol === col.key ? `${col.bg} ${col.border} border-2 border-dashed` : "bg-slate-50 border-2 border-transparent"}`}
          >
            {/* Column header */}
            <div className={`p-3 rounded-t-2xl border-b ${col.bg} ${col.border} border-b`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${col.color}`} style={{ fontWeight: 600 }}>{col.label}</span>
                <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${col.bg} ${col.color} border ${col.border}`} style={{ fontWeight: 700, fontSize: 10 }}>{pipeline[col.key].length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-32">
              {pipeline[col.key].map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id, col.key)}
                  className="bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: 11, backgroundColor: card.avatarColor }}>
                      {card.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 600 }}>{card.candidateName}</div>
                      <div className="text-xs text-gray-400 truncate">{card.jobTitle}</div>
                    </div>
                  </div>

                  {/* AI Score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3 text-violet-500" />
                      <span className="text-xs text-violet-600" style={{ fontWeight: 600 }}>{card.aiScore}%</span>
                    </div>
                    {card.type === "ai_suggested" && (
                      <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded" style={{ fontSize: 9 }}>AI</span>
                    )}
                    {card.cvRead && (
                      <Eye className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>

                  {card.interviewDate && (
                    <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-1.5 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span style={{ fontSize: 10 }}>{card.interviewDate}</span>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-gray-50">
                    {col.key === "pending" && (
                      <>
                        <button onClick={() => moveCard(card.id, col.key, "reviewing")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-600 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Duyệt
                        </button>
                        <button onClick={() => moveCard(card.id, col.key, "rejected")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 py-1 rounded-lg hover:bg-red-100 transition-colors">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </button>
                      </>
                    )}
                    {col.key === "reviewing" && (
                      <>
                        <button onClick={() => moveCard(card.id, col.key, "interview")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-indigo-50 text-indigo-600 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                          <Calendar className="w-3 h-3" /> Mời PV
                        </button>
                        <button onClick={() => moveCard(card.id, col.key, "rejected")} className="text-xs bg-gray-50 text-gray-400 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {col.key === "interview" && (
                      <>
                        <button onClick={() => moveCard(card.id, col.key, "offer")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-600 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Offer
                        </button>
                        <button onClick={() => moveCard(card.id, col.key, "rejected")} className="text-xs bg-gray-50 text-gray-400 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {col.key === "offer" && (
                      <div className="flex-1 flex items-center justify-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Đã offer!
                      </div>
                    )}
                    {col.key === "rejected" && (
                      <button onClick={() => moveCard(card.id, col.key, "pending")} className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-500 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <ArrowRight className="w-3 h-3" /> Xem xét lại
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {pipeline[col.key].length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                  <User className="w-6 h-6 text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">Kéo ứng viên vào đây</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-2"><Brain className="w-3 h-3 text-violet-500" />AI Score — độ phù hợp với JD</span>
          <span className="flex items-center gap-2"><Eye className="w-3 h-3 text-emerald-500" />Đã xem CV</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-violet-100 text-violet-600 flex items-center justify-center" style={{ fontSize: 8 }}>AI</span>Ứng viên do AI gợi ý</span>
          <span className="flex items-center gap-2"><Calendar className="w-3 h-3 text-indigo-500" />Có lịch phỏng vấn</span>
          <span className="ml-auto text-gray-400">💡 Kéo thả card để chuyển giai đoạn</span>
        </div>
      </div>
    </div>
  );
}
