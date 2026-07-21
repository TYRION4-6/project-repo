import React, { useState, useEffect } from "react";
import { salesAPI, outletsAPI, productsAPI } from "../api";
import { ShoppingBag, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import RecentSalesFeed from "../components/RecentSalesFeed";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]); // Filtered products for form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Record Sale Form state
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchOutletsAndSales = async () => {
    setLoading(true);
    setError("");
    try {
      const outletsData = await outletsAPI.getAll();
      setOutlets(outletsData);
    } catch (err) {
      setError(err.message || "Failed to load outlet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutletsAndSales();
  }, []);

  // Fetch products when selected outlet changes
  useEffect(() => {
    const loadOutletProducts = async () => {
      if (!selectedOutlet) {
        setProducts([]);
        setSelectedProduct("");
        setSelectedProductData(null);
        return;
      }

      try {
        const data = await productsAPI.getAll(selectedOutlet);
        setProducts(data);
        setSelectedProduct("");
        setSelectedProductData(null);
      } catch (err) {
        console.error("Failed to load products for outlet", err);
      }
    };
    loadOutletProducts();
  }, [selectedOutlet]);

  // Set product details when product selection changes
  useEffect(() => {
    if (!selectedProduct) {
      setSelectedProductData(null);
      return;
    }
    const prod = products.find((p) => p._id === selectedProduct);
    setSelectedProductData(prod || null);
    setQuantity(1);
  }, [selectedProduct, products]);

  const handleRecordSale = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedOutlet || !selectedProduct) {
      setFormError("Please select both outlet and product.");
      return;
    }

    if (!selectedProductData) {
      setFormError("Product details are not loaded.");
      return;
    }

    if (quantity <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }

    if (selectedProductData.stock < quantity) {
      setFormError(
        `Insufficient stock. Available stock: ${selectedProductData.stock}, requested: ${quantity}`
      );
      return;
    }

    setFormLoading(true);
    try {
      const recordedSale = await salesAPI.create({
        product: selectedProduct,
        outlet: selectedOutlet,
        quantity: Number(quantity),
      });

      setFormSuccess(
        `Sale recorded successfully! Product: ${recordedSale.product.name}, Amount: ${formatCurrency(
          recordedSale.totalAmount
        )}`
      );

      // Reset form selection
      setSelectedProduct("");
      setSelectedProductData(null);
      setQuantity(1);
    } catch (err) {
      setFormError(err.message || "Failed to record transaction");
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales & Transaction POS</h1>
          <p className="page-description">Record customer transactions and monitor receipts</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div className="dot" style={{ width: "24px", height: "24px" }}></div>
        </div>
      ) : (
        <div className="grid-cols-2" style={{ gridTemplateColumns: "1fr 1.5fr", alignItems: "start" }}>
          {/* Record Sale Section */}
          <div className="glass-card">
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingBag size={20} style={{ color: "var(--primary)" }} />
              <span>Record New Sale</span>
            </h3>

            {formError && (
              <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="alert alert-success" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordSale}>
              <div className="form-group">
                <label htmlFor="sale-outlet">Select Metro Outlet</label>
                <select
                  id="sale-outlet"
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  required
                >
                  <option value="">Select Branch</option>
                  {outlets.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sale-product">Select Product Item</label>
                <select
                  id="sale-product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                  disabled={!selectedOutlet}
                >
                  <option value="">
                    {!selectedOutlet ? "Select Outlet first" : "Select Product"}
                  </option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                      {p.name} {p.stock <= 0 ? "(OUT OF STOCK)" : `(Stock: ${p.stock})`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductData && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>SKU Code:</span>
                    <span style={{ fontWeight: "600", color: "var(--secondary)" }}>{selectedProductData.sku}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Unit Price:</span>
                    <span style={{ fontWeight: "600" }}>{formatCurrency(selectedProductData.price)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Available Stock:</span>
                    <span
                      style={{
                        fontWeight: "600",
                        color: selectedProductData.stock <= 10 ? "var(--accent)" : "var(--success)",
                      }}
                    >
                      {selectedProductData.stock} units
                    </span>
                  </div>
                  <hr style={{ borderColor: "rgba(255, 255, 255, 0.05)", margin: "12px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold" }}>
                    <span>Estimated Total:</span>
                    <span style={{ color: "var(--primary)" }}>
                      {formatCurrency(selectedProductData.price * quantity)}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="sale-qty">Purchase Quantity</label>
                <input
                  id="sale-qty"
                  type="number"
                  min="1"
                  max={selectedProductData ? selectedProductData.stock : 9999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  required
                  disabled={!selectedProduct}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "12px" }}
                disabled={formLoading || !selectedProduct || (selectedProductData && selectedProductData.stock <= 0)}
              >
                {formLoading ? "Recording Transaction..." : "Record Transaction"}
              </button>
            </form>
          </div>

          {/* Live Recent Sales Feed */}
          <RecentSalesFeed />
        </div>
      )}
    </div>
  );
};

export default Sales;
