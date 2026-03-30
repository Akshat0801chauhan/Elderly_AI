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

<<<<<<< HEAD
  // ✅ Token expired → clear it and redirect to login
=======
  // Token expired → clear it and redirect to login
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
  if (isTokenExpired(token)) {
    localStorage.clear();
    return <Navigate to="/" />;
  }

<<<<<<< HEAD
  // ✅ Valid token → allow access
=======
  // Valid token → allow access
>>>>>>> 64fd011d030ae09481b2bc38f4427c9f31706393
  return children;
}