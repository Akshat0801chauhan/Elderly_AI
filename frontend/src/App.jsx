import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import { Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    }
  }, []);

  return (
    <Routes>
      {}
      <Route
        path="/"
        element={
          <div className="container">
            <div className="card">
              <h2 className="title">
                {isLogin ? "Login" : "Sign Up"}
              </h2>

              {isLogin ? <Login /> : <Register />}

              <p className="switch" onClick={() => setIsLogin(!isLogin)}>
                {isLogin
                  ? "New user? Sign Up"
                  : "Already have account? Login"}
              </p>
            </div>
          </div>
        }
      />

      {/* DASHBOARD */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;