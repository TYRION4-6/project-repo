import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api";
import ManagerLoginForm from "./ManagerLoginForm";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "MetroRetail Group",
    city: "Mumbai",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.register(formData);
      if (res.error) {
        setError(res.error);
      } else {
        localStorage.setItem("metro_token", res.token);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError("Network or server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header" style={{ marginBottom: "1rem" }}>
          <div>
            <h3 style={{ color: "white", fontSize: "1.2rem", fontWeight: 700 }}>
              {isRegister ? "Register Business Manager" : "Manager Security Portal"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Enterprise multi-branch inventory & sales management
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            aria-label="Close authentication modal"
          >
            <X size={20} />
          </button>
        </div>

        {!isRegister ? (
          <ManagerLoginForm
            onAuthSuccess={(userData) => {
              onAuthSuccess(userData);
              onClose();
            }}
            onSwitchToRegister={() => {
              setError("");
              setIsRegister(true);
            }}
          />
        ) : (
          <div>
            {error && (
              <div
                style={{
                  padding: "0.75rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Manager Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Work Email *</label>
                <input
                  type="email"
                  placeholder="manager@metroretail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company / Group Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>HQ City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                disabled={loading}
              >
                {loading ? "Processing Registration..." : "Create Manager Account"}
              </button>
            </form>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <p
                onClick={() => {
                  setError("");
                  setIsRegister(false);
                }}
                style={{
                  color: "var(--primary)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Already have an account? Back to Manager Login
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
