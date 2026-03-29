import { useState, useEffect, useRef } from "react";
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

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// ── CUSTOM TIME PICKER ────────────────────────────────────────────────────────

function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("08");
  const [min,  setMin]  = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const ref = useRef(null);

  // parse incoming "HH:mm" 24h string
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      const isPM   = h >= 12;
      const h12    = h % 12 === 0 ? 12 : h % 12;
      setHour(String(h12).padStart(2, "0"));
      setMin(String(m).padStart(2, "0"));
      setAmpm(isPM ? "PM" : "AM");
    }
  }, [value]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const emit = (h, m, ap) => {
    let h24 = parseInt(h);
    if (ap === "AM" && h24 === 12) h24 = 0;
    if (ap === "PM" && h24 !== 12) h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${m}`);
  };

  const pickHour = (h)  => { setHour(h);  emit(h, min, ampm); };
  const pickMin  = (m)  => { setMin(m);   emit(hour, m, ampm); };
  const pickAmpm = (ap) => { setAmpm(ap); emit(hour, min, ap); };

  const displayLabel = value ? `${hour}:${min} ${ampm}` : "Select time";

  return (
    <div className="tp-root" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        className={`tp-trigger ${value ? "tp-trigger--set" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tp-icon">⏰</span>
        <span className="tp-label">{displayLabel}</span>
        <span className="tp-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="tp-panel">
          <p className="tp-panel-title">Pick a time</p>

          <div className="tp-cols">

            {/* Hour column */}
            <div className="tp-col">
              <div className="tp-col-head">HR</div>
              <div className="tp-scroll">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className={`tp-cell ${hour === h ? "tp-cell--on" : ""}`}
                    onClick={() => pickHour(h)}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            <div className="tp-colon">:</div>

            {/* Minute column */}
            <div className="tp-col">
              <div className="tp-col-head">MIN</div>
              <div className="tp-scroll">
                {MINUTES.map((m) => (
                  <div
                    key={m}
                    className={`tp-cell ${min === m ? "tp-cell--on" : ""}`}
                    onClick={() => pickMin(m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* AM / PM column */}
            <div className="tp-col tp-col--period">
              <div className="tp-col-head">AM/PM</div>
              <div className="tp-period">
                <div
                  className={`tp-period-btn ${ampm === "AM" ? "tp-period-btn--on" : ""}`}
                  onClick={() => pickAmpm("AM")}
                >
                  AM
                </div>
                <div
                  className={`tp-period-btn ${ampm === "PM" ? "tp-period-btn--on" : ""}`}
                  onClick={() => pickAmpm("PM")}
                >
                  PM
                </div>
              </div>
            </div>

          </div>

          <button type="button" className="tp-done-btn" onClick={() => setOpen(false)}>
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

// ── MAIN FORM ─────────────────────────────────────────────────────────────────

export default function AddMedicineForm({ close, fetchMedicines, fetchProgress, existing }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "", dosage: "", time: "", numberOfDays: 1, startDate: new Date(), notes: "",
  });

  const [mealTimings, setMealTimings] = useState({ ...defaultMealTimings });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      let parsedStart = new Date();
      if (existing.startDate) {
        try { parsedStart = new Date(existing.startDate); } catch { /* keep today */ }
      }
      setForm({
        name:         existing.name        || "",
        dosage:       existing.dosage       || "",
        time:         existing.time         || "",
        numberOfDays: existing.numberOfDays || 1,
        startDate:    parsedStart,
        notes:        existing.notes        || "",
      });
      setMealTimings({
        breakfastTiming: existing.breakfastTiming || "NONE",
        lunchTiming:     existing.lunchTiming     || "NONE",
        dinnerTiming:    existing.dinnerTiming     || "NONE",
      });
    }
  }, [existing]);

  const formatDate = (date) => {
    if (!date) return null;
    const y  = date.getFullYear();
    const mo = (date.getMonth() + 1).toString().padStart(2, "0");
    const d  = date.getDate().toString().padStart(2, "0");
    return `${y}-${mo}-${d}`;
  };

  const getEndDate = () => {
    if (!form.startDate || !form.numberOfDays) return null;
    const end = new Date(form.startDate);
    end.setDate(end.getDate() + Number(form.numberOfDays) - 1);
    return end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const toggleMealTiming = (meal, value) => {
    const key = `${meal}Timing`;
    setMealTimings((prev) => ({ ...prev, [key]: prev[key] === value ? "NONE" : value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.dosage || !form.time) {
      setError("Please fill in name, dosage and time");
      return;
    }
    if (!form.numberOfDays || Number(form.numberOfDays) < 1) {
      setError("Please enter a valid number of days");
      return;
    }
    setError("");
    setLoading(true);

    const payload = {
      name:         form.name.trim(),
      dosage:       form.dosage.trim(),
      time:         form.time,
      numberOfDays: Number(form.numberOfDays),
      startDate:    formatDate(form.startDate),
      notes:        form.notes.trim() || null,
      ...mealTimings,
    };

    const url    = existing ? `http://localhost:8080/api/medicine/${existing.id}` : "http://localhost:8080/api/medicine";
    const method = existing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Failed to save medicine");
        setLoading(false);
        return;
      }
      await fetchMedicines();
      await fetchProgress();
      close();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      <div className="form-card">
        <h3 className="form-title">{existing ? "Update Medicine" : "Add Medicine"}</h3>
        {error && <div className="form-error">{error}</div>}

        <input placeholder="Medicine Name" value={form.name} onChange={(e) => { setError(""); setForm({ ...form, name: e.target.value }); }} />
        <input placeholder="Dosage (e.g. 500mg)" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />

        {/* ── Custom Time Picker ── */}
        <TimePicker value={form.time} onChange={(t) => setForm({ ...form, time: t })} />

        {/* ── Meal Timing ── */}
        <div className="section-label">Meal Timing</div>
        <div className="meal-timing-group">
          {MEALS.map((meal) => {
            const key = `${meal}Timing`;
            const val = mealTimings[key];
            return (
              <div className="meal-row" key={meal}>
                <span className="meal-name">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                <div className="timing-btns">
                  <button type="button" className={`timing-btn ${val === "BEFORE" ? "active" : ""}`} onClick={() => toggleMealTiming(meal, "BEFORE")}>Before</button>
                  <button type="button" className={`timing-btn ${val === "AFTER"  ? "active" : ""}`} onClick={() => toggleMealTiming(meal, "AFTER")}>After</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Duration ── */}
        <div className="section-label">Duration</div>
        <div className="days-row">
          <input type="number" className="days-input" placeholder="Days" min="1" max="365" value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} />
          <DatePicker selected={form.startDate} onChange={(date) => setForm({ ...form, startDate: date })} dateFormat="dd MMM yyyy" placeholderText="Start date" className="start-date-picker" />
        </div>

        <div className="preset-chips">
          {DAY_PRESETS.map((p) => (
            <button key={p.value} type="button" className={`chip ${Number(form.numberOfDays) === p.value ? "chip-active" : ""}`} onClick={() => setForm({ ...form, numberOfDays: p.value })}>{p.label}</button>
          ))}
        </div>

        {getEndDate() && <p className="end-date-note">Ends on {getEndDate()}</p>}

        <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : existing ? "Update" : "Add"}</button>
        <button className="cancel-btn" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}