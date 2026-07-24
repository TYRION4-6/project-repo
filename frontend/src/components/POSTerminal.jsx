import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { api } from "../api";

export default function POSTerminal({ outlets, products, onSaleSuccess }) {
  const [selectedOutletId, setSelectedOutletId] = useState(outlets[0] ? outlets[0]._id : "");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const addToCart = (product) => {
    // Check if item already in cart
    const existing = cart.find((item) => item.productId === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedOutletId) {
      alert("Please select an outlet branch!");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty! Add products first.");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      const res = await api.recordSale({
        outletId: selectedOutletId,
        items: cart,
        paymentMethod,
        customerPhone,
      });

      if (res.error) {
        alert("Transaction failed: " + res.error);
      } else {
        setSuccessMsg(`Receipt ${res.sale.saleNumber} generated! Inventory stock synced real-time.`);
        setCart([]);
        onSaleSuccess();
      }
    } catch (err) {
      alert("Failed to process sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Real-Time Sales Terminal (POS)</h2>
          <p>Record counter sales with automated real-time inventory stock deduction</p>
        </div>

        <div className="filter-controls">
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Active Branch:
          </label>
          <select
            className="select-input"
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
          >
            {outlets.map((out) => (
              <option key={out._id} value={out._id}>
                {out.name} ({out.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="pos-container">
        {/* Products Selection Grid */}
        <div>
          <h3 style={{ color: "white", fontSize: "1.1rem", marginBottom: "1rem" }}>
            Select Product to Add to Receipt
          </h3>
          <div className="products-selection-grid">
            {products.map((prod) => (
              <div
                key={prod._id}
                className="pos-product-card"
                onClick={() => addToCart(prod)}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>
                    {prod.category}
                  </div>
                  <div style={{ color: "white", fontWeight: 700, marginTop: "0.25rem" }}>
                    {prod.name}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "0.75rem",
                  }}
                >
                  <span style={{ color: "#34d399", fontWeight: 800 }}>
                    ₹{prod.price.toLocaleString("en-IN")}
                  </span>
                  <button className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Cart & Receipt Panel */}
        <div className="pos-cart-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "white", fontWeight: 700, fontSize: "1.1rem" }}>
            <ShoppingCart size={20} className="text-indigo" />
            <span>Current Transaction Cart</span>
          </div>

          {cart.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Click products on the left to add them to the sale receipt.
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div className="cart-item" key={item.productId}>
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: "0.85rem" }}>
                        {item.productName}
                      </div>
                      <div style={{ color: "#34d399", fontSize: "0.78rem" }}>
                        ₹{item.unitPrice} × {item.quantity} = ₹{item.unitPrice * item.quantity}
                      </div>
                    </div>

                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(item.productId, -1)}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                        {item.quantity}
                      </span>
                      <button className="qty-btn" onClick={() => updateQty(item.productId, 1)}>
                        <Plus size={12} />
                      </button>
                      <button
                        style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", marginLeft: "0.25rem" }}
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  <span>GST (18% Approx)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>
                  <span>Grand Total</span>
                  <span style={{ color: "#34d399" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash Payment</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Customer Mobile (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Syncing Inventory & Processing..." : "Complete & Print Receipt"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
