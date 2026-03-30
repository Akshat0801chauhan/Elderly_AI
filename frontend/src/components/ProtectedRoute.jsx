import { Navigate } from "react-router-dom";


function isTokenExpired(token) {
  try {
    
    const payload = JSON.parse(atob(token.split(".")[1]));

  
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    
    return true;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  
  if (!token) {
    return <Navigate to="/" />;
  }

  // Token expired → clear it and redirect to login
  if (isTokenExpired(token)) {
    localStorage.clear();
    return <Navigate to="/" />;
  }

  // Valid token → allow access
  return children;
}