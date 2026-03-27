import { useState } from "react";
import "./AddMedicineForm.css";
export default function AddMedicineForm({
  close,
  fetchMedicines,
  fetchProgress,
  existing,
}) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: existing?.name || "",
    dosage: existing?.dosage || "",
    time: existing?.time || "",
  });

  const handleSubmit = async () => {
    try {
      const url = existing
        ? `http://localhost:8080/api/medicine/${existing.id}`
        : "http://localhost:8080/api/medicine";

      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      fetchMedicines();
      fetchProgress();
      close();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="form">
      <div className="form-card"> {/* 🔥 IMPORTANT WRAPPER */}

        <h3 className="form-title">
          {existing ? "Update Medicine" : "Add Medicine"}
        </h3>

        <input
          placeholder="Medicine Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Dosage"
          value={form.dosage}
          onChange={(e) => setForm({ ...form, dosage: e.target.value })}
        />

        <input
          placeholder="Time (HH:mm)"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />

        <button onClick={handleSubmit}>
          {existing ? "Update" : "Add"}
        </button>

        <button className="cancel-btn" onClick={close}>
          Cancel
        </button>

      </div>
    </div>
  );
}