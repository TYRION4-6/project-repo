import { useState } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, MapPin, Phone, X } from "lucide-react";

export default function OutletsView({ outlets, setOutlets, token, refreshData, addToast }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editOutlet, setEditOutlet] = useState(null); // If not null, we are editing this outlet
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    // Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const openAddModal = () => {
        setEditOutlet(null);
        setName("");
        setCity("");
        setAddress("");
        setPhone("");
        setModalOpen(true);
    };

    const openEditModal = (outlet) => {
        setEditOutlet(outlet);
        setName(outlet.name);
        setCity(outlet.city);
        setAddress(outlet.address);
        setPhone(outlet.phone || "");
        setModalOpen(true);
    };

    // Client-side validations
    const validateFields = () => {
        if (!name || name.trim().length < 3) {
            addToast("Outlet Name must be at least 3 characters long", "warning");
            return false;
        }
        if (!city) {
            addToast("Please select a Metro City", "warning");
            return false;
        }
        if (!address || address.trim().length < 5) {
            addToast("Address must be at least 5 characters long", "warning");
            return false;
        }
        if (phone && !/^[+0-9\s-]{10,15}$/.test(phone.trim())) {
            addToast("Please enter a valid phone number (10-15 digits)", "warning");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        const trimmedName = name.trim();
        const trimmedCity = city;
        const trimmedAddress = address.trim();
        const trimmedPhone = phone.trim();

        setLoading(true);
        const originalOutlets = [...outlets];

        if (editOutlet) {
            // Optimistic Update: edit existing
            const updatedOutlet = {
                ...editOutlet,
                name: trimmedName,
                city: trimmedCity,
                address: trimmedAddress,
                phone: trimmedPhone
            };

            // Update local state immediately
            setOutlets(outlets.map(o => o._id === editOutlet._id ? updatedOutlet : o));
            setModalOpen(false);
            addToast("Outlet branch updated successfully", "success");

            try {
                await api.updateOutlet(editOutlet._id, { 
                    name: trimmedName, 
                    city: trimmedCity, 
                    address: trimmedAddress, 
                    phone: trimmedPhone 
                }, token);
                refreshData(); // silent sync
            } catch (err) {
                // Revert state
                setOutlets(originalOutlets);
                addToast(err.message || "Failed to update outlet. Reverted changes.", "error");
            } finally {
                setLoading(false);
            }
        } else {
            // Optimistic Update: add new
            const tempId = `temp-${Date.now()}`;
            const newOutlet = {
                _id: tempId,
                name: trimmedName,
                city: trimmedCity,
                address: trimmedAddress,
                phone: trimmedPhone,
                createdAt: new Date().toISOString()
            };

            // Update local state immediately
            setOutlets([newOutlet, ...outlets]);
            setModalOpen(false);
            addToast("New outlet branch added successfully", "success");

            try {
                const savedOutlet = await api.createOutlet({ 
                    name: trimmedName, 
                    city: trimmedCity, 
                    address: trimmedAddress, 
                    phone: trimmedPhone 
                }, token);
                // Replace temp outlet with real one
                setOutlets(prev => prev.map(o => o._id === tempId ? savedOutlet : o));
                refreshData(); // silent sync
            } catch (err) {
                // Revert state
                setOutlets(originalOutlets);
                addToast(err.message || "Failed to add outlet. Reverted changes.", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        const originalOutlets = [...outlets];

        // Optimistic Update: delete
        setOutlets(outlets.filter(o => o._id !== id));
        setDeleteConfirmId(null);
        addToast("Outlet and related items deleted successfully", "success");

        try {
            await api.deleteOutlet(id, token);
            refreshData(); // silent sync to update products, sales, analytics
        } catch (err) {
            // Revert state
            setOutlets(originalOutlets);
            addToast(err.message || "Failed to delete outlet. Reverted deletion.", "error");
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Manage Branch Outlets</h2>
                    <p className="page-subtitle">Add and configure physical retail branch locations across metro cities</p>
                </div>
                <button 
                    id="add-outlet-btn"
                    className="btn btn-primary" 
                    onClick={openAddModal}
                >
                    <Plus size={18} />
                    Add Outlet
                </button>
            </div>

            {outlets.length === 0 ? (
                <div className="card-panel empty-state">
                    <MapPin className="empty-state-icon" size={60} />
                    <h2>No Outlets Found</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                        Start by creating an outlet branch. This represents a location where inventory is tracked and sales are registered.
                    </p>
                    <button 
                        id="empty-add-outlet-btn-view"
                        className="btn btn-primary" 
                        onClick={openAddModal}
                    >
                        <Plus size={18} />
                        Add First Outlet
                    </button>
                </div>
            ) : (
                <div className="table-wrapper card-panel" style={{ padding: 0 }} id="outlets-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outlets.map((outlet) => (
                                <tr key={outlet._id}>
                                    <td style={{ fontWeight: "600", color: "white" }}>
                                        {outlet.name}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: "500", color: "white" }}>
                                            {outlet.address}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                            <span>{outlet.city}</span>
                                            {outlet.phone && (
                                                <>
                                                    <span style={{ color: "var(--text-muted)" }}>•</span>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Phone size={10} style={{ color: "var(--text-secondary)" }} />
                                                        {outlet.phone}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "inline-flex", gap: "8px" }}>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => openEditModal(outlet)}
                                                disabled={outlet._id.toString().startsWith("temp-")}
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </button>
                                            <button 
                                                className="btn btn-danger" 
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => setDeleteConfirmId(outlet._id)}
                                                disabled={outlet._id.toString().startsWith("temp-")}
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
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
                                    <label className="form-label" htmlFor="outlet-name-input">Outlet Name</label>
                                    <input 
                                        id="outlet-name-input"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Connaught Place Branch"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-city-select">Metro City</label>
                                    <select 
                                        id="outlet-city-select"
                                        className="form-select"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a city</option>
                                        <option value="Delhi">Delhi (NCR)</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Pune">Pune</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-address-input">Street Address</label>
                                    <input 
                                        id="outlet-address-input"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Full address of the outlet"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-phone-input">Contact Phone (Optional)</label>
                                    <input 
                                        id="outlet-phone-input"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. +91 98765 43210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
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
                                    id="outlet-submit-btn"
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

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <div className="modal-header" style={{ borderBottom: "none" }}>
                            <h3 className="text-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Trash2 size={20} />
                                Delete Outlet Branch?
                            </h3>
                        </div>
                        <div className="modal-body" style={{ paddingTop: 0 }}>
                            <p style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                Are you sure you want to delete this outlet? Deleting this outlet will <strong>permanently delete all associated products (inventory) and sales logs</strong>.
                            </p>
                            <p style={{ marginTop: "12px", color: "var(--color-danger)", fontWeight: "500", fontSize: "14px" }}>
                                Warning: This action is irreversible.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ borderTop: "none" }}>
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setDeleteConfirmId(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                id="delete-outlet-confirm-btn"
                                type="button" 
                                className="btn btn-danger" 
                                onClick={() => handleDelete(deleteConfirmId)}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
