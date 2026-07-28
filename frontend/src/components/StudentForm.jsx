import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function StudentForm({ onSubmit, loading }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("Computer Science");
  const [year, setYear] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    onSubmit({ name, email, course, year: Number(year) });
    setName("");
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="card-panel" style={{ padding: "20px" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <UserPlus size={18} className="text-primary" /> Add Student Record
      </h3>
      <div className="form-group">
        <label className="form-label">Student Name</label>
        <input type="text" className="form-input" placeholder="e.g. Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input type="email" className="form-input" placeholder="aarav@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
        <div>
          <label className="form-label">Course</label>
          <input type="text" className="form-input" value={course} onChange={(e) => setCourse(e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Year</label>
          <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value={1}>1st</option>
            <option value={2}>2nd</option>
            <option value={3}>3rd</option>
            <option value={4}>4th</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Adding..." : "Add Student"}
      </button>
    </form>
  );
}
