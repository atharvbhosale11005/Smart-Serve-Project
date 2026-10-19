import { createContext, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

// Common Pages
import Home from "./commonPages/Home";
import Login from "./commonPages/Login";
import UserRegister from "./commonPages/UserRegister";
import WorkerRegister from "./commonPages/WorkerRegister";

// User Pages
import UserDashboard from "./userPages/UserDashboard";
import UserProfile from "./userPages/UserProfile";
import AvailableServices from "./userPages/AvailableService";
import Payment from "./userPages/Payment";
import UserRequests from "./userPages/UserRequests";
import UserHistory from "./userPages/UserHistory";
import Feedback from "./feedbackPage/Feedback";
// import UserRequestStatus from "./userPages/UserRequestStatus";
// import UserFeedback from "./userPages/UserFeedback";

// Worker Pages
import WorkerDashboard from "./workerPages/WorkerDashboard";
import WorkerProfile from "./workerPages/WorkerProfile";
// import WorkerServices from "./workerPages/WorkerServices";
import WorkerRequests from "./workerPages/WorkerRequests";

//tracking
import UserTracking from "./userPages/UserTracking";
import WorkerTracking from "./workerPages/WorkerTracking";


// Admin Pages
import AdminDashboard from "./adminPages/AdminDashboard";
// import ManageUsers from "./adminPages/ManageUsers";
// import ManageWorkers from "./adminPages/ManageWorkers";
// import ManageServices from "./adminPages/ManageServices";

import "./App.css";

export const LoginContext = createContext();



function HomeRedirect() {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (!token) {
    return <Home />;
  }

  switch (role) {
    case "USER":
      return <Navigate to="/user/dashboard" replace />;

    case "WORKER":
      return <Navigate to="/worker/dashboard" replace />;

    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;

    default:
      sessionStorage.clear();
      return <Home />;
  }
}



function App() {
  const [loginStatus, setLoginStatus] = useState(
    !!sessionStorage.getItem("token")
  );

  const [role, setRole] = useState(
    sessionStorage.getItem("role") || ""
  );

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      setLoginStatus(!!sessionStorage.getItem("token"));
      setRole(sessionStorage.getItem("role") || "");
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const logout = () => {
    sessionStorage.clear();

    setLoginStatus(false);
    setRole("");

    window.dispatchEvent(new Event("auth-changed"));
  };

  return (
    <LoginContext.Provider
      value={{
        loginStatus,
        setLoginStatus,
        role,
        setRole,
        logout,
      }}
    >
      <Routes>

        {/* ---------- Public ---------- */}

        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register/user"
          element={
            <PublicRoute>
              <UserRegister />
            </PublicRoute>
          }
        />

        <Route
          path="/register/worker"
          element={
            <PublicRoute>
              <WorkerRegister />
            </PublicRoute>
          }
        />

        {/* ---------- USER ---------- */}

        <Route path="/user/dashboard"
          element={
            <ProtectedRoute allowedRole="USER">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/user/profile" 
          element={ 
             <ProtectedRoute allowedRole="USER">
                <UserProfile />
             </ProtectedRoute>
          }
        />

        <Route
          path="/user/services"
          element={
            <ProtectedRoute allowedRole="USER">
              <AvailableServices />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/user/payment" 
          element={
            <ProtectedRoute allowedRole="USER">
             <Payment />
            </ProtectedRoute>
          }
        />
        <Route
    path="/user/requests"
    element={
        <ProtectedRoute allowedRole="USER">
            <UserRequests />
        </ProtectedRoute>
    }
/>

<Route
    path="/user/tracking/:requestId"
    element={
        <ProtectedRoute allowedRole="USER">
            <UserTracking />
        </ProtectedRoute>
    }
/>

<Route
    path="/user/feedback/:requestId"
    element={<Feedback />}
/>

<Route
    path="/user/history"
    element={<UserHistory />}
/>

        

        {/* ---------- WORKER ---------- */}

        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute allowedRole="WORKER">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />

         <Route
          path="/worker/profile"
          element={
            <ProtectedRoute allowedRole="WORKER">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />

        <Route
    path="/worker/requests"
    element={
        <ProtectedRoute allowedRole="WORKER">
            <WorkerRequests />
        </ProtectedRoute>
    }
/>

<Route
    path="/worker/tracking/:requestId"
    element={
        <ProtectedRoute allowedRole="WORKER">
            <WorkerTracking />
        </ProtectedRoute>
    }
/>



        {/* ---------- ADMIN ---------- */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/*

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/workers"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <ManageWorkers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <ManageServices />
            </ProtectedRoute>
          }
        />

        */}

        {/* ---------- Default ---------- */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </LoginContext.Provider>
  );
}

export default App;