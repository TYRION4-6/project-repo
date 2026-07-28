import { useState, useEffect } from "react";
import { api } from "../api";
import StudentCard from "./StudentCard";
import StudentForm from "./StudentForm";
import { GraduationCap } from "lucide-react";

export default function StudentsView({ token, addToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents(token);
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const handleAddStudent = async (studentData) => {
    setLoading(true);
    try {
      const created = await api.createStudent(studentData, token);
      setStudents([created, ...students]);
      addToast("Student added successfully", "success");
    } catch (err) {
      addToast(err.message || "Failed to add student", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Directory</h2>
          <p className="page-subtitle">Manage campus student enrollments and records</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        <StudentForm onSubmit={handleAddStudent} loading={loading} />
        <div>
          <div className="cards-grid">
            {students.length === 0 ? (
              <div className="card-panel empty-state" style={{ gridColumn: "1 / -1" }}>
                <GraduationCap className="empty-state-icon" size={48} />
                <h3>No Students Registered</h3>
              </div>
            ) : (
              students.map((s) => <StudentCard key={s._id} student={s} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
