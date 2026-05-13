import { useState, useEffect, useRef, useCallback } from "react";
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
  Phone
} from
  "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../../lib/api";




export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("candidate");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=newPassword
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirm: ""
  });

  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (location.pathname.includes("register")) setMode("register"); else
      if (location.pathname.includes("forgot")) setMode("forgot"); else
        setMode("login");
  }, [location.pathname]);

  // Chặn nút Back sau khi đăng xuất — nếu không có token thì không cho quay lại trang trước
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Thêm entry vào history để khi bấm Back sẽ trigger popstate
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        // Người dùng bấm nút Back → đẩy lại về trang login
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Callback xử lý kết quả Google Sign-In
  const handleGoogleCallback = useCallback(async (response) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential, role })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Đăng nhập Google thất bại!");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Đăng nhập Google thành công!");
      const serverRole = data.user.role?.toLowerCase();
      if (serverRole === "admin") navigate("/admin", { replace: true });
      else if (serverRole === "candidate") navigate("/candidate", { replace: true });
      else if (serverRole === "employer") navigate("/employer", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [role, navigate]);

  // Cập nhật callback toàn cục để luôn lấy được role mới nhất mà không cần khởi tạo lại Google
  useEffect(() => {
    window.handleGoogleCallbackGlobal = handleGoogleCallback;
  }, [handleGoogleCallback]);

  // Khởi tạo và render nút Google
  useEffect(() => {
    if (mode === "forgot") return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;

    if (!window.isGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (window.handleGoogleCallbackGlobal) {
            window.handleGoogleCallbackGlobal(response);
          }
        },
      });
      window.isGoogleInitialized = true;
    }

    // Render nút Google vào container
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = ''; // Xóa nút cũ trước khi render lại
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth,
        text: "signin_with",
        shape: "pill",
        locale: "vi_VN",
      });
    }
  }, [mode, role]);

  // API_URL imported at top of file

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        if (forgotStep === 1) {
          // Step 1: Gửi OTP
          const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email })
          });
          const data = await res.json();
          if (!res.ok) { toast.error(data.message); return; }
          toast.success("Mã OTP đã được gửi đến email!");
          setForgotStep(2);
        } else if (forgotStep === 2) {
          // Step 2: Xác nhận OTP
          const otp = otpValues.join('');
          if (otp.length !== 6) { toast.error("Vui lòng nhập đủ 6 số OTP."); return; }
          const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, otp })
          });
          const data = await res.json();
          if (!res.ok) { toast.error(data.message); return; }
          toast.success("Xác nhận OTP thành công!");
          setForgotStep(3);
        } else if (forgotStep === 3) {
          // Step 3: Đặt lại mật khẩu
          if (newPassword !== confirmNewPassword) { toast.error("Mật khẩu xác nhận không khớp!"); return; }
          if (newPassword.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự."); return; }
          const res = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, newPassword })
          });
          const data = await res.json();
          if (!res.ok) { toast.error(data.message); return; }
          toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
          setMode("login"); setForgotStep(1); setOtpValues(['', '', '', '', '', '']); setNewPassword(''); setConfirmNewPassword('');
        }
        return;
      }

      if (mode === "login") {
        // ── GỌI API ĐĂNG NHẬP ──
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Đăng nhập thất bại!");
          return;
        }

        // Lưu token và thông tin user vào localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success("Đăng nhập thành công!");

        // Điều hướng theo Role
        const serverRole = data.user.role?.toLowerCase();
        if (serverRole === "admin") {
          navigate("/admin", { replace: true });
        } else if (serverRole === "candidate") {
          navigate("/candidate", { replace: true });
        } else if (serverRole === "employer") {
          navigate("/employer", { replace: true });
        }

      } else if (mode === "register") {
        // ── GỌI API ĐĂNG KÝ ──
        const body = {
          email: form.email,
          password: form.password,
          role,
          fullName: role === "candidate" ? form.name : undefined,
          companyName: role === "employer" ? form.company : undefined,
          phone: form.phone || undefined,
        };

        if (form.password !== form.confirm) {
          toast.error("Mật khẩu xác nhận không khớp!");
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Đăng ký thất bại!");
          return;
        }

        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        setMode("login");
        setForm((f) => ({ ...f, password: "", confirm: "" }));
      }

    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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

            {/* OTP Step 2 - Nhập mã OTP */}
            {mode === "forgot" && forgotStep === 2 ?
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>Nhập mã OTP</h2>
                <p className="text-sm text-gray-500 mb-6">Mã xác nhận 6 số đã gửi đến<br /><strong>{form.email}</strong></p>
                <form onSubmit={handleSubmit}>
                  <div className="flex justify-center gap-2 mb-4">
                    {otpValues.map((val, i) => (
                      <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={val}
                        className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '');
                          const newOtp = [...otpValues]; newOtp[i] = v; setOtpValues(newOtp);
                          if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpValues[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">⏱ Mã OTP hết hạn sau 5 phút</p>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Xác nhận OTP"}
                  </button>
                </form>
                <button onClick={() => { setForgotStep(1); setOtpValues(['', '', '', '', '', '']); handleSubmit({ preventDefault: () => { } }); }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm mt-4 inline-block">Gửi lại mã OTP</button>
              </div> :

              /* OTP Step 3 - Đặt mật khẩu mới */
              mode === "forgot" && forgotStep === 3 ?
                <div className="py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h2 className="text-gray-900 mb-1 text-center" style={{ fontWeight: 600 }}>Đặt mật khẩu mới</h2>
                  <p className="text-sm text-gray-500 mb-6 text-center">Nhập mật khẩu mới cho tài khoản <strong>{form.email}</strong></p>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="text-sm text-gray-700 mb-1.5 block">Mật khẩu mới</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type={showNewPass ? "text" : "password"} value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                          placeholder="Tối thiểu 6 ký tự" required />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-sm text-gray-700 mb-1.5 block">Xác nhận mật khẩu</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type={showConfirmNew ? "text" : "password"} value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                          placeholder="Nhập lại mật khẩu" required />
                        <button type="button" onClick={() => setShowConfirmNew(!showConfirmNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Đặt lại mật khẩu"}
                    </button>
                  </form>
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
                          "Nhập email để nhận mã OTP đặt lại mật khẩu"}
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
                              type="button"
                              key={d.label}
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  email: d.email,
                                  password: d.admin ? "Admin@123" : "demo123456"
                                }));
                                if (!d.admin) {
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
                      {/* Nút Google chính thức (renderButton) */}
                      <div ref={googleBtnRef} className="flex justify-center" style={{ minHeight: 44 }}></div>

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
                              "Gửi mã OTP"}
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