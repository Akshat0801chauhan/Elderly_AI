import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSelectedElderlyUser } from "../utils/caregiverContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        clearSelectedElderlyUser();
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setErrors({ api: data.message || "Invalid credentials" });
      }
    } catch {
      setErrors({ api: "Server error" });
    }
  };

  const isValid = form.email && form.password;

  return (
    <>
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      {errors.email && <p className="error">{errors.email}</p>}

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {errors.password && <p className="error">{errors.password}</p>}

      <button onClick={handleSubmit} disabled={!isValid}>
        Login
      </button>

      {errors.api && <p className="error">{errors.api}</p>}
    </>
  );
}
