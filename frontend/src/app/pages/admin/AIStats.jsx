import {
  Brain, TrendingUp, FileText, Image, File, Zap,
  Target, RefreshCw, Cpu } from
"lucide-react";
import { mockAIStats } from "../../data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar } from
"recharts";

const radarData = [
{ skill: "CV Parsing", accuracy: 92 },
{ skill: "JD Analysis", accuracy: 88 },
{ skill: "Skill Matching", accuracy: 85 },
{ skill: "Scoring", accuracy: 89 },
{ skill: "Ranking", accuracy: 87 },
{ skill: "Prediction", accuracy: 78 }];


export function AIStats() {
  const { improvements, cvFormats, feedbackData, topSkills } = mockAIStats;

  const topStats = [
  { label: "Tổng CV đã xử lý", value: mockAIStats.totalParsed.toLocaleString(), icon: Brain, color: "from-violet-600 to-purple-700", sub: "+127 hôm nay" },
  { label: "Độ chính xác AI", value: `${mockAIStats.accuracy}%`, icon: Target, color: "from-indigo-600 to-blue-700", sub: "+0.4% tháng này" },
  { label: "Điểm Match trung bình", value: `${mockAIStats.avgMatchScore}%`, icon: Zap, color: "from-cyan-600 to-teal-700", sub: "Cho tất cả CV-JD pairs" },
  { label: "Feedback Loops", value: mockAIStats.feedbackLoops.toLocaleString(), icon: RefreshCw, color: "from-emerald-600 to-green-700", sub: "Tự động học hỏi" }];


  const formatIcons = { PDF: FileText, "Word (.docx)": File, "Image (OCR)": Image };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900">Thống kê AI Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Hiệu suất, độ chính xác và quá trình học hỏi của hệ thống AI tuyển dụng</p>
      </div>

      {/* AI Status banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 text-white flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white text-sm" style={{ fontWeight: 600 }}>AI Engine v2.4.1</h3>
            <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Online
            </span>
          </div>
          <p className="text-slate-400 text-xs">NLP-powered CV Parser • ML Matching Engine • Feedback Loop Learning System</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
          { label: "API calls/day", value: "8.4K" },
          { label: "Avg latency", value: "1.2s" },
          { label: "Model version", value: "v2.4" }].
          map((s) =>
          <div key={s.label} className="text-center">
              <div className="text-white" style={{ fontWeight: 700, fontSize: 16 }}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          )}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((s) =>
        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl mb-0.5" style={{ fontWeight: 800 }}>{s.value}</div>
            <div className="text-xs text-white/80 mb-0.5">{s.label}</div>
            <div className="text-xs text-white/50">{s.sub}</div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Accuracy over time */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm text-gray-900">Tiến trình cải thiện độ chính xác AI</h3>
              <p className="text-xs text-gray-400">Từ tháng 1 đến tháng 12 — Feedback Loop Learning</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5" />
              +9.1% năm nay
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={improvements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[75, 90]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px #0001", fontSize: 12 }}
                formatter={(val) => [`${val}%`, "Độ chính xác"]} />
              
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} name="Độ chính xác" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Hiệu suất từng module</h3>
          <div className="flex justify-center">
            <RadarChart cx={130} cy={120} outerRadius={90} width={260} height={220} data={radarData}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <PolarRadiusAxis domain={[70, 100]} tick={false} axisLine={false} />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
            </RadarChart>
          </div>
          <div className="space-y-2">
            {radarData.map((item) =>
            <div key={item.skill} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.skill}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.accuracy}%` }}></div>
                  </div>
                  <span className="text-xs text-indigo-600" style={{ fontWeight: 600 }}>{item.accuracy}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CV format distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-4">Phân bổ định dạng CV</h3>
          <div className="space-y-3">
            {cvFormats.map((fmt) => {
              const Icon = formatIcons[fmt.format] || FileText;
              return (
                <div key={fmt.format} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{fmt.format}</span>
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{fmt.count.toLocaleString()}</div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${fmt.percentage}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmt.percentage}% tổng CV</div>
                  </div>
                </div>);

            })}
          </div>

          <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <Image className="w-4 h-4" />
              <span style={{ fontWeight: 500 }}>OCR Technology:</span>
              <span>Trích xuất chữ từ ảnh CV với độ chính xác 89%</span>
            </div>
          </div>
        </div>

        {/* Feedback Loop */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm text-gray-900 mb-2">Feedback Loop AI</h3>
          <p className="text-xs text-gray-400 mb-4">AI tự học từ hành vi accept/reject của nhà tuyển dụng</p>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-4 mb-4">
            <div className="text-xs text-violet-700 mb-3" style={{ fontWeight: 500 }}>Cơ chế hoạt động</div>
            <div className="space-y-2 text-xs text-violet-600">
              {[
              { step: "1", text: "NTD duyệt/từ chối ứng viên AI đề xuất" },
              { step: "2", text: "Hệ thống ghi nhận feedback decision" },
              { step: "3", text: "AI điều chỉnh trọng số matching weights" },
              { step: "4", text: "Model retrain với dữ liệu feedback mới" }].
              map((s) =>
              <div key={s.step} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-violet-200 text-violet-700 rounded-full flex items-center justify-center flex-shrink-0" style={{ fontSize: 10, fontWeight: 700 }}>{s.step}</span>
                  {s.text}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">3 tháng gần nhất</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={feedbackData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} />
                <Bar dataKey="correct" fill="#10b981" radius={[4, 4, 0, 0]} name="Dự đoán đúng" />
                <Bar dataKey="adjusted" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Cần điều chỉnh" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600"><div className="w-2.5 h-2.5 bg-emerald-500 rounded"></div>Dự đoán đúng</span>
            <span className="flex items-center gap-1 text-violet-600"><div className="w-2.5 h-2.5 bg-violet-500 rounded"></div>Cần điều chỉnh</span>
          </div>
        </div>
      </div>

      {/* Top Skills */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm text-gray-900 mb-4">Kỹ năng được tìm kiếm nhiều nhất</h3>
        <div className="flex flex-wrap gap-3">
          {topSkills.map((skill, i) =>
          <div key={skill} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl">
              <span className="text-xs text-indigo-400">#{i + 1}</span>
              <span className="text-sm" style={{ fontWeight: 500 }}>{skill}</span>
            </div>
          )}
        </div>
      </div>
    </div>);

}