import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "ELDERLY",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    // Name
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    // Phone (10 digits)
    if (!form.phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    // Address
    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("Registered successfully");
        navigate("/");
      } else {
        setErrors({ api: "Registration failed" });
      }
    } catch {
      setErrors({ api: "Server error" });
    }
  };

  const isValid =
    form.name &&
    form.email &&
    form.password &&
    form.phone &&
    form.address;

  return (
    <>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      {errors.name && <p className="error">{errors.name}</p>}

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

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      {errors.phone && <p className="error">{errors.phone}</p>}

      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      {errors.address && <p className="error">{errors.address}</p>}

      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="ELDERLY">Elderly</option>
        <option value="CAREGIVER">Caregiver</option>
      </select>

      <button onClick={handleSubmit} disabled={!isValid}>
        Register
      </button>

      {errors.api && <p className="error">{errors.api}</p>}
    </>
  );
}