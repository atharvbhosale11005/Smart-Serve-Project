import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

/**
 * PublicRoute
 * - Blocks already-logged-in users from seeing Login/Register pages.
 * - Same bfcache revalidation as ProtectedRoute so Back/Forward can't
 *   show a stale public page to an authenticated user (or vice versa).
 */
function PublicRoute({ children }) {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const revalidate = (event) => {
      if (!event || event.persisted) {
        forceRerender((n) => n + 1);
      }
    };
    window.addEventListener("pageshow", revalidate);
    return () => window.removeEventListener("pageshow", revalidate);
  }, []);

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (token) {
    switch (role) {
      case "USER":
        return <Navigate to="/user/dashboard" replace />;
      case "WORKER":
        return <Navigate to="/worker/dashboard" replace />;
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        sessionStorage.clear();
        break;
    }
  }

  return children;
}

export default PublicRoute;