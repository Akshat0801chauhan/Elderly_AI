import React, { useState } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

import { Routes, Route } from "react-router-dom";

function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Routes>
      {/* MAIN UI (unchanged) */}
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

      {/* DASHBOARD ROUTE */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;