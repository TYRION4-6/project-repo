import React, { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Phone, Store, X } from "lucide-react";

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad"];

export default function OutletsView({ outlets, onCreateOutlet, onUpdateOutlet, onDeleteOutlet, loading }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    city: "Mumbai",
    address: "",
    phone: ""
  });

  const handleOpenCreate = () => {
    setEditingOutlet(null);
    setFormData({
      name: "",
      city: "Mumbai",
      address: "",
      phone: ""
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      city: outlet.city,
      address: outlet.address,
      phone: outlet.phone
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOutlet) {
      onUpdateOutlet(editingOutlet._id, formData);
    } else {
      onCreateOutlet(formData);
    }
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading branch details...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex-between mb-6">
        <div>
          <h2>Business Outlets</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Add and manage physical outlets across major Indian metropolitan cities.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Outlet</span>
        </button>
      </div>

      {outlets.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: "48px 24px" }}>
          <Store size={48} className="text-muted" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ color: "#fff" }}>No Outlets Added Yet</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "8px auto 24px" }}>
            Create your first metro-city outlet to set up inventory stocks and start logging branch sales.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            Create First Outlet
          </button>
        </div>
      ) : (
        <div className="outlet-grid">
          {outlets.map((outlet) => (
            <div key={outlet._id} className="glass-card interactive">
              <div className="flex-between mb-4">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Store size={18} className="text-muted" style={{ color: "var(--primary-light)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{outlet.name}</h3>
                </div>
                <span className="badge badge-info">{outlet.city}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <MapPin size={16} className="text-muted" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{outlet.address}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Phone size={16} className="text-muted" />
                  <span>{outlet.phone}</span>
                </div>
              </div>

              <div style={{ 
                display: "flex", 
                justifyContent: "flex-end", 
                gap: "12px", 
                borderTop: "1px solid var(--border-light)", 
                paddingTop: "14px",
                marginTop: "14px"
              }}>
                <button 
                  onClick={() => handleOpenEdit(outlet)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${outlet.name}? This will clear all stock levels associate with it.`)) {
                      onDeleteOutlet(outlet._id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between mb-6">
              <h2 style={{ margin: 0 }}>{editingOutlet ? "Edit Outlet" : "Add New Outlet"}</h2>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Outlet Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Connaught Place Branch"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Metro City</label>
                <select 
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="e.g. Block A, Inner Circle, Connaught Place, New Delhi"
                  rows={3}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Phone / Contact Number</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="e.g. +91 98765 43210"
                  required 
                />
              </div>

              <div className="flex-end" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOutlet ? "Save Changes" : "Create Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
