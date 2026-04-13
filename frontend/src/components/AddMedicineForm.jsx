import { useState, useEffect } from "react";
import "./AddMedicineForm.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MEALS = ["breakfast", "lunch", "dinner"];

const DAY_PRESETS = [
  { label: "3 days", value: 3 },
  { label: "5 days", value: 5 },
  { label: "1 week", value: 7 },
  { label: "2 weeks", value: 14 },
  { label: "1 month", value: 30 },
  { label: "3 months", value: 90 },
];

const SLOT_HINTS = {
  breakfast: "Example: 07:30",
  lunch: "Example: 13:00",
  dinner: "Example: 20:00",
};

const defaultMealTimings = {
  breakfastTiming: "NONE",
  lunchTiming: "NONE",
  dinnerTiming: "NONE",
};

const defaultMealTimes = {
  breakfastTime: "",
  lunchTime: "",
  dinnerTime: "",
};

export default function AddMedicineForm({ close, fetchMedicines, fetchProgress, existing, apiBasePath = "http://localhost:8080/api/medicine" }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    numberOfDays: 1,
    startDate: new Date(),
    notes: "",
  });
  const [mealTimings, setMealTimings] = useState({ ...defaultMealTimings });
  const [mealTimes, setMealTimes] = useState({ ...defaultMealTimes });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(existing);

  useEffect(() => {
    if (!existing) return;

    let parsedStart = new Date();
    if (existing.startDate) {
      try {
        parsedStart = new Date(existing.startDate);
      } catch {
        parsedStart = new Date();
      }
    }

    const nextMealTimings = {
      breakfastTiming: existing.breakfastTiming || "NONE",
      lunchTiming: existing.lunchTiming || "NONE",
      dinnerTiming: existing.dinnerTiming || "NONE",
    };

    const nextMealTimes = { ...defaultMealTimes };
    if (nextMealTimings.breakfastTiming !== "NONE") nextMealTimes.breakfastTime = existing.time || "";
    if (nextMealTimings.lunchTiming !== "NONE") nextMealTimes.lunchTime = existing.time || "";
    if (nextMealTimings.dinnerTiming !== "NONE") nextMealTimes.dinnerTime = existing.time || "";

    setForm({
      name: existing.name || "",
      dosage: existing.dosage || "",
      numberOfDays: existing.numberOfDays || 1,
      startDate: parsedStart,
      notes: existing.notes || "",
    });
    setMealTimings(nextMealTimings);
    setMealTimes(nextMealTimes);
  }, [existing]);

  const formatDate = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  };

  const getEndDate = () => {
    if (!form.startDate || !form.numberOfDays) return null;
    const end = new Date(form.startDate);
    end.setDate(end.getDate() + Number(form.numberOfDays) - 1);
    return end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const selectedCount = Object.values(mealTimings).filter((value) => value !== "NONE").length;

  const toggleMealTiming = (meal, value) => {
    const key = `${meal}Timing`;
    const timeKey = `${meal}Time`;

    if (isEditing) {
      setMealTimings({
        breakfastTiming: "NONE",
        lunchTiming: "NONE",
        dinnerTiming: "NONE",
        [key]: mealTimings[key] === value ? "NONE" : value,
      });
      setMealTimes({
        breakfastTime: "",
        lunchTime: "",
        dinnerTime: "",
        [timeKey]: mealTimings[key] === value ? "" : (mealTimes[timeKey] || existing?.time || ""),
      });
      return;
    }

    setMealTimings((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "NONE" : value,
    }));
    setMealTimes((prev) => ({
      ...prev,
      [timeKey]: mealTimings[key] === value ? "" : prev[timeKey],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.dosage.trim()) {
      setError("Please fill in medicine name and dosage");
      return;
    }
    if (!form.numberOfDays || Number(form.numberOfDays) < 1) {
      setError("Please enter a valid number of days");
      return;
    }
    if (selectedCount === 0) {
      setError("Please select at least one meal slot");
      return;
    }
    if (isEditing && selectedCount !== 1) {
      setError("While editing, select exactly one meal slot");
      return;
    }

    const missingTimeMeal = MEALS.find((meal) => {
      const timingKey = `${meal}Timing`;
      const timeKey = `${meal}Time`;
      return mealTimings[timingKey] !== "NONE" && !mealTimes[timeKey];
    });

    if (missingTimeMeal) {
      setError(`Please choose a due time for ${missingTimeMeal}`);
      return;
    }

    setError("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      numberOfDays: Number(form.numberOfDays),
      startDate: formatDate(form.startDate),
      notes: form.notes.trim() || null,
      ...mealTimings,
      ...mealTimes,
    };

    const url = isEditing
      ? `${apiBasePath}/${existing.id}`
      : apiBasePath;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || "Failed to save medicine");
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
        <h3 className="form-title">{isEditing ? "Update Medicine Slot" : "Add Medicine"}</h3>
        {error && <div className="form-error">{error}</div>}

        <input
          placeholder="Medicine Name"
          value={form.name}
          onChange={(e) => {
            setError("");
            setForm({ ...form, name: e.target.value });
          }}
        />
        <input
          placeholder="Dosage (e.g. 500mg)"
          value={form.dosage}
          onChange={(e) => setForm({ ...form, dosage: e.target.value })}
        />

        <div className="section-label">Meal Slots</div>
        <p className="form-help">
          {isEditing
            ? "Editing updates one scheduled slot at a time."
            : "Each selected slot becomes a separate scheduled medicine entry, and you can set its own due time."}
        </p>

        <div className="meal-timing-group">
          {MEALS.map((meal) => {
            const key = `${meal}Timing`;
            const timeKey = `${meal}Time`;
            const val = mealTimings[key];
            const isSelected = val !== "NONE";

            return (
              <div className="meal-row" key={meal}>
                <div className="meal-copy">
                  <span className="meal-name">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                  <span className="meal-slot-note">{SLOT_HINTS[meal]}</span>
                </div>

                <div className="meal-controls">
                  <div className="timing-btns">
                    <button
                      type="button"
                      className={`timing-btn ${val === "BEFORE" ? "active" : ""}`}
                      onClick={() => toggleMealTiming(meal, "BEFORE")}
                    >
                      Before
                    </button>
                    <button
                      type="button"
                      className={`timing-btn ${val === "AFTER" ? "active" : ""}`}
                      onClick={() => toggleMealTiming(meal, "AFTER")}
                    >
                      After
                    </button>
                  </div>

                  <input
                    type="time"
                    className={`slot-time-input ${isSelected ? "slot-time-input--active" : ""}`}
                    value={mealTimes[timeKey]}
                    disabled={!isSelected}
                    onChange={(e) => setMealTimes((prev) => ({ ...prev, [timeKey]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-label">Duration</div>
        <div className="days-row">
          <input
            type="number"
            className="days-input"
            placeholder="Days"
            min="1"
            max="365"
            value={form.numberOfDays}
            onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })}
          />
          <DatePicker
            selected={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
            dateFormat="dd MMM yyyy"
            placeholderText="Start date"
            className="start-date-picker"
          />
        </div>

        <div className="preset-chips">
          {DAY_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`chip ${Number(form.numberOfDays) === preset.value ? "chip-active" : ""}`}
              onClick={() => setForm({ ...form, numberOfDays: preset.value })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {getEndDate() && <p className="end-date-note">Ends on {getEndDate()}</p>}

        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update" : "Add"}
        </button>
        <button className="cancel-btn" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}
