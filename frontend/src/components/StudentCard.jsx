import { GraduationCap, Mail } from "lucide-react";

export default function StudentCard({ student }) {
  return (
    <div className="card-panel" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div style={{ background: "rgba(255, 153, 0, 0.15)", padding: "10px", borderRadius: "10px" }}>
          <GraduationCap size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", margin: 0 }}>{student.name}</h4>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{student.course} • Year {student.year}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <Mail size={14} /> {student.email}
      </div>
    </div>
  );
}
