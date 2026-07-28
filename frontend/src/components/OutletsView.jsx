import { useState } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, MapPin, Phone, X } from "lucide-react";

export default function OutletsView({ outlets = [], setOutlets, token, refreshData, addToast, userRole = "Manager" }) {
    const isCustomer = userRole === "Customer";
    const [modalOpen, setModalOpen] = useState(false);
    const [editOutlet, setEditOutlet] = useState(null);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [locality, setLocality] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const openAddModal = () => {
        if (isCustomer) return;
        setEditOutlet(null);
        setName("");
        setCity("");
        setLocality("");
        setContactNumber("");
        setModalOpen(true);
    };

    const openEditModal = (outlet) => {
        if (isCustomer) return;
        setEditOutlet(outlet);
        setName(outlet.name || "");
        setCity(outlet.city || "");
        setLocality(outlet.locality || outlet.address || "");
        setContactNumber(outlet.contactNumber || outlet.phone || "");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCustomer) return;
        if (!name || name.trim().length < 3) {
            addToast("Outlet Name must be at least 3 characters long", "warning");
            return;
        }
        if (!city) {
            addToast("Please select a Metro City", "warning");
            return;
        }

        setLoading(true);
        try {
            if (editOutlet) {
                await api.updateOutlet(editOutlet._id, {
                    name,
                    city,
                    locality: locality || "Main Road",
                    address: locality || "Main Road",
                    contactNumber,
                    phone: contactNumber,
                }, token);
                addToast("Outlet branch updated successfully", "success");
            } else {
                await api.createOutlet({
                    name,
                    city,
                    locality: locality || "Main Road",
                    address: locality || "Main Road",
                    contactNumber,
                    phone: contactNumber,
                }, token);
                addToast("New outlet branch added successfully", "success");
            }
            setModalOpen(false);
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Operation failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (isCustomer) return;
        try {
            await api.deleteOutlet(id, token);
            addToast("Outlet deleted successfully", "success");
            setDeleteConfirmId(null);
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Failed to delete outlet", "error");
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">{isCustomer ? "Store Locations & Branches" : "Manage Branch Outlets"}</h2>
                    <p className="page-subtitle">
                        {isCustomer 
                            ? "Explore physical retail branch locations and contact details across metro cities" 
                            : "Add and configure physical retail branch locations across metro cities"}
                    </p>
                </div>
                {!isCustomer && (
                    <button 
                        id="add-outlet-btn"
                        className="btn btn-primary" 
                        onClick={openAddModal}
                    >
                        <Plus size={18} />
                        Add Outlet
                    </button>
                )}
            </div>

            {outlets.length === 0 ? (
                <div className="card-panel empty-state">
                    <MapPin className="empty-state-icon" size={60} />
                    <h2>No Outlets Found</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                        {isCustomer ? "No store locations are currently registered." : "Start by creating an outlet branch to manage inventory and sales."}
                    </p>
                    {!isCustomer && (
                        <button 
                            className="btn btn-primary" 
                            onClick={openAddModal}
                        >
                            <Plus size={18} />
                            Add First Outlet
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-wrapper card-panel" style={{ padding: 0 }} id="outlets-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>City</th>
                                <th>Locality / Address</th>
                                <th>Contact</th>
                                <th style={{ textAlign: "right" }}>{isCustomer ? "Status" : "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outlets.map((outlet) => (
                                <tr key={outlet._id}>
                                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                        {outlet.name}
                                    </td>
                                    <td>
                                        <span className="badge badge-warning">{outlet.city}</span>
                                    </td>
                                    <td>{outlet.locality || outlet.address || "Central Branch"}</td>
                                    <td>
                                        {outlet.contactNumber || outlet.phone ? (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <Phone size={14} /> {outlet.contactNumber || outlet.phone}
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--text-muted)" }}>N/A</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {!isCustomer ? (
                                            <div style={{ display: "inline-flex", gap: "8px" }}>
                                                <button 
                                                    className="btn btn-secondary" 
                                                    style={{ padding: "6px 12px", fontSize: "13px" }}
                                                    onClick={() => openEditModal(outlet)}
                                                >
                                                    <Edit size={14} />
                                                    Edit
                                                </button>
                                                <button 
                                                    className="btn btn-danger" 
                                                    style={{ padding: "6px 12px", fontSize: "13px" }}
                                                    onClick={() => setDeleteConfirmId(outlet._id)}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="badge badge-success">Open & Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editOutlet ? "Edit Outlet Details" : "Add New Outlet Branch"}</h3>
                            <button 
                                type="button"
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                                onClick={() => setModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-name">Outlet Name</label>
                                    <input 
                                        id="outlet-name"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Metro Retail - Bandra West"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-city">Metro City</label>
                                    <select 
                                        id="outlet-city"
                                        className="form-select"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    >
                                        <option value="">Select city</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Ahmedabad">Ahmedabad</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-locality">Locality / Address</label>
                                    <input 
                                        id="outlet-locality"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Hill Road, Bandra West"
                                        value={locality}
                                        onChange={(e) => setLocality(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-phone">Contact Phone</label>
                                    <input 
                                        id="outlet-phone"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. +91 98200 11223"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setModalOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : editOutlet ? "Update Branch" : "Add Branch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <div className="modal-header">
                            <h3 className="text-danger">Delete Outlet Branch?</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: "var(--text-secondary)" }}>
                                Are you sure you want to delete this outlet branch? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
