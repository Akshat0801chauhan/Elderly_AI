import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
<<<<<<< HEAD
import Medicines from "./components/Medicines";
import Personal_Ai from "./components/Personal_Ai";
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

=======
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route, useNavigate , useLocation} from "react-router-dom";
import Assistant from "./components/Assistant";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("token");

     if (token && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate, location.pathname]);
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
  return (
    <Routes>
      {/* LOGIN / REGISTER */}
      <Route
        path="/"
        element={
          <div className="container">
            <div className="card">
<<<<<<< HEAD
              <h2 className="title">{isLogin ? "Login" : "Sign Up"}</h2>
              {isLogin ? <Login /> : <Register />}
              <p className="switch" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "New user? Sign Up" : "Already have account? Login"}
=======
              <h2 className="title">
                {isLogin ? "Login" : "Sign Up"}
              </h2>

              {isLogin ? <Login /> : <Register />}

              <p className="switch" onClick={() => setIsLogin(!isLogin)}>
                {isLogin
                  ? "New user? Sign Up"
                  : "Already have account? Login"}
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
              </p>
            </div>
          </div>
        }
      />

      {/* PROTECTED ROUTES */}
<<<<<<< HEAD
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/assistant"   element={<ProtectedRoute><Personal_Ai /></ProtectedRoute>} />
=======
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <Assistant />
          </ProtectedRoute>
        }
      />
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
    </Routes>
  );
}

export default App;