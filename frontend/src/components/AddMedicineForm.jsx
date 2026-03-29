import { useState, useEffect } from "react";
import "./AddMedicineForm.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MEALS = ["breakfast", "lunch", "dinner"];

const DAY_PRESETS = [
  { label: "3 days",   value: 3  },
  { label: "5 days",   value: 5  },
  { label: "1 week",   value: 7  },
  { label: "2 weeks",  value: 14 },
  { label: "1 month",  value: 30 },
  { label: "3 months", value: 90 },
];

const defaultMealTimings = {
  breakfastTiming: "NONE",
  lunchTiming:     "NONE",
  dinnerTiming:    "NONE",
};

export default function AddMedicineForm({
  close,
  fetchMedicines,
  fetchProgress,
  existing,
}) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name:         "",
    dosage:       "",
    time:         null,
    numberOfDays: 1,
    startDate:    new Date(),
    notes:        "",
  });

  const [mealTimings, setMealTimings] = useState({ ...defaultMealTimings });

  // ── EDIT MODE ─────────────────────────────────────────
  useEffect(() => {
    if (existing) {
      // parse time
      let parsedTime = null;
      if (existing.time) {
        try {
          const [h, m] = existing.time.split(":");
          const d = new Date();
          d.setHours(parseInt(h));
          d.setMinutes(parseInt(m));
          d.setSeconds(0);
          parsedTime = d;
        } catch {
          parsedTime = null;
        }
      }

      // parse startDate
      let parsedStart = new Date();
      if (existing.startDate) {
        try { parsedStart = new Date(existing.startDate); } catch { /* keep today */ }
      }

      setForm({
        name:         existing.name         || "",
        dosage:       existing.dosage        || "",
        time:         parsedTime,
        numberOfDays: existing.numberOfDays  || 1,
        startDate:    parsedStart,
        notes:        existing.notes         || "",
      });

      setMealTimings({
        breakfastTiming: existing.breakfastTiming || "NONE",
        lunchTiming:     existing.lunchTiming     || "NONE",
        dinnerTiming:    existing.dinnerTiming     || "NONE",
      });
    }
  }, [existing]);

  // ── HELPERS ───────────────────────────────────────────

  const formatTime = (date) => {
    if (!date) return "";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatDate = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const mo = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${mo}-${d}`;
  };

  const getEndDate = () => {
    if (!form.startDate || !form.numberOfDays) return null;
    const end = new Date(form.startDate);
    end.setDate(end.getDate() + Number(form.numberOfDays) - 1);
    return end.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  // Toggle meal timing: clicking selected value → resets to NONE
  const toggleMealTiming = (meal, value) => {
    const key = `${meal}Timing`;
    setMealTimings((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "NONE" : value,
    }));
  };

  // ── SUBMIT ────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name || !form.dosage || !form.time) {
      alert("Please fill in name, dosage and time");
      return;
    }
    if (!form.numberOfDays || Number(form.numberOfDays) < 1) {
      alert("Please enter a valid number of days");
      return;
    }

    const payload = {
      name:         form.name.trim(),
      dosage:       form.dosage.trim(),
      time:         formatTime(form.time),
      numberOfDays: Number(form.numberOfDays),
      startDate:    formatDate(form.startDate),
      notes:        form.notes.trim() || null,
      ...mealTimings,
    };

    const url = existing
      ? `http://localhost:8080/api/medicine/${existing.id}`
      : "http://localhost:8080/api/medicine";
    const method = existing ? "PUT" : "POST";

    try {
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

  // ── RENDER ────────────────────────────────────────────

  return (
    <div className="form">
      <div className="form-card">

        <h3 className="form-title">
          {existing ? "Update Medicine" : "Add Medicine"}
        </h3>

        {/* ── Basic fields ── */}
        <input
          placeholder="Medicine Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Dosage (e.g. 500mg)"
          value={form.dosage}
          onChange={(e) => setForm({ ...form, dosage: e.target.value })}
        />

        <DatePicker
          selected={form.time}
          onChange={(date) => setForm({ ...form, time: date })}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={5}
          timeCaption="Time"
          dateFormat="h:mm aa"
          placeholderText="Select time"
        />

        {/* ── Meal timing ── */}
        <div className="section-label">Meal Timing</div>
        <div className="meal-timing-group">
          {MEALS.map((meal) => {
            const key   = `${meal}Timing`;
            const value = mealTimings[key];
            return (
              <div className="meal-row" key={meal}>
                <span className="meal-name">
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </span>
                <div className="timing-btns">
                  <button
                    type="button"
                    className={`timing-btn ${value === "BEFORE" ? "active" : ""}`}
                    onClick={() => toggleMealTiming(meal, "BEFORE")}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    className={`timing-btn ${value === "AFTER" ? "active" : ""}`}
                    onClick={() => toggleMealTiming(meal, "AFTER")}
                  >
                    After
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Duration ── */}
        <div className="section-label">Duration</div>

        <div className="days-row">
          <input
            type="number"
            className="days-input"
            placeholder="Days"
            min="1"
            max="365"
            value={form.numberOfDays}
            onChange={(e) =>
              setForm({ ...form, numberOfDays: e.target.value })
            }
          />
          <DatePicker
            selected={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
            dateFormat="dd MMM yyyy"
            placeholderText="Start date"
            className="start-date-picker"
          />
        </div>

        {/* Preset chips */}
        <div className="preset-chips">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`chip ${Number(form.numberOfDays) === p.value ? "chip-active" : ""}`}
              onClick={() => setForm({ ...form, numberOfDays: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>

        {getEndDate() && (
          <p className="end-date-note">Ends on {getEndDate()}</p>
        )}

        {/* ── Notes ── */}
        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        {/* ── Actions ── */}
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