import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Brain, Zap, Shield, Users, BarChart3, FileSearch,
  ArrowRight, Check, Star, Building2, User, ChevronDown,
  Bot, Target, TrendingUp, Globe, Mail, Phone, Sparkles,
  Clock, Award
} from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1762330466678-45b42e02f5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHJlY3J1aXRtZW50JTIwdGVjaG5vbG9neSUyMGFic3RyYWN0fGVufDF8fHx8MTc3NDY5NjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080";
const INTERVIEW_IMG = "https://images.unsplash.com/photo-1748346918817-0b1b6b2f9bab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBqb2IlMjBpbnRlcnZpZXclMjBvZmZpY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc0NjI5NDE3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const TEAM_IMG = "https://images.unsplash.com/photo-1758873268663-5a362616b5a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMGNvbGxhYm9yYXRpb24lMjB3b3JrcGxhY2V8ZW58MXx8fHwxNzc0Njk2NDU1fDA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  { icon: Brain, title: "AI CV Parsing", desc: "Trích xuất thông tin CV thông minh từ PDF, Word, và ảnh (OCR) với độ chính xác 95%+", color: "from-violet-500 to-purple-600" },
  { icon: Target, title: "AI Matching Engine", desc: "Thuật toán so khớp CV-JD tiên tiến, tự động xếp hạng ứng viên theo độ phù hợp", color: "from-indigo-500 to-blue-600" },
  { icon: TrendingUp, title: "Feedback Loop AI", desc: "Hệ thống tự học hỏi từ phản hồi của nhà tuyển dụng, liên tục cải thiện độ chính xác", color: "from-cyan-500 to-teal-600" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Báo cáo chi tiết về hiệu suất tuyển dụng, AI performance và xu hướng thị trường", color: "from-emerald-500 to-green-600" },
  { icon: Shield, title: "Bảo mật tuyệt đối", desc: "Mã hóa dữ liệu end-to-end, tuân thủ GDPR và các tiêu chuẩn bảo mật quốc tế", color: "from-orange-500 to-amber-600" },
  { icon: Globe, title: "Tích hợp đa nền tảng", desc: "API mở, tích hợp dễ dàng với các hệ thống HR và công cụ tuyển dụng hiện có", color: "from-rose-500 to-pink-600" },
];

const stats = [
  { value: "12,847+", label: "Ứng viên đăng ký", icon: Users },
  { value: "1,456+", label: "Doanh nghiệp tin dùng", icon: Building2 },
  { value: "87.3%", label: "Độ chính xác AI", icon: Brain },
  { value: "4,521+", label: "Tuyển dụng thành công", icon: Award },
];

