import React, { useState, useEffect } from "react";
import { outletsAPI } from "../api";
import { Plus, Edit, Trash2, MapPin, Phone, X, ShieldAlert } from "lucide-react";

const Outlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null for create, id for update
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchOutlets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await outletsAPI.getAll();
      setOutlets(data);
    } catch (err) {
      setError(err.message || "Failed to load outlets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setName("");
    setCity("Mumbai");
    setAddress("");
    setPhone("");
    setSubmitError("");
    setModalOpen(true);
  };

  const openEditModal = (outlet) => {
    setEditId(outlet._id);
    setName(outlet.name);
    setCity(outlet.city);
    setAddress(outlet.address);
    setPhone(outlet.phone);
    setSubmitError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedPhone = phone.trim();

    // Validation
    if (trimmedName.length < 3) {
      setSubmitError("Name must be at least 3 characters long.");
      return;
    }

    if (trimmedAddress.length < 6) {
      setSubmitError("Address must be at least 6 characters long.");
      return;
    }

    // Basic phone validation: allows numbers, spaces, hyphens, and +
    const phoneRegex = /^[+0-9\s-]{7,15}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setSubmitError("Contact number must be a valid phone number (7-15 digits/symbols).");
      return;
    }

    setSubmitLoading(true);
    const outletData = {
      name: trimmedName,
      city,
      address: trimmedAddress,
      phone: trimmedPhone,
    };

    try {
      if (editId) {
        await outletsAPI.update(editId, outletData);
      } else {
        await outletsAPI.create(outletData);
      }
      setModalOpen(false);
      fetchOutlets();
    } catch (err) {
      setSubmitError(err.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this outlet? All products and sales associated with this outlet will be permanently deleted."
      )
    ) {
      try {
        await outletsAPI.delete(id);
        fetchOutlets();
      } catch (err) {
        alert(err.message || "Delete failed");
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Outlets</h1>
          <p className="page-description">Add and manage metro city business locations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Outlet</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div className="dot" style={{ width: "24px", height: "24px" }}></div>
        </div>
      ) : outlets.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🏢</div>
          <h3>No Outlets Added</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            Add your first metro outlet branch to begin tracking inventory and sales.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Add Outlet
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {outlets.map((outlet) => (
            <div key={outlet._id} className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "between", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>{outlet.name}</h3>
                  <span className="badge" style={{ backgroundColor: "rgba(79, 70, 229, 0.15)", color: "#818CF8", border: "1px solid rgba(79, 70, 229, 0.3)" }}>
                    {outlet.city}
                  </span>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => openEditModal(outlet)} title="Edit Outlet">
                    <Edit size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(outlet._id)} title="Delete Outlet">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-secondary)", fontSize: "14px", marginTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span>{outlet.address}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span>{outlet.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? "Edit Outlet" : "Add Metro Outlet"}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {submitError && (
              <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="outlet-name">Name</label>
                <input
                  id="outlet-name"
                  type="text"
                  placeholder="e.g. Metro Hub Bandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="outlet-city">City</label>
                <select
                  id="outlet-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="outlet-address">Address</label>
                <textarea
                  id="outlet-address"
                  rows="3"
                  placeholder="e.g. Linking Road, Bandra West"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{ resize: "none", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", color: "white" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="outlet-phone">Contact</label>
                <input
                  id="outlet-phone"
                  type="text"
                  placeholder="e.g. +91 22 26401234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? "Saving..." : editId ? "Update Outlet" : "Create Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outlets;
