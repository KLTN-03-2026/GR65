import { Navigate } from "react-router";

/**
 * ProtectedRoute — Kiểm tra đăng nhập + quyền truy cập
 * 
 * @param {React.ReactNode} children - Component con cần bảo vệ
 * @param {string|string[]} allowedRoles - Role được phép truy cập (vd: "Candidate", "Employer", "Admin")
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem("token");

  // Chưa đăng nhập → redirect về /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Giải mã token để lấy role (JWT payload = base64)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = payload?.user?.role;

    // Kiểm tra role nếu allowedRoles được chỉ định
    if (allowedRoles) {
      const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => r.toLowerCase());
      const currentRole = userRole?.toLowerCase();
      
      if (!roles.includes(currentRole)) {
        // Có token nhưng sai role → redirect về trang đúng role
        const roleRedirects = {
          candidate: "/candidate",
          employer: "/employer",
          admin: "/admin",
        };
        return <Navigate to={roleRedirects[currentRole] || "/login"} replace />;
      }
    }

    // Kiểm tra token hết hạn
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    // Token không hợp lệ → xóa và redirect
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
}