const testimonials = [
  { name: "Nguyễn Thành Đạt", role: "HR Director, TechVision Vietnam", avatar: "NĐ", color: "#6366f1", text: "AI-ATS đã giảm 70% thời gian sàng lọc hồ sơ của chúng tôi. Độ chính xác matching rất ấn tượng!", stars: 5 },
  { name: "Trần Minh Châu", role: "Talent Acquisition, GreenBank Corp", avatar: "MC", color: "#10b981", text: "Pipeline quản lý ứng viên rất trực quan. Đội tuyển dụng của chúng tôi đã tăng năng suất lên 3 lần.", stars: 5 },
  { name: "Lê Phương Thảo", role: "Senior Developer", avatar: "PT", color: "#f59e0b", text: "AI gợi ý công việc rất chính xác. Tôi tìm được việc mơ ước chỉ trong 2 tuần!", stars: 5 },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "AI phân tích CV như thế nào?", a: "Hệ thống sử dụng NLP và Machine Learning để trích xuất thông tin từ CV (PDF, Word, ảnh), sau đó so khớp với yêu cầu JD và tính điểm phù hợp." },
    { q: "Dữ liệu của tôi có được bảo mật không?", a: "Tất cả dữ liệu được mã hóa end-to-end và lưu trữ trên hạ tầng đám mây an toàn. Chúng tôi tuân thủ GDPR và không bao giờ chia sẻ dữ liệu mà không có sự đồng ý." },
    { q: "AI có cải thiện theo thời gian không?", a: "Có! Hệ thống Feedback Loop AI tự học từ hành vi của nhà tuyển dụng (accept/reject), liên tục điều chỉnh trọng số để tăng độ chính xác." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, color: "#0f172a" }}>AI<span className="text-indigo-600">Recruit</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Tính năng", "Giải pháp", "Blog"].map((item) => (
              <a key={item} href="#" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors">Đăng nhập</button>
            <button onClick={() => navigate("/register")} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Đăng ký miễn phí</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white pt-24 pb-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-indigo-500 blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-violet-500 blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-sm text-indigo-200">Hệ thống ATS tích hợp AI đầu tiên tại Việt Nam</span>
            </div>
            <h1 className="text-4xl md:text-5xl mb-6 leading-tight" style={{ fontWeight: 800, fontSize: 44 }}>
              Tuyển dụng thông minh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">với sức mạnh AI</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Nền tảng ATS tích hợp AI giúp doanh nghiệp tuyển đúng người, đúng việc — nhanh hơn 10 lần so với phương pháp truyền thống.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate("/register")} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30">
                Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/login")} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/20 transition-all">
                <User className="w-4 h-4" /> Đăng nhập
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              {[{ label: "Ứng viên", value: "9,823+" }, { label: "Doanh nghiệp", value: "1,456+" }, { label: "AI Accuracy", value: "87.3%" }].map((item) => (
                <div key={item.label}>
                  <div className="text-xl text-white" style={{ fontWeight: 700 }}>{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/50 border border-indigo-500/20">
              <img src={HERO_IMG} alt="AI Recruitment" className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent rounded-2xl"></div>
            </div>
            {/* Floating cards */}
            <div className="absolute -left-6 top-8 bg-white rounded-xl p-3 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">AI Match Score</div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>94% Phù hợp</div>
              </div>
            </div>
            <div className="absolute -right-4 bottom-8 bg-white rounded-xl p-3 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">AI đang xử lý</div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>127 CV hôm nay</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-3xl text-gray-900 mb-1" style={{ fontWeight: 800 }}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-sm px-4 py-1.5 rounded-full mb-4">Tính năng nổi bật</span>
            <h2 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>Công nghệ AI hàng đầu cho tuyển dụng</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Kết hợp trí tuệ nhân tạo với quy trình tuyển dụng chuyên nghiệp, giúp bạn tìm đúng ứng viên, đúng thời điểm.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-violet-100 text-violet-700 text-sm px-4 py-1.5 rounded-full mb-4">Quy trình hoạt động</span>
            <h2 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>Tuyển dụng thông minh trong 4 bước</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { step: "01", title: "Đăng JD & AI phân tích", desc: "Nhà tuyển dụng tạo bài đăng tuyển dụng, AI tự động trích xuất yêu cầu kỹ năng, kinh nghiệm cần thiết", icon: FileSearch, color: "bg-indigo-500" },
                { step: "02", title: "AI Matching & Xếp hạng", desc: "Thuật toán AI so khớp hàng trăm CV với JD, tính điểm và xếp hạng ứng viên theo mức độ phù hợp", icon: Brain, color: "bg-violet-500" },
                { step: "03", title: "Pipeline quản lý", desc: "HR quản lý ứng viên qua pipeline trực quan: Pending → Review → Interview → Offer", icon: Users, color: "bg-cyan-500" },
                { step: "04", title: "AI học & cải thiện", desc: "Mỗi quyết định accept/reject giúp AI tự học, ngày càng matching chính xác hơn", icon: TrendingUp, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">BƯỚC {item.step}</div>
                    <h3 className="text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src={INTERVIEW_IMG} alt="Process" className="w-full h-96 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>Dành cho ai?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Ứng viên tìm việc", icon: User, color: "from-indigo-500 to-blue-600",
                benefits: ["AI gợi ý công việc phù hợp với kỹ năng", "Theo dõi trạng thái ứng tuyển real-time", "Lưu nhiều bản CV cho từng vị trí", "Nhận thông báo khi CV được xem"],
                cta: "Đăng ký tìm việc", path: "/register",
              },
              {
                title: "Nhà tuyển dụng", icon: Building2, color: "from-violet-500 to-purple-600",
                benefits: ["Tự động sàng lọc và xếp hạng CV bằng AI", "Pipeline quản lý ứng viên trực quan", "Lịch phỏng vấn tích hợp thông báo", "Analytics hiệu suất tuyển dụng"],
                cta: "Đăng tuyển ngay", path: "/register",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm border border-white">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-4">{item.title}</h3>
                <ul className="space-y-3 mb-6">
                  {item.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(item.path)} className={`w-full py-3 rounded-xl text-white bg-gradient-to-r ${item.color} hover:opacity-90 transition-opacity`}>
                  {item.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>Khách hàng nói gì về chúng tôi?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 700, backgroundColor: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl mb-4" style={{ fontWeight: 700 }}>Sẵn sàng tuyển dụng thông minh hơn?</h2>
          <p className="text-indigo-200 mb-8">Tham gia cùng hơn 1,456 doanh nghiệp đang sử dụng AI để tuyển dụng hiệu quả.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate("/register")} className="bg-white text-indigo-600 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Tôi là Nhà tuyển dụng
            </button>
            <button onClick={() => navigate("/register")} className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl border border-white/30 transition-colors flex items-center gap-2">
              <User className="w-5 h-5" /> Tôi là Ứng viên
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontWeight: 700 }}>AI<span className="text-indigo-400">Recruit</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Hệ thống ATS tích hợp AI hàng đầu Việt Nam</p>
          </div>
          {[
            { title: "Sản phẩm", links: ["Tính năng AI", "API Docs", "Changelog"] },
            { title: "Công ty", links: ["Về chúng tôi", "Blog", "Tuyển dụng", "Press kit"] },
            { title: "Hỗ trợ", links: ["Trung tâm trợ giúp", "Liên hệ", "Privacy Policy", "Terms of Service"] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-sm mb-4" style={{ fontWeight: 600 }}>{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">© 2024 AIRecruit. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Mail className="w-4 h-4 hover:text-white cursor-pointer" />
            <Phone className="w-4 h-4 hover:text-white cursor-pointer" />
            <Globe className="w-4 h-4 hover:text-white cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
