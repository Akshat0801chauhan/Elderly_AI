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
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    time: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existing) return;

    if (existing.time) {
      try {
        const [hours, minutes] = existing.time.split(":");

        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        date.setSeconds(0);

        setForm({
          name: existing.name || "",
          dosage: existing.dosage || "",
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

  const formatTime = (date) => {
    if (!date) return "";
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    // Read token fresh inside handleSubmit, not at mount
    const token = localStorage.getItem("token");

    try {
      if (!form.name || !form.dosage || !form.time) {
        setError("Please fill all fields");
        return;
      }

      if (!token) {
        setError("Session expired. Please login again.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      setLoading(true);

      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        time: formatTime(form.time),
      };

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

      // Handle auth errors first before anything else
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      //Read body ONCE and reuse — no double .json() call
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Server error");
        return;
      }

      fetchMedicines();
      fetchProgress();

      setMessage(
        data?.message ||
          (existing
            ? "Medicine updated successfully"
            : "Medicine added successfully")
      );

      setForm({
        name: "",
        dosage: "",
        time: null,
      });

      setTimeout(() => {
        close();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      <div className="form-card">
        <h3 className="form-title">
          {existing ? "Update Medicine" : "Add Medicine"}
        </h3>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

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

        <DatePicker
          selected={form.time}
          onChange={(date) => setForm({ ...form, time: date })}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={5}
          timeCaption="Select Time"
          dateFormat="hh:mm aa"
          placeholderText="Select time"
          className="time-input"
          isClearable
          withPortal
          shouldCloseOnSelect
        />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : existing ? "Update" : "Add"}
        </button>

        <button className="cancel-btn" onClick={close}>
          Cancel
        </button>
      </div>
    </div>
  );
}