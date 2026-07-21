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
    const [errors, setErrors] = useState({});

    // Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const openAddModal = () => {
        setEditOutlet(null);
        setName("");
        setCity("");
        setAddress("");
        setPhone("");
        setErrors({});
        setModalOpen(true);
    };

    const openEditModal = (outlet) => {
        setEditOutlet(outlet);
        setName(outlet.name);
        setCity(outlet.city);
        setAddress(outlet.address);
        setPhone(outlet.phone || "");
        setErrors({});
        setModalOpen(true);
    };

    // Client-side validations
    const validateFields = () => {
        const newErrors = {};
        if (!name || name.trim().length < 3) {
            newErrors.name = "Outlet Name must be at least 3 characters long";
        }
        if (!city) {
            newErrors.city = "Please select a Metro City";
        }
        if (!address || address.trim().length < 5) {
            newErrors.address = "Address must be at least 5 characters long";
        }
        if (phone && !/^[+0-9\s-]{10,15}$/.test(phone.trim())) {
            newErrors.phone = "Please enter a valid phone number (10-15 digits)";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Show the first validation message as a warning toast
            const firstError = Object.values(newErrors)[0];
            addToast(firstError, "warning");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        const newOutletData = {
            name: name.trim(),
            city,
            address: address.trim(),
            phone: phone.trim()
        };

        const previousOutlets = [...outlets];
        setLoading(true);

        if (editOutlet) {
            // Optimistic update for Edit
            setOutlets(outlets.map(outlet => 
                outlet._id === editOutlet._id 
                    ? { ...outlet, ...newOutletData } 
                    : outlet
            ));
            addToast("Updating outlet branch...", "info");
            setModalOpen(false);

            try {
                const updated = await api.updateOutlet(editOutlet._id, newOutletData, token);
                setOutlets(prev => prev.map(outlet => 
                    outlet._id === editOutlet._id ? updated : outlet
                ));
                addToast("Outlet branch updated successfully", "success");
                refreshData();
            } catch (err) {
                // Rollback on error
                setOutlets(previousOutlets);
                addToast(err.message || "Failed to update outlet", "error");
            } finally {
                setLoading(false);
            }
        } else {
            // Optimistic update for Add
            const tempId = `temp_${Date.now()}`;
            const optimisticNewOutlet = {
                _id: tempId,
                ...newOutletData,
                createdAt: new Date().toISOString()
            };

            setOutlets([optimisticNewOutlet, ...outlets]);
            addToast("Adding new outlet branch...", "info");
            setModalOpen(false);

            try {
                const created = await api.createOutlet(newOutletData, token);
                setOutlets(prev => prev.map(outlet => 
                    outlet._id === tempId ? created : outlet
                ));
                addToast("New outlet branch added successfully", "success");
                refreshData();
            } catch (err) {
                // Rollback on error
                setOutlets(previousOutlets);
                addToast(err.message || "Failed to add outlet", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        const previousOutlets = [...outlets];
        
        // Optimistic update for Delete
        setOutlets(outlets.filter(outlet => outlet._id !== id));
        addToast("Deleting outlet branch...", "info");
        setDeleteConfirmId(null);

        try {
            await api.deleteOutlet(id, token);
            addToast("Outlet branch and related items deleted successfully", "success");
            refreshData();
        } catch (err) {
            // Rollback on error
            setOutlets(previousOutlets);
            addToast(err.message || "Failed to delete outlet", "error");
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
                                        <div>{outlet.name}</div>
                                        {outlet.phone ? (
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "normal" }}>
                                                <Phone size={12} style={{ color: "var(--text-secondary)" }} />
                                                {outlet.phone}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "normal" }}>
                                                No Contact Phone
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: "500", color: "white" }}>
                                            {outlet.address}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                            {outlet.city}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "inline-flex", gap: "8px" }}>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => openEditModal(outlet)}
                                                disabled={outlet._id.startsWith?.("temp_")}
                                            >
                                                <Edit size={14} />
                                                Edit
                                            </button>
                                            <button 
                                                className="btn btn-danger" 
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => setDeleteConfirmId(outlet._id)}
                                                disabled={outlet._id.startsWith?.("temp_")}
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
                                        className={`form-input ${errors.name ? 'is-invalid' : ''}`} 
                                        placeholder="e.g. Connaught Place Branch"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                                        }}
                                        required
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-city-select">Metro City</label>
                                    <select 
                                        id="outlet-city-select"
                                        className={`form-select ${errors.city ? 'is-invalid' : ''}`}
                                        value={city}
                                        onChange={(e) => {
                                            setCity(e.target.value);
                                            if (errors.city) setErrors(prev => ({ ...prev, city: null }));
                                        }}
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
                                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-address-input">Street Address</label>
                                    <input 
                                        id="outlet-address-input"
                                        type="text" 
                                        className={`form-input ${errors.address ? 'is-invalid' : ''}`} 
                                        placeholder="Full address of the outlet"
                                        value={address}
                                        onChange={(e) => {
                                            setAddress(e.target.value);
                                            if (errors.address) setErrors(prev => ({ ...prev, address: null }));
                                        }}
                                        required
                                    />
                                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="outlet-phone-input">Contact Phone (Optional)</label>
                                    <input 
                                        id="outlet-phone-input"
                                        type="text" 
                                        className={`form-input ${errors.phone ? 'is-invalid' : ''}`} 
                                        placeholder="e.g. +91 98765 43210"
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                                        }}
                                    />
                                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
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
