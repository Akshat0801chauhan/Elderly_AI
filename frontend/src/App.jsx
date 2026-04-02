import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Medicines from "./components/Medicines";
import Assistant from "./components/Assistant";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate, location.pathname]);

  return (
    <Routes>
      {/* LOGIN / REGISTER */}
      <Route
        path="/"
        element={
          <div className="container">
            <div className="card">
              <h2 className="title">{isLogin ? "Login" : "Sign Up"}</h2>
              {isLogin ? <Login /> : <Register />}
              <p className="switch" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "New user? Sign Up" : "Already have account? Login"}
              </p>
            </div>
          </div>
        }
      />

      {/* PROTECTED ROUTES */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/assistant"   element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;