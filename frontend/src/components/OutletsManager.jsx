import React, { useState } from "react";
import { Building2, Plus, MapPin, Phone, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api";

export default function OutletsManager({ outlets, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    city: "Mumbai",
    locality: "",
    contactNumber: "",
    status: "Active",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setFormData({
      name: "",
      code: "",
      city: "Mumbai",
      locality: "",
      contactNumber: "",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      code: outlet.code,
      city: outlet.city,
      locality: outlet.locality,
      contactNumber: outlet.contactNumber,
      status: outlet.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await api.updateOutlet(editingOutlet._id, formData);
      } else {
        await api.createOutlet(formData);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert("Failed to save outlet");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this outlet branch?")) {
      try {
        await api.deleteOutlet(id);
        onRefresh();
      } catch (err) {
        alert("Failed to delete outlet");
      }
    }
  };

  const filteredOutlets = outlets.filter((out) => {
    const matchesSearch =
      out.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "ALL" || out.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Metro Outlet Branches</h2>
          <p>Manage branch locations, contact records, and active outlet operational status</p>
        </div>

        <div className="filter-controls">
          <input
            type="text"
            className="text-input"
            placeholder="Search branch name or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="select-input"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="ALL">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
          </select>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Outlet Branch
          </button>
        </div>
      </div>

      <div className="outlets-grid">
        {filteredOutlets.map((outlet) => (
          <div className="outlet-card" key={outlet._id}>
            <div>
              <div className="outlet-header">
                <div>
                  <div className="outlet-name">{outlet.name}</div>
                  <span className="outlet-code">{outlet.code}</span>
                </div>
                <span className={`status-pill ${outlet.status.toLowerCase()}`}>
                  {outlet.status}
                </span>
              </div>

              <div className="outlet-meta">
                <div className="meta-item">
                  <MapPin size={16} className="text-muted" />
                  <span>
                    <strong>{outlet.city}</strong> — {outlet.locality}
                  </span>
                </div>
                {outlet.contactNumber && (
                  <div className="meta-item">
                    <Phone size={16} className="text-muted" />
                    <span>{outlet.contactNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "1rem" }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleOpenEdit(outlet)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(outlet._id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "white" }}>
                {editingOutlet ? "Edit Branch Outlet" : "Register New Metro Outlet"}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Outlet Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Retail - Bandra West"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Metro City</label>
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

                <div className="form-group">
                  <label>Branch Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MUM-BD1"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Locality / Address Details</label>
                <input
                  type="text"
                  placeholder="e.g. Hill Road, Bandra West"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98200 11223"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Renovating">Renovating</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingOutlet ? "Save Changes" : "Create Outlet"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
