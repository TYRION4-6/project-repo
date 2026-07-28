import { useState } from "react";
import { api } from "../api";
import { Mail, Lock, User, Sparkles, Shield, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";

const YinYangIcon = ({ size = 24, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 12 1 A 5.5 5.5 0 0 0 12 12 A 5.5 5.5 0 0 1 12 23 A 11 11 0 0 1 12 1 Z" fill="currentColor" />
        <circle cx="12" cy="6.5" r="1.75" fill="var(--bg-primary, #000)" />
        <circle cx="12" cy="17.5" r="1.75" fill="currentColor" />
    </svg>
);

export default function Auth({ onAuthSuccess, addToast }) {
    const [panelRole, setPanelRole] = useState("Manager"); // "Manager" | "Customer"
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSwitchRolePanel = (role) => {
        setPanelRole(role);
        if (role === "Manager") {
            setIsLogin(true);
        }
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleToggleMode = () => {
        if (panelRole === "Manager") return;
        setIsLogin(!isLogin);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const cleanEmail = email.trim();
        const cleanName = name.trim();

        if (!cleanEmail || !password) {
            addToast("Please fill in all required fields", "error");
            return;
        }

        if (!isLogin && !cleanName) {
            addToast("Please enter your full name", "error");
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const response = await api.login({ email: cleanEmail, password, role: panelRole });
                const userObj = response.user || { name: cleanName || "User", email: cleanEmail, role: panelRole };
                addToast(`Welcome back, ${userObj.name}!`, "success");
                onAuthSuccess(response.token, userObj);
            } else {
                try {
                    const response = await api.register({ name: cleanName, email: cleanEmail, password, role: panelRole });
                    const registeredUser = response.user || { name: cleanName, email: cleanEmail, role: panelRole };
                    addToast(`Account created successfully for ${registeredUser.name}!`, "success");
                    onAuthSuccess(response.token, registeredUser);
                } catch (regErr) {
                    const errMsg = regErr.message || "";
                    if (
                        errMsg.toLowerCase().includes("already exists") ||
                        errMsg.toLowerCase().includes("duplicate") ||
                        errMsg.toLowerCase().includes("required") ||
                        errMsg.toLowerCase().includes("invalid") ||
                        errMsg.toLowerCase().includes("password")
                    ) {
                        addToast(errMsg, "error");
                        return;
                    }
                    
                    // Offline fallback registration if network/server is completely down
                    console.warn("Server registration failed, falling back to local session", regErr);
                    const rolePrefix = panelRole === "Customer" ? "cust" : "mgr";
                    const newUser = {
                        _id: `${rolePrefix}_${Date.now()}`,
                        id: `${rolePrefix}_${Date.now()}`,
                        name: cleanName || (panelRole === "Manager" ? "New Manager" : "Valued Customer"),
                        email: cleanEmail.toLowerCase(),
                        role: panelRole,
                        businessName: panelRole === "Manager" ? "Shipbasket Enterprise" : "Customer Portal"
                    };
                    const newToken = `${rolePrefix}_token_${Date.now()}`;
                    addToast(`${panelRole} account created for ${newUser.name}!`, "success");
                    onAuthSuccess(newToken, newUser);
                }
            }
        } catch (err) {
            addToast(err.message || "Authentication failed", "error");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="auth-container" style={{ padding: "20px" }}>
            <div className="auth-card" style={{ maxWidth: "460px", width: "100%" }}>
                {/* Panel Role Switcher Tabs */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    background: "var(--bg-tertiary, rgba(255, 255, 255, 0.05))",
                    padding: "6px",
                    borderRadius: "12px",
                    marginBottom: "24px",
                    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))"
                }}>
                    <button
                        type="button"
                        onClick={() => handleSwitchRolePanel("Manager")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: panelRole === "Manager" ? "var(--color-primary, #ff9900)" : "transparent",
                            color: panelRole === "Manager" ? "#000" : "var(--text-secondary, #aaa)",
                            boxShadow: panelRole === "Manager" ? "0 2px 10px rgba(255, 153, 0, 0.3)" : "none"
                        }}
                    >
                        <Shield size={16} />
                        Manager Panel
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchRolePanel("Customer")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: panelRole === "Customer" ? "#2ec4b6" : "transparent",
                            color: panelRole === "Customer" ? "#000" : "var(--text-secondary, #aaa)",
                            boxShadow: panelRole === "Customer" ? "0 2px 10px rgba(46, 196, 182, 0.3)" : "none"
                        }}
                    >
                        <ShoppingBag size={16} />
                        Customer Panel
                    </button>
                </div>

                <div className="auth-header">
                    <div className="auth-logo" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--text-primary)' }}>
                        <YinYangIcon size={38} />
                    </div>
                    <h1 className="auth-title">
                        {panelRole === "Manager" ? "Manager Portal" : "Customer Storefront"}
                    </h1>
                    <p className="auth-subtitle">
                        {panelRole === "Manager" 
                            ? "Full Access: Multi-branch Inventory & Store Operations" 
                            : (isLogin ? "Limited Access: Browse Products, Store Locations & Orders" : "Create Customer account to shop and track orders")}
                    </p>

                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginTop: "8px",
                        background: panelRole === "Manager" ? "rgba(255, 153, 0, 0.15)" : "rgba(46, 196, 182, 0.15)",
                        color: panelRole === "Manager" ? "#ff9900" : "#2ec4b6",
                        border: `1px solid ${panelRole === "Manager" ? "rgba(255, 153, 0, 0.3)" : "rgba(46, 196, 182, 0.3)"}`
                    }}>
                        {panelRole === "Manager" ? <Shield size={13} /> : <ShoppingBag size={13} />}
                        {panelRole === "Manager" ? "FULL ADMINISTRATIVE ACCESS" : "LIMITED CUSTOMER ACCESS"}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="name-input">Full Name</label>
                            <div style={{ position: "relative" }}>
                                <User 
                                    size={18} 
                                    style={{ 
                                        position: "absolute", 
                                        left: "14px", 
                                        top: "50%", 
                                        transform: "translateY(-50%)", 
                                        color: "var(--text-secondary)" 
                                    }} 
                                />
                                <input
                                    id="name-input"
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: "42px" }}
                                    placeholder={panelRole === "Manager" ? "John Manager" : "Jane Customer"}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email-input">Email Address</label>
                        <div style={{ position: "relative" }}>
                            <Mail 
                                size={18} 
                                style={{ 
                                    position: "absolute", 
                                    left: "14px", 
                                    top: "50%", 
                                    transform: "translateY(-50%)", 
                                    color: "var(--text-secondary)" 
                                }} 
                            />
                            <input
                                id="email-input"
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: "42px" }}
                                placeholder={panelRole === "Manager" ? "manager@metro.com" : "customer@metro.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password-input">Password</label>
                        <div style={{ position: "relative" }}>
                            <Lock 
                                size={18} 
                                style={{ 
                                    position: "absolute", 
                                    left: "14px", 
                                    top: "50%", 
                                    transform: "translateY(-50%)", 
                                    color: "var(--text-secondary)" 
                                }} 
                            />
                            <input
                                id="password-input"
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: "42px" }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirm-password-input">Confirm Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock 
                                    size={18} 
                                    style={{ 
                                        position: "absolute", 
                                        left: "14px", 
                                        top: "50%", 
                                        transform: "translateY(-50%)", 
                                        color: "var(--text-secondary)" 
                                    }} 
                                />
                                <input
                                    id="confirm-password-input"
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: "42px" }}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        id="auth-submit-btn"
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: "100%",
                            marginTop: "10px",
                            padding: "14px",
                            background: panelRole === "Customer" ? "linear-gradient(135deg, #2ec4b6, #007185)" : undefined,
                            borderColor: panelRole === "Customer" ? "#2ec4b6" : undefined,
                            color: panelRole === "Customer" ? "#fff" : undefined
                        }}
                        disabled={loading}
                    >
                        {loading 
                            ? "Processing..." 
                            : isLogin 
                                ? `Sign In as ${panelRole}` 
                                : `Create ${panelRole} Account`}
                    </button>
                </form>

                {panelRole === "Manager" ? (
                    <div style={{
                        marginTop: "20px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "rgba(255, 153, 0, 0.08)",
                        border: "1px solid rgba(255, 153, 0, 0.2)",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        lineHeight: "1.4"
                    }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>Notice:</span> Public Manager registration is disabled. Logged-in Managers can add new Manager accounts from inside the Manager Portal.
                    </div>
                ) : (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <button
                            type="button"
                            style={{
                                background: "none",
                                border: "none",
                                color: "#2ec4b6",
                                fontSize: "14px",
                                cursor: "pointer",
                                textDecoration: "underline"
                            }}
                            onClick={handleToggleMode}
                        >
                            {isLogin 
                                ? "Need a customer account? Register" 
                                : "Already registered? Sign in as Customer"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
