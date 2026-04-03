import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

const initialHealthFields = {
  dateOfBirth: "",
  gender: "",
  bloodType: "",
  allergies: "",
  chronicDiseases: "",
  pastIllnesses: "",
};

export default function Register() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "ELDERLY",
    ...initialHealthFields,
  });

  const [errors, setErrors] = useState({});
  const isElderly = form.role === "ELDERLY";

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", api: "" }));
  };

  const setRole = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      ...(role === "CAREGIVER" ? initialHealthFields : {}),
    }));
    setErrors((prev) => ({
      ...prev,
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      allergies: "",
      chronicDiseases: "",
      pastIllnesses: "",
      api: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

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

    if (!form.phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (isElderly) {
      if (!form.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required for elderly users";
      } else if (form.dateOfBirth > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
      if (!form.gender) {
        newErrors.gender = "Gender is required for elderly users";
      }
      if (!form.bloodType.trim()) {
        newErrors.bloodType = "Blood type is required for elderly users";
      }
      if (!form.allergies.trim()) {
        newErrors.allergies = "Allergies field is required for elderly users";
      }
      if (!form.chronicDiseases.trim()) {
        newErrors.chronicDiseases = "Chronic diseases field is required for elderly users";
      }
      if (!form.pastIllnesses.trim()) {
        newErrors.pastIllnesses = "Past illnesses field is required for elderly users";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = isElderly
        ? form
        : { ...form, ...initialHealthFields };

      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Registered successfully");
        navigate("/");
      } else {
        const data = await res.json().catch(() => null);
        setErrors({
          ...(data?.errors || {}),
          api: data?.message || "Registration failed",
        });
      }
    } catch {
      setErrors({ api: "Server error" });
    }
  };

  const isValid = isElderly
    ? form.name &&
      form.email &&
      form.password &&
      form.phone &&
      form.address &&
      form.dateOfBirth &&
      form.gender &&
      form.bloodType &&
      form.allergies &&
      form.chronicDiseases &&
      form.pastIllnesses
    : form.name && form.email && form.password && form.phone && form.address;

  return (
    <div className="register-form">
      <p className="register-role-note">
        {isElderly
          ? "Registering as Elderly includes personal health information."
          : "Registering as Caregiver only asks for basic account details."}
      </p>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
      />
      {errors.name && <p className="error">{errors.name}</p>}

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
      />
      {errors.email && <p className="error">{errors.email}</p>}

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => updateField("password", e.target.value)}
      />
      {errors.password && <p className="error">{errors.password}</p>}

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
      />
      {errors.phone && <p className="error">{errors.phone}</p>}

      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => updateField("address", e.target.value)}
      />
      {errors.address && <p className="error">{errors.address}</p>}

      {isElderly && (
        <div className="register-health-section">
          <p className="register-health-title">Health Details</p>
          <div className="register-health-fields">
            <div className="register-select-wrap">
              <label className="register-label" htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                className="register-date-input"
                type="date"
                max={today}
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
              />
            </div>
            {errors.dateOfBirth && <p className="error">{errors.dateOfBirth}</p>}

            <div className="register-select-wrap">
              <label className="register-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {errors.gender && <p className="error">{errors.gender}</p>}

            <div className="register-select-wrap">
              <label className="register-label" htmlFor="bloodType">Blood Group</label>
              <select
                id="bloodType"
                value={form.bloodType}
                onChange={(e) => updateField("bloodType", e.target.value)}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            {errors.bloodType && <p className="error">{errors.bloodType}</p>}

            <div className="register-input-wrap">
              <input
                placeholder="Allergies"
                value={form.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
              />
            </div>
            {errors.allergies && <p className="error">{errors.allergies}</p>}

            <div className="register-input-wrap">
              <input
                placeholder="Chronic Diseases"
                value={form.chronicDiseases}
                onChange={(e) => updateField("chronicDiseases", e.target.value)}
              />
            </div>
            {errors.chronicDiseases && <p className="error">{errors.chronicDiseases}</p>}

            <div className="register-input-wrap">
              <input
                placeholder="Past Illnesses"
                value={form.pastIllnesses}
                onChange={(e) => updateField("pastIllnesses", e.target.value)}
              />
            </div>
            {errors.pastIllnesses && <p className="error">{errors.pastIllnesses}</p>}
          </div>
        </div>
      )}

      <div className="register-role-picker">
        <span className="register-role-picker-label">Register As</span>
        <div className="register-role-options" aria-label="Select registration role">
          <label className="register-radio-option">
            <input
              type="radio"
              name="role"
              value="ELDERLY"
              checked={form.role === "ELDERLY"}
              onChange={() => setRole("ELDERLY")}
            />
            <span>Elderly</span>
          </label>
          <label className="register-radio-option">
            <input
              type="radio"
              name="role"
              value="CAREGIVER"
              checked={form.role === "CAREGIVER"}
              onChange={() => setRole("CAREGIVER")}
            />
            <span>Caregiver</span>
          </label>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!isValid}>
        Register as {isElderly ? "Elderly" : "Caregiver"}
      </button>

      {errors.api && <p className="error">{errors.api}</p>}
    </div>
  );
}
