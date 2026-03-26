import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // const data = await res.json();

      if (res.ok) {
        setMsg("Login successful");
        setErr("");
      } else {
        setErr("Invalid credentials");
        setMsg("");
      }
    } catch {
      setErr("Server error");
      setMsg("");
    }
  };

  return (
    <>
      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button onClick={handleSubmit}>Login</button>

      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
    </>
  );
}