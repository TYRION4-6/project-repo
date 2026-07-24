import React, { useState, useEffect } from "react";
import {
  Building2,
  Package,
  Hash,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Send,
  History,
  Tag,
  DollarSign
} from "lucide-react";
import { api } from "../api";

/**
 * OutletProductEntryForm
 *
 * A comprehensive React component with fields for:
 *  1. Outlet (Branch Selection Dropdown)
 *  2. Product (Inventory Item Selection Dropdown)
 *  3. Quantity (Number Input - positive integers only)
 *  4. Date (Date Picker)
 *
 * Client-Side Validation:
 *  - Prevents negative and zero quantities
 *  - Requires all primary fields (outlet, product, quantity, date)
 *  - Sends POST request to Express backend /api/sales endpoint
 *  - Handles success & error feedback with live receipt details
 */

const DEFAULT_OUTLETS = [
  { _id: "out-1", name: "Downtown Flagship", city: "New York", code: "NYC-01" },
  { _id: "out-2", name: "Westside Hub", city: "Los Angeles", code: "LAX-02" },
  { _id: "out-3", name: "Central Metro Store", city: "Chicago", code: "CHI-03" },
  { _id: "out-4", name: "Bay Area Station", city: "San Francisco", code: "SFO-04" },
];

const DEFAULT_PRODUCTS = [
  { _id: "prod-1", name: "Wireless Ergonomic Mouse", category: "Electronics", price: 49.99 },
  { _id: "prod-2", name: "Mechanical Gaming Keyboard", category: "Electronics", price: 129.99 },
  { _id: "prod-3", name: "Ultra-Wide 4K Monitor", category: "Displays", price: 399.00 },
  { _id: "prod-4", name: "USB-C Multi-Port Hub", category: "Accessories", price: 29.50 },
  { _id: "prod-5", name: "Noise Cancelling Headphones", category: "Audio", price: 199.99 },
];

