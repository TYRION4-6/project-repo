import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Zap,
  RefreshCw,
  AlertTriangle,
  KeyRound,
  Building,
} from "lucide-react";
import { api } from "../api";
import "./ManagerLoginForm.css";

export default function ManagerLoginForm({ onAuthSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState(() => localStorage.getItem("metro_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("metro_remember_email"));

  // Validation States
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security Lockout State (brute force protection)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Handle countdown for lockout
  useEffect(() => {
    let timer;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Client-side Validation Logic
  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Work email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid work email address (e.g. manager@metroretail.com)";
    }
    return "";
  };

  const validatePassword = (val) => {
    if (!val) {
      return "Password is required";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  // Password Strength Calculation (Score 0 - 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "#64748b" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 50, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 75, label: "Good", color: "#3b82f6" };
      case 4:
        return { score: 100, label: "Strong", color: "#10b981" };
      default:
        return { score: 10, label: "Weak", color: "#ef4444" };
    }
  };

  const strengthInfo = getPasswordStrength(password);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
    if (serverError) setServerError("");
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
    }
    if (serverError) setServerError("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    // Touch all fields to trigger validation display
    setTouched({ email: true, password: true });

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const res = await api.login(email.trim(), password);

      if (res.error) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLockoutTime(30);
          setServerError("Too many failed attempts. Account temporarily locked for security (30s).");
          setFailedAttempts(0);
        } else {
          setServerError(`${res.error}. Attempts remaining before security cooldown: ${5 - newAttempts}`);
        }
      } else {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("metro_remember_email", email.trim());
        } else {
          localStorage.removeItem("metro_remember_email");
        }

        if (res.token) {
          localStorage.setItem("metro_token", res.token);
        }
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      }
    } catch (err) {
      setServerError("Network error: Unable to reach authentication server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setTouched({ email: true, password: true });
    setErrors({ email: "", password: "" });
    setServerError("");
  };

  const isEmailValid = email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.trim() !== "";
  const isFormValid = isEmailValid && isPasswordValid;

  return (
    <div className="manager-login-card">
      <div className="login-header">
        <div className="security-badge">
          <ShieldCheck size={16} />
          <span>Manager Security Portal</span>
        </div>
        <h2 className="login-title">Secure Manager Login</h2>
        <p className="login-subtitle">Access multi-outlet POS & enterprise inventory dashboard</p>
      </div>

      {/* Lockout Notice */}
      {lockoutTime > 0 && (
        <div className="login-alert warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Security Lockout Active</strong>
            <p>Please wait <strong>{lockoutTime} seconds</strong> before retrying login.</p>
          </div>
        </div>
      )}

      {/* Global Server Error Alert */}
      {serverError && lockoutTime === 0 && (
        <div className="login-alert danger">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="form-field">
          <label htmlFor="manager-email" className="form-label">
            Manager Work Email <span className="required-star">*</span>
          </label>
          <div className={`input-wrapper ${touched.email ? (errors.email ? "is-invalid" : "is-valid") : ""}`}>
            <Mail className="input-icon" size={18} />
            <input
              id="manager-email"
              type="email"
              className="form-input"
              placeholder="manager@metroretail.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur("email")}
              disabled={isSubmitting || lockoutTime > 0}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="username"
            />
            {touched.email && !errors.email && (
              <CheckCircle2 className="valid-icon" size={18} />
            )}
          </div>
          {touched.email && errors.email && (
            <p id="email-error" className="field-error-text">
              <AlertCircle size={13} /> {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="form-field">
          <div className="label-row">
            <label htmlFor="manager-password" className="form-label">
              Password <span className="required-star">*</span>
            </label>
          </div>
          <div className={`input-wrapper ${touched.password ? (errors.password ? "is-invalid" : "is-valid") : ""}`}>
            <Lock className="input-icon" size={18} />
            <input
              id="manager-password"
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Enter manager account password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
              disabled={isSubmitting || lockoutTime > 0}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="strength-bar-container">
              <div className="strength-bar-header">
                <span className="strength-label">Security Strength:</span>
                <span className="strength-text" style={{ color: strengthInfo.color }}>
                  {strengthInfo.label}
                </span>
              </div>
              <div className="strength-track">
                <div
                  className="strength-fill"
                  style={{
                    width: `${strengthInfo.score}%`,
                    backgroundColor: strengthInfo.color,
                  }}
                />
              </div>
            </div>
          )}

          {touched.password && errors.password && (
            <p id="password-error" className="field-error-text">
              <AlertCircle size={13} /> {errors.password}
            </p>
          )}
        </div>

        {/* Remember Email Option */}
        <div className="form-options-row">
          <label className="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting || lockoutTime > 0}
            />
            <span>Remember my email</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={!isFormValid || isSubmitting || lockoutTime > 0}
          title={!isFormValid ? "Please fill in a valid email and password to log in" : ""}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="spinner" size={18} />
              <span>Verifying Manager Credentials...</span>
            </>
          ) : (
            <>
              <KeyRound size={18} />
              <span>Authenticate Manager</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Presets for Testing */}
      <div className="demo-presets-section">
        <div className="preset-divider">
          <span>Quick Demo Manager Credentials</span>
        </div>

        <div className="demo-buttons-grid">
          <button
            type="button"
            className="demo-chip-btn"
            onClick={() => handleDemoFill("manager@metroretail.com", "demo123")}
            disabled={isSubmitting || lockoutTime > 0}
          >
            <Zap size={14} />
            <span>General Manager</span>
          </button>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={() => handleDemoFill("admin@metro.com", "demo123")}
            disabled={isSubmitting || lockoutTime > 0}
          >
            <Building size={14} />
            <span>Admin Outlet Mgr</span>
          </button>
        </div>
      </div>

      {/* Footer link to register */}
      {onSwitchToRegister && (
        <div className="login-footer">
          <p>
            Need a new manager profile?{" "}
            <button type="button" className="text-link" onClick={onSwitchToRegister}>
              Register New Manager
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
