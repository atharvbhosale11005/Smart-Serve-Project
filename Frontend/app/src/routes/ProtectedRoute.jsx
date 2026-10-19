import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
 
/**
 * ProtectedRoute
 * - Reads auth directly from sessionStorage on every render (no stale React state).
 * - Re-validates on 'pageshow' so that browser Back/Forward restoring a page
 *   from bfcache (back-forward cache) can never show a stale logged-in/out UI.
 */
function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const [, forceRerender] = useState(0);
 
  useEffect(() => {
    const revalidate = (event) => {
      // event.persisted === true means the page was restored from bfcache
      // instead of being freshly executed. Force a re-check of auth state.
      if (!event || event.persisted) {
        forceRerender((n) => n + 1);
      }
    };
 
    window.addEventListener("pageshow", revalidate);
    // Also re-check whenever the tab regains focus/visibility
    document.addEventListener("visibilitychange", revalidate);
 
    return () => {
      window.removeEventListener("pageshow", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, []);
 
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
 
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
 
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
 
  return children;
}
 
export default ProtectedRoute;