export default function OutletProductEntryForm({
  outlets = DEFAULT_OUTLETS,
  products = DEFAULT_PRODUCTS,
  onSubmit,
}) {
  const activeOutlets = outlets && outlets.length > 0 ? outlets : DEFAULT_OUTLETS;
  const activeProducts = products && products.length > 0 ? products : DEFAULT_PRODUCTS;

  // Form State
  const [outletId, setOutletId] = useState(activeOutlets[0]?._id || "");
  const [productId, setProductId] = useState(activeProducts[0]?._id || "");
  const [quantity, setQuantity] = useState(1);
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // History log of submitted entries
  const [history, setHistory] = useState([]);

  // Auto-sync initial selection if props change
  useEffect(() => {
    if (activeOutlets.length > 0 && !outletId) {
      setOutletId(activeOutlets[0]._id);
    }
  }, [activeOutlets, outletId]);

  useEffect(() => {
    if (activeProducts.length > 0 && !productId) {
      setProductId(activeProducts[0]._id);
    }
  }, [activeProducts, productId]);

  const selectedOutlet = activeOutlets.find((o) => o._id === outletId) || activeOutlets[0];
  const selectedProduct = activeProducts.find((p) => p._id === productId) || activeProducts[0];

  const unitPrice = selectedProduct?.price || 0;
  const totalAmount = unitPrice * (parseInt(quantity, 10) || 0);

  // Quick Date Helpers
  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setEntryDate(today);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setEntryDate(d.toISOString().split("T")[0]);
  };

  // Quantity Stepper & Negative Quantity Prevention
  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else {
      setQuantity(num);
    }
  };

  const handleAdjustQuantity = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  // Form Reset
  const handleReset = () => {
    setOutletId(activeOutlets[0]?._id || "");
    setProductId(activeProducts[0]?._id || "");
    setQuantity(1);
    setEntryDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Form Submit Handler with Client-Side Validation & Express API Call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // 1. Client-Side Required Fields Validation
    if (!outletId || outletId.trim() === "") {
      setErrorMessage("Outlet field is required. Please select a valid branch outlet.");
      return;
    }
    if (!productId || productId.trim() === "") {
      setErrorMessage("Product field is required. Please select a valid product item.");
      return;
    }

    // 2. Client-Side Quantity Validation (Prevent non-positive & negative values)
    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMessage("Quantity must be a positive integer greater than zero.");
      return;
    }

    // 3. Client-Side Date Validation
    if (!entryDate || entryDate.trim() === "") {
      setErrorMessage("Date field is required. Please select a transaction date.");
      return;
    }

    setLoading(true);

    const formData = {
      outletId,
      productId,
      quantity: numQty,
      date: entryDate,
      notes,
    };

    try {
      let apiResult;
      if (onSubmit) {
        apiResult = await onSubmit(formData);
      } else {
        // Direct Express API call
        apiResult = await api.recordSingleSale(formData);
      }

      if (apiResult && apiResult.error) {
        setErrorMessage(`Server Error: ${apiResult.error}`);
      } else {
        const txnId = apiResult?.sale?.saleNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        setSuccessMessage(
          `Transaction [${txnId}] saved! ${numQty} × "${selectedProduct?.name || "Product"}" recorded for ${selectedOutlet?.name || "Outlet"} on ${entryDate}.`
        );

        // Append to local history log
        setHistory((prev) => [
          {
            id: txnId,
            outletName: selectedOutlet?.name || "Outlet",
            productName: selectedProduct?.name || "Product",
            quantity: numQty,
            totalAmount,
            entryDate,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Reset inputs for next entry
        setQuantity(1);
        setNotes("");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to post transaction to Express endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
      {/* Component Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Building2 className="text-indigo" size={26} />
            Outlet Stock & Entry Log Form
          </h2>
          <p>
            Record inventory transactions, stock movements, and sales entries by outlet, product,
            quantity, and date.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleReset}
          type="button"
          title="Reset all form fields"
        >
          <RotateCcw size={15} /> Reset Form
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontWeight: 600,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <CheckCircle2 size={22} style={{ shrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>Entry Successfully Recorded</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{successMessage}</div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontWeight: 600,
          }}
        >
          <AlertCircle size={22} style={{ shrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Layout Grid: Form on Left, Real-time Summary Card on Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Main Input Form */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* 1. OUTLET FIELD */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="outlet-select"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "white",
                  marginBottom: "0.5rem",
                }}
              >
                <Building2 size={16} style={{ color: "#818cf8" }} />
                1. Select Branch Outlet
              </label>
              <select
                id="outlet-select"
                className="select-input"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.95rem",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                }}
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                required
              >
                {activeOutlets.map((out) => (
                  <option key={out._id} value={out._id}>
                    {out.name} {out.city ? `(${out.city})` : ""} {out.code ? `[${out.code}]` : ""}
                  </option>
                ))}
              </select>
              {selectedOutlet && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  <span>📍 Location: {selectedOutlet.city || "N/A"}</span>
                  {selectedOutlet.code && <span>🆔 Branch Code: {selectedOutlet.code}</span>}
                </div>
              )}
            </div>

            {/* 2. PRODUCT FIELD */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="product-select"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "white",
                  marginBottom: "0.5rem",
                }}
              >
                <Package size={16} style={{ color: "#34d399" }} />
                2. Select Product Item
              </label>
              <select
                id="product-select"
                className="select-input"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.95rem",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                }}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {activeProducts.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name} {prod.category ? `• ${prod.category}` : ""}{" "}
                    {prod.price !== undefined ? `($${prod.price.toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                    display: "flex",
                    gap: "1.2rem",
                  }}
                >
                  <span>🏷️ Category: {selectedProduct.category || "General"}</span>
                  <span>💵 Unit Price: ${unitPrice.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* 3. QUANTITY & 4. DATE FIELDS ROW */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* 3. QUANTITY FIELD */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  htmlFor="quantity-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "white",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Hash size={16} style={{ color: "#fbbf24" }} />
                  3. Quantity
                </label>

                {/* Input with Stepper Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="qty-btn"
                    style={{
                      width: "42px",
                      height: "42px",
                      fontSize: "1.1rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "white",
                      cursor: "pointer",
                    }}
                    onClick={() => handleAdjustQuantity(-1)}
                    disabled={quantity <= 1}
                    title="Decrease Quantity"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    id="quantity-input"
                    type="number"
                    min="1"
                    className="text-input"
                    style={{
                      textAlign: "center",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      padding: "0.6rem",
                      flex: 1,
                    }}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="qty-btn"
                    style={{
                      width: "42px",
                      height: "42px",
                      fontSize: "1.1rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "white",
                      cursor: "pointer",
                    }}
                    onClick={() => handleAdjustQuantity(1)}
                    title="Increase Quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Quick Presets */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginTop: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Quick:</span>
                  {[1, 5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      style={{
                        padding: "0.15rem 0.45rem",
                        fontSize: "0.72rem",
                        borderRadius: "var(--radius-sm)",
                        background:
                          quantity === preset ? "var(--primary)" : "rgba(255, 255, 255, 0.06)",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: quantity === preset ? 700 : 500,
                      }}
                      onClick={() => setQuantity(preset)}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. DATE FIELD */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  htmlFor="date-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "white",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Calendar size={16} style={{ color: "#60a5fa" }} />
                  4. Transaction Date
                </label>

                <input
                  id="date-input"
                  type="date"
                  className="text-input"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    fontSize: "0.95rem",
                    background: "var(--bg-surface)",
                    color: "white",
                    borderRadius: "var(--radius-md)",
                  }}
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />

                {/* Quick Date Selectors */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.73rem",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(99, 102, 241, 0.18)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={handleSetToday}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.73rem",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                    }}
                    onClick={handleSetYesterday}
                  >
                    Yesterday
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Notes / Remarks */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="notes-input"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}
              >
                Optional Reference / Remarks
              </label>
              <input
                id="notes-input"
                type="text"
                className="text-input"
                placeholder="e.g. Stock Transfer Ref #8492 or Shift Batch 2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              {loading ? (
                "Processing Entry..."
              ) : (
                <>
                  <Send size={18} /> Submit Entry Log
                </>
              )}
            </button>
          </form>
        </div>

        {/* Real-time Summary Card & History Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary Preview Box */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "white",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Tag size={18} className="text-indigo" /> Entry Live Preview
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                fontSize: "0.88rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed var(--border-color)",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Target Outlet:</span>
                <span style={{ fontWeight: 700, color: "white" }}>
                  {selectedOutlet?.name || "N/A"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed var(--border-color)",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Product:</span>
                <span style={{ fontWeight: 700, color: "#818cf8" }}>
                  {selectedProduct?.name || "N/A"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed var(--border-color)",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Quantity:</span>
                <span style={{ fontWeight: 800, color: "#fbbf24" }}>{quantity} units</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed var(--border-color)",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Transaction Date:</span>
                <span style={{ fontWeight: 700, color: "#60a5fa" }}>{entryDate}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.5rem",
                  paddingTop: "0.5rem",
                }}
              >
                <span style={{ color: "white", fontWeight: 700 }}>Total Value:</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Submission History Log */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.85rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <History size={16} style={{ color: "#a5b4fc" }} /> Session Log ({history.length})
              </h4>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "1rem 0",
                }}
              >
                Submitted form entries will appear here.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  maxHeight: "240px",
                  overflowY: "auto",
                }}
              >
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.65rem 0.85rem",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "white", marginBottom: "0.2rem" }}>
                      {item.productName} ({item.quantity}x)
                    </div>
                    <div style={{ color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>🏢 {item.outletName}</span>
                      <span>📅 {item.entryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
