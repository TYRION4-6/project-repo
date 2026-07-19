import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, Calendar, Store, Package, AlertCircle } from "lucide-react";

export default function SalesView({ sales, products, outlets, onCreateSale, loading }) {
  const [formData, setFormData] = useState({
    outletId: "",
    productId: "",
    quantity: "1"
  });

  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [availableStock, setAvailableStock] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync default options when lists load
  useEffect(() => {
    if (outlets.length > 0 && !formData.outletId) {
      setFormData(prev => ({ ...prev, outletId: outlets[0]._id }));
    }
  }, [outlets]);

  useEffect(() => {
    if (products.length > 0 && !formData.productId) {
      setFormData(prev => ({ ...prev, productId: products[0]._id }));
    }
  }, [products]);

  // Track product pricing and available stock when selections change
  useEffect(() => {
    if (!formData.productId || !formData.outletId) {
      setSelectedProductDetails(null);
      setAvailableStock(0);
      return;
    }

    const prod = products.find(p => p._id === formData.productId);
    setSelectedProductDetails(prod);

    if (prod) {
      const stockItem = prod.stock.find(s => s.outletId?._id === formData.outletId || s.outletId === formData.outletId);
      setAvailableStock(stockItem ? stockItem.quantity : 0);
    } else {
      setAvailableStock(0);
    }
    setErrorMsg("");
  }, [formData.productId, formData.outletId, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(formData.quantity);
    if (!formData.outletId || !formData.productId) {
      setErrorMsg("Please select an outlet and product");
      return;
    }
    if (qty <= 0) {
      setErrorMsg("Quantity must be at least 1");
      return;
    }
    if (qty > availableStock) {
      setErrorMsg(`Insufficient stock. Only ${availableStock} units available at this branch.`);
      return;
    }

    onCreateSale(formData);
    setFormData(prev => ({ ...prev, quantity: "1" }));
    setErrorMsg("");
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }} className="charts-grid">
        {/* Record Transaction Panel */}
        <div>
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <ShoppingCart size={18} className="text-muted" style={{ color: "var(--primary-light)" }} />
              <h3 style={{ margin: 0 }}>Record Transaction</h3>
            </div>

            {outlets.length === 0 || products.length === 0 ? (
              <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--warning)" }}>
                  <AlertCircle size={16} />
                  Configure outlets and products first before recording transactions.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Metro Outlet</label>
                  <select 
                    value={formData.outletId} 
                    onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                    required
                  >
                    {outlets.map(outlet => (
                      <option key={outlet._id} value={outlet._id}>
                        {outlet.name} ({outlet.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Product</label>
                  <select 
                    value={formData.productId} 
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductDetails && (
                  <div style={{ 
                    background: "rgba(15, 23, 42, 0.4)", 
                    padding: "12px", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid var(--border-light)",
                    fontSize: "0.88rem"
                  }}>
                    <div className="flex-between" style={{ marginBottom: "6px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Stock at Branch:</span>
                      <span style={{ 
                        fontWeight: 600, 
                        color: availableStock === 0 ? "var(--danger)" : availableStock <= 10 ? "var(--warning)" : "var(--success)" 
                      }}>
                        {availableStock} units
                      </span>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>Unit Price:</span>
                      <span style={{ fontWeight: 600, color: "#fff" }}>
                        {formatCurrency(selectedProductDetails.price)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Quantity to Sell</label>
                  <input 
                    type="number" 
                    min="1"
                    max={availableStock}
                    value={formData.quantity} 
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                    required 
                  />
                </div>

                {selectedProductDetails && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: "12px", marginTop: "4px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Subtotal:</span>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--success)" }}>
                      {formatCurrency(selectedProductDetails.price * (parseInt(formData.quantity) || 0))}
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <p style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} />
                    {errorMsg}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={availableStock === 0 || !formData.productId}
                  style={{ opacity: (availableStock === 0 || !formData.productId) ? 0.5 : 1 }}
                >
                  <Plus size={16} />
                  <span>Log Transaction</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sales Logs */}
        <div className="glass-card">
          <h3 style={{ marginBottom: "16px" }}>Transaction History</h3>
          {loading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading transactions...</p>
          ) : sales.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
              <p>No sales logged in the system yet.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: "420px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Product</th>
                    <th>Branch</th>
                    <th>Qty</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {new Date(sale.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </td>
                      <td>
                        {sale.productId ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#fff" }}>{sale.productId.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{sale.productId.sku}</div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Deleted Product</span>
                        )}
                      </td>
                      <td>
                        {sale.outletId ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{sale.outletId.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sale.outletId.city}</div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Deleted Outlet</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {sale.quantity}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>
                        {formatCurrency(sale.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
