import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Brain,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Phone } from
"lucide-react";
import { toast } from "sonner";




export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("candidate");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirm: ""
  });

  useEffect(() => {
    if (location.pathname.includes("register")) setMode("register");else
    if (location.pathname.includes("forgot")) setMode("forgot");else
    setMode("login");
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    if (mode === "forgot") {
      setEmailSent(true);
      return;
    }
    if (mode === "login") {
      toast.success("Đăng nhập thành công!");
      if (role === "candidate") navigate("/candidate");else
      if (role === "employer") navigate("/employer");
    } else {
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email xác thực.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col flex-1 p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500 blur-3xl"></div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors z-10">
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>
            AI<span className="text-indigo-400">Recruit</span>
          </span>
        </button>
        <div className="z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-sm text-indigo-200">
              Powered by Advanced AI
            </span>
          </div>
          <h2 className="text-3xl text-white mb-4" style={{ fontWeight: 700 }}>
            Tuyển dụng thông minh <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              bắt đầu từ đây
            </span>
          </h2>
          <p className="text-slate-400 mb-8">
            AI phân tích hàng nghìn CV, tự động matching và xếp hạng ứng viên
            chỉ trong vài giây.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
            {
              label: "Ứng viên",
              value: "9,823+",
              color: "bg-indigo-500/20 border-indigo-400/30 text-indigo-300"
            },
            {
              label: "Doanh nghiệp",
              value: "1,456+",
              color: "bg-violet-500/20 border-violet-400/30 text-violet-300"
            },
            {
              label: "Độ chính xác AI",
              value: "87.3%",
              color: "bg-cyan-500/20 border-cyan-400/30 text-cyan-300"
            },
            {
              label: "Tuyển thành công",
              value: "4,521+",
              color:
              "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
            }].
            map((s) =>
            <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
                <div className="text-xl" style={{ fontWeight: 700 }}>
                  {s.value}
                </div>
                <div className="text-xs opacity-80">{s.label}</div>
              </div>
            )}
          </div>
        </div>
        <div className="text-slate-500 text-sm z-10">
          © 2024 AIRecruit. All rights reserved.
        </div>
      </div>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-xl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 18 }}>
                AI<span className="text-indigo-600">Recruit</span>
              </span>
            </div>

            {/* Email sent state */}
            {emailSent ?
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-gray-900 mb-2">Email đã được gửi!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Vui lòng kiểm tra hộp thư <strong>{form.email}</strong> để đặt
                  lại mật khẩu.
                </p>
                <button
                onClick={() => {
                  setEmailSent(false);
                  setMode("login");
                }}
                className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-2 mx-auto">
                
                  <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                </button>
              </div> :

            <>
                {/* Header */}
                <div className="mb-6">
                  {mode !== "login" &&
                <button
                  onClick={() => setMode("login")}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors">
                  
                      <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                }
                  <h2 className="text-gray-900 mb-1">
                    {mode === "login" ?
                  "Chào mừng trở lại 👋" :
                  mode === "register" ?
                  "Tạo tài khoản mới" :
                  "Đặt lại mật khẩu"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {mode === "login" ?
                  "Đăng nhập để tiếp tục" :
                  mode === "register" ?
                  "Điền thông tin để bắt đầu" :
                  "Nhập email để nhận link đặt lại mật khẩu"}
                  </p>
                </div>

                {/* Role Toggle (login & register) */}
                {mode !== "forgot" &&
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    {[
                {
                  value: "candidate",
                  label: "Ứng viên",
                  icon: User
                },
                {
                  value: "employer",
                  label: "Nhà tuyển dụng",
                  icon: Building2
                }].
                map((r) =>
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${role === r.value ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
                  
                        <r.icon className="w-4 h-4" />
                        {r.label}
                      </button>
                )}
                  </div>
              }

                {/* Admin quick demo */}
                {mode === "login" &&
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p
                  className="text-xs text-amber-700 mb-2"
                  style={{ fontWeight: 500 }}>
                  
                      🔑 Demo nhanh — nhấn để tự điền:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                  {
                    label: "Ứng viên",
                    email: "candidate@demo.vn",
                    role: "candidate"
                  },
                  {
                    label: "NTD",
                    email: "employer@demo.vn",
                    role: "employer"
                  },
                  {
                    label: "Admin",
                    email: "admin@demo.vn",
                    role: "candidate",
                    admin: true
                  }].
                  map((d) =>
                  <button
                    key={d.label}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        email: d.email,
                        password: "demo123456"
                      }));
                      if (d.admin) {
                        setLoading(true);
                        setTimeout(() => {
                          setLoading(false);
                          navigate("/admin");
                        }, 600);
                      } else {
                        setRole(d.role);
                      }
                    }}
                    className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 px-3 py-1 rounded-lg transition-colors">
                    
                          {d.label}
                        </button>
                  )}
                    </div>
                  </div>
              }
                {/* Google Sign In Button & Divider */}
                {mode !== "forgot" &&
              <div className="mb-6">
                    {/* Nút Google */}
                    <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    // Xử lý logic đăng nhập Google ở đây
                    console.log("Đăng nhập bằng Google cho vai trò:", role);
                  }}>
                  
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4" />
                    
                        <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853" />
                    
                        <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05" />
                    
                        <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335" />
                    
                      </svg>
                      Sign in with Google
                    </button>

                    {/* Đường kẻ phân cách */}
                    <div className="relative mt-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span
                      className="bg-white px-4 text-gray-400 uppercase tracking-wider"
                      style={{ fontSize: "11px" }}>
                      
                          Hoặc dùng email
                        </span>
                      </div>
                    </div>
                  </div>
              }

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Register fields */}
                  {mode === "register" &&
                <>
                      {role === "employer" ?
                  <div>
                          <label className="text-sm text-gray-700 mb-1.5 block">
                            Tên công ty
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                        value={form.company}
                        onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          company: e.target.value
                        }))
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        placeholder="TechVision Vietnam"
                        required />
                      
                          </div>
                        </div> :

                  <div>
                          <label className="text-sm text-gray-700 mb-1.5 block">
                            Họ và tên
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                        value={form.name}
                        onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        placeholder="Nguyễn Văn A"
                        required />
                      
                          </div>
                        </div>
                  }
                      <div>
                        <label className="text-sm text-gray-700 mb-1.5 block">
                          Số điện thoại
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                        value={form.phone}
                        onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        placeholder="0901234567" />
                      
                        </div>
                      </div>
                    </>
                }

                  <div>
                    <label className="text-sm text-gray-700 mb-1.5 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      placeholder="example@email.com"
                      required />
                    
                    </div>
                  </div>

                  {mode !== "forgot" &&
                <div>
                      <label className="text-sm text-gray-700 mb-1.5 block">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      placeholder="Tối thiểu 8 ký tự"
                      required />
                    
                        <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      
                          {showPass ?
                      <EyeOff className="w-4 h-4" /> :

                      <Eye className="w-4 h-4" />
                      }
                        </button>
                      </div>
                    </div>
                }

                  {mode === "register" &&
                <div>
                      <label className="text-sm text-gray-700 mb-1.5 block">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      onChange={(e) =>
                      setForm((f) => ({ ...f, confirm: e.target.value }))
                      }
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                      placeholder="Nhập lại mật khẩu"
                      required />
                    
                        <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      
                          {showConfirm ?
                      <EyeOff className="w-4 h-4" /> :

                      <Eye className="w-4 h-4" />
                      }
                        </button>
                      </div>
                    </div>
                }

                  {mode === "login" &&
                <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    
                        Ghi nhớ đăng nhập
                      </label>
                      <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-indigo-600 hover:text-indigo-700">
                    
                        Quên mật khẩu?
                      </button>
                    </div>
                }

                  <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  
                    {loading ?
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> :

                  <>
                        {mode === "login" ?
                    "Đăng nhập" :
                    mode === "register" ?
                    "Tạo tài khoản" :
                    "Gửi email đặt lại"}
                      </>
                  }
                  </button>
                </form>

                <div className="mt-5 text-center text-sm text-gray-500">
                  {mode === "login" ?
                <>
                      Chưa có tài khoản?{" "}
                      <button
                    onClick={() => setMode("register")}
                    className="text-indigo-600 hover:text-indigo-700">
                    
                        Đăng ký ngay
                      </button>
                    </> :
                mode === "register" ?
                <>
                      Đã có tài khoản?{" "}
                      <button
                    onClick={() => setMode("login")}
                    className="text-indigo-600 hover:text-indigo-700">
                    
                        Đăng nhập
                      </button>
                    </> :
                null}
                </div>
              </>
            }
          </div>
        </div>
      </div>
    </div>);

}