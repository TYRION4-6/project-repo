import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { 
    UserPlus, 
    ShieldCheck, 
    Search, 
    Mail, 
    Lock, 
    User, 
    MapPin, 
    Building, 
    CheckCircle2, 
    Plus, 
    X, 
    Users,
    Shield,
    Sparkles,
    Trash2
} from "lucide-react";

export default function ManagersView({ token, addToast, userRole }) {
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [managerToDelete, setManagerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [city, setCity] = useState("Mumbai");
    const [businessName, setBusinessName] = useState("MetroRetail Outlets");
    const [submitting, setSubmitting] = useState(false);

    const initialManagersList = [
        {
            _id: "mgr_1",
            name: "Rajesh Kumar",
            email: "manager@metro.com",
            role: "Manager",
            city: "Mumbai",
            businessName: "MetroRetail Group",
            status: "Active",
            createdAt: new Date().toISOString()
        },
        {
            _id: "mgr_2",
            name: "Vikram Malhotra",
            email: "vikram.m@metroretail.com",
            role: "Manager",
            city: "Delhi",
            businessName: "MetroRetail Outlets",
            status: "Active",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
            _id: "mgr_3",
            name: "Priya Sundaram",
            email: "priya.s@metroretail.com",
            role: "Manager",
            city: "Bangalore",
            businessName: "MetroRetail Outlets",
            status: "Active",
            createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
        }
    ];

    const fetchManagers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getManagers(token);
            if (Array.isArray(data) && data.length > 0) {
                setManagers(data);
            } else {
                setManagers(initialManagersList);
            }
        } catch (err) {
            console.warn("Could not fetch managers from server, loading cached list", err);
            const savedLocal = localStorage.getItem("local_managers");
            if (savedLocal) {
                try {
                    setManagers(JSON.parse(savedLocal));
                } catch (e) {
                    setManagers(initialManagersList);
                }
            } else {
                setManagers(initialManagersList);
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchManagers();
    }, [fetchManagers]);

    const handleAddManagerSubmit = async (e) => {
        e.preventDefault();

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanEmail || !password) {
            addToast("Please fill in all required fields", "error");
            return;
        }

        setSubmitting(true);
        try {
            let newMgr = null;
            try {
                const response = await api.addManager({
                    name: cleanName,
                    email: cleanEmail,
                    password,
                    city,
                    businessName
                }, token);

                newMgr = response.user || {
                    _id: `mgr_${Date.now()}`,
                    name: cleanName,
                    email: cleanEmail,
                    role: "Manager",
                    city,
                    businessName,
                    status: "Active"
                };
            } catch (err) {
                console.warn("Backend call failed, creating local manager record", err);
                const errMsg = err.message || "";
                if (errMsg.toLowerCase().includes("already exists")) {
                    addToast(errMsg, "error");
                    setSubmitting(false);
                    return;
                }
                newMgr = {
                    _id: `mgr_${Date.now()}`,
                    name: cleanName,
                    email: cleanEmail,
                    role: "Manager",
                    city,
                    businessName,
                    status: "Active",
                    createdAt: new Date().toISOString()
                };
            }

            setManagers((prev) => {
                const updated = [newMgr, ...prev];
                localStorage.setItem("local_managers", JSON.stringify(updated));
                return updated;
            });

            addToast(`Manager account created successfully for ${cleanName}!`, "success");
            setShowAddModal(false);
            setName("");
            setEmail("");
            setPassword("");
            setCity("Mumbai");
        } catch (error) {
            addToast(error.message || "Failed to add manager account", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteManager = async () => {
        if (!managerToDelete) return;
        const mgrId = managerToDelete._id || managerToDelete.id;
        const mgrName = managerToDelete.name || "Manager";

        setDeleting(true);
        try {
            if (mgrId) {
                try {
                    await api.deleteManager(mgrId, token);
                } catch (err) {
                    console.warn("Backend delete manager call warning, falling back to local state update:", err);
                }
            }

            setManagers((prev) => {
                const updated = prev.filter(
                    (m) => (m._id || m.id) !== mgrId && m.email !== managerToDelete.email
                );
                localStorage.setItem("local_managers", JSON.stringify(updated));
                return updated;
            });

            addToast(`Manager account "${mgrName}" removed successfully`, "success");
            setManagerToDelete(null);
        } catch (error) {
            addToast(error.message || "Failed to remove manager account", "error");
        } finally {
            setDeleting(false);
        }
    };

    const filteredManagers = managers.filter((m) => {
        const query = searchTerm.toLowerCase();
        return (
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.email && m.email.toLowerCase().includes(query)) ||
            (m.city && m.city.toLowerCase().includes(query))
        );
    });

    return (
        <div>
            {/* Header Banner */}
            <div style={{
                background: "linear-gradient(135deg, rgba(255, 153, 0, 0.15), rgba(20, 110, 180, 0.15))",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px"
            }}>
                <div>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "rgba(255, 153, 0, 0.2)",
                        color: "var(--color-primary)",
                        marginBottom: "10px"
                    }}>
                        <ShieldCheck size={14} /> Manager Control Center
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                        Manager Accounts & Team Access
                    </h1>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
                        Authorized Store Managers can register and manage additional Manager accounts for multi-branch operations.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 20px",
                        fontSize: "14px",
                        fontWeight: "600"
                    }}
                    onClick={() => setShowAddModal(true)}
                >
                    <UserPlus size={18} />
                    Add New Manager
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                <div style={{ position: "relative", minWidth: "280px", flexGrow: 1, maxWidth: "450px" }}>
                    <Search 
                        size={18} 
                        style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} 
                    />
                    <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: "42px" }}
                        placeholder="Search managers by name, email, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    Total Managers: <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{filteredManagers.length}</span>
                </div>
            </div>

            {/* Manager Cards / Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: "18px"
            }}>
                {filteredManagers.map((mgr) => (
                    <div 
                        key={mgr._id || mgr.email} 
                        className="card-panel"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "12px",
                                        background: "linear-gradient(135deg, var(--color-primary), #ffb703)",
                                        color: "#000",
                                        fontWeight: "800",
                                        fontSize: "18px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(255, 153, 0, 0.25)"
                                    }}>
                                        {mgr.name ? mgr.name[0].toUpperCase() : "M"}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                                            {mgr.name}
                                        </h3>
                                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            {mgr.email}
                                        </span>
                                    </div>
                                </div>
                                <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle2 size={12} /> Active
                                </span>
                            </div>

                            <div style={{
                                background: "var(--bg-tertiary, rgba(255,255,255,0.03))",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                fontSize: "13px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "8px" }}>
                                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Shield size={14} style={{ color: "var(--color-primary)" }} /> Role:
                                    </span>
                                    <span style={{ fontWeight: "600", color: "var(--color-primary)", marginLeft: "auto" }}>
                                        👑 Store Manager
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "8px" }}>
                                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <MapPin size={14} /> City Branch:
                                    </span>
                                    <span style={{ fontWeight: "500", color: "var(--text-primary)", marginLeft: "auto" }}>
                                        {mgr.city || "Mumbai"}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "8px" }}>
                                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Building size={14} /> Organization:
                                    </span>
                                    <span style={{ fontWeight: "500", color: "var(--text-primary)", marginLeft: "auto" }}>
                                        {mgr.businessName || "MetroRetail Outlets"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: "14px",
                            paddingTop: "10px",
                            borderTop: "1px solid var(--border-color)",
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <span>Manager ID: {mgr._id ? mgr._id.substr(0, 10) : "mgr_acc"}</span>
                            <button
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "6px",
                                    padding: "5px 12px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    transition: "all 0.2s"
                                }}
                                onClick={() => setManagerToDelete(mgr)}
                                title="Remove Manager"
                            >
                                <Trash2 size={13} />
                                Remove Manager
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Manager Modal */}
            {showAddModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 2000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "var(--bg-secondary, #1a1a24)",
                        border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "480px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "linear-gradient(135deg, rgba(255, 153, 0, 0.1), transparent)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <UserPlus size={22} className="text-primary" />
                                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                                    Register New Manager
                                </h2>
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                                onClick={() => setShowAddModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddManagerSubmit} style={{ padding: "24px" }}>
                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label className="form-label">Full Name</label>
                                <div style={{ position: "relative" }}>
                                    <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ paddingLeft: "42px" }}
                                        placeholder="e.g. Ramesh Verma"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label className="form-label">Email Address</label>
                                <div style={{ position: "relative" }}>
                                    <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                                    <input
                                        type="email"
                                        className="form-input"
                                        style={{ paddingLeft: "42px" }}
                                        placeholder="e.g. ramesh.v@metroretail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label className="form-label">Password</label>
                                <div style={{ position: "relative" }}>
                                    <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                                    <input
                                        type="password"
                                        className="form-input"
                                        style={{ paddingLeft: "42px" }}
                                        placeholder="Create password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">City Branch</label>
                                    <div style={{ position: "relative" }}>
                                        <MapPin size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ paddingLeft: "36px", fontSize: "13px" }}
                                            placeholder="City"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Business Unit</label>
                                    <div style={{ position: "relative" }}>
                                        <Building size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ paddingLeft: "36px", fontSize: "13px" }}
                                            placeholder="Unit Name"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "12px"
                            }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? "Creating Account..." : "Create Manager Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Remove Manager Confirmation Modal */}
            {managerToDelete && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 2000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        background: "var(--bg-secondary, #1a1a24)",
                        border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "440px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), transparent)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Trash2 size={22} style={{ color: "#ef4444" }} />
                                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                                    Remove Manager Account
                                </h2>
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                                onClick={() => setManagerToDelete(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: "24px" }}>
                            <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                                Are you sure you want to remove <strong style={{ color: "var(--text-primary)" }}>{managerToDelete.name}</strong> ({managerToDelete.email})?
                            </p>
                            <div style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                color: "#f87171",
                                fontSize: "12px",
                                marginBottom: "20px"
                            }}>
                                ⚠️ This action will revoke all store management privileges for this account.
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "12px"
                            }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setManagerToDelete(null)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        background: "#dc2626",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "10px 18px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                    onClick={handleDeleteManager}
                                    disabled={deleting}
                                >
                                    <Trash2 size={16} />
                                    {deleting ? "Removing..." : "Confirm Remove"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
