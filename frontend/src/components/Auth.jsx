import { useState } from "react";
import { api } from "../api";
import { Mail, Lock, User, Store } from "lucide-react";

export default function Auth({ onAuthSuccess, addToast }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            addToast("Please fill in all required fields", "error");
            return;
        }

        if (!isLogin && !name) {
            addToast("Please enter your name", "error");
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const response = await api.login({ email, password });
                addToast(`Welcome back, ${response.user.name}!`, "success");
                onAuthSuccess(response.token, response.user);
            } else {
                const response = await api.register({ name, email, password });
                addToast("Account created successfully!", "success");
                onAuthSuccess(response.token, response.user);
            }
        } catch (err) {
            addToast(err.message || "Authentication failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Store size={30} />
                    </div>
                    <h1 className="auth-title">MetroRetail</h1>
                    <p className="auth-subtitle">
                        {isLogin 
                            ? "Multi-branch Inventory & Sales Dashboard" 
                            : "Create manager account to manage outlets"}
                    </p>
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
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ paddingLeft: "42px" }}
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
                                placeholder="manager@retail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: "42px" }}
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: "42px" }}
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
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ paddingLeft: "42px" }}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        id="auth-submit-btn"
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={loading}
                    >
                        {loading 
                            ? "Please wait..." 
                            : isLogin 
                                ? "Sign In to Dashboard" 
                                : "Create Manager Account"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                        {isLogin ? "New to MetroRetail? " : "Already have an account? "}
                    </span>
                    <button
                        id="auth-toggle-btn"
                        type="button"
                        style={{ 
                            background: "none", 
                            border: "none", 
                            color: "var(--color-primary)", 
                            fontWeight: "600", 
                            cursor: "pointer",
                            padding: 0,
                            fontFamily: "var(--font-body)",
                            fontSize: "14px",
                            textDecoration: "underline"
                        }}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setName("");
                            setEmail("");
                            setPassword("");
                            setConfirmPassword("");
                        }}
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}
