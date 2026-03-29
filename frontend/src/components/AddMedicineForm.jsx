import { useState, useEffect } from "react";
import "./AddMedicineForm.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddMedicineForm({
  close,
  fetchMedicines,
  fetchProgress,
  existing,
}) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    time: null,
  });

  // ✅ EDIT MODE (backend sends "HH:mm")
  useEffect(() => {
    if (existing && existing.time) {
      try {
        const [hours, minutes] = existing.time.split(":");

        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        date.setSeconds(0);

        setForm({
          name: existing.name,
          dosage: existing.dosage,
          time: date,
        });
      } catch {
        setForm({
          name: existing.name || "",
          dosage: existing.dosage || "",
          time: null,
        });
      }
    }
  }, [existing]);

  // ✅ FORMAT TIME → "HH:mm" (backend requirement)
  const formatTime = (date) => {
    if (!date) return "";

    let hours = date.getHours();
    let minutes = date.getMinutes();

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    try {
      // ✅ VALIDATION
      if (!form.name || !form.dosage || !form.time) {
        alert("Please fill all fields");
        return;
      }

      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        time: formatTime(form.time), // 🔥 FIXED
      };

      console.log("Payload:", payload);

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
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Server Error:", errText);
        alert(errText);
        return;
      }

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
      <div className="form-card">

        <h3 className="form-title">
          {existing ? "Update Medicine" : "Add Medicine"}
        </h3>

        <input
          placeholder="Medicine Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Dosage"
          value={form.dosage}
          onChange={(e) =>
            setForm({ ...form, dosage: e.target.value })
          }
        />

        {/* ✅ TIME PICKER */}
        <DatePicker
          selected={form.time}
          onChange={(date) =>
            setForm({ ...form, time: date })
          }
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={5}
          timeCaption="Time"
          dateFormat="h:mm aa"   // UI shows AM/PM
          placeholderText="Select time"
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