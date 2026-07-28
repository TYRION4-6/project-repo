import { useState } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, Search, X, Package, AlertTriangle, RefreshCw } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";

export default function InventoryView({ products = [], outlets = [], token, refreshData, addToast }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterOutlet, setFilterOutlet] = useState("");
    const [filterLowStock, setFilterLowStock] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newStockVal, setNewStockVal] = useState("");
    const [loading, setLoading] = useState(false);
    const [detailProduct, setDetailProduct] = useState(null);

    const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

    const filteredProducts = products.filter((p) => {
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || p.category === filterCategory;
        const matchesOutlet = !filterOutlet || p.outlet === filterOutlet || (p.outlet && p.outlet._id === filterOutlet);
        const stock = p.stockLevel !== undefined ? p.stockLevel : 20;
        const thresh = p.lowStockAlertThreshold || 10;
        const matchesLowStock = !filterLowStock || stock <= thresh;
        return matchesSearch && matchesCategory && matchesOutlet && matchesLowStock;
    });

    const openRefillModal = (p) => {
        setSelectedProduct(p);
        setNewStockVal(p.stockLevel !== undefined ? p.stockLevel : 20);
        setModalOpen(true);
    };

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        setLoading(true);
        try {
            const targetOutlet = selectedProduct.outlet?._id || selectedProduct.outlet || (outlets[0] ? outlets[0]._id : "out_1");
            await api.stockUpdate({
                outletId: targetOutlet,
                productId: selectedProduct._id,
                newStock: Number(newStockVal),
            }, token);

            addToast(`Stock for ${selectedProduct.name} updated to ${newStockVal} units`, "success");
            setModalOpen(false);
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Failed to update stock", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Inventory & Stock Tracking</h2>
                    <p className="page-subtitle">Monitor stock quantities, low-stock thresholds, and trigger quick refills</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card-panel" style={{ marginBottom: "24px", padding: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input 
                            type="text" 
                            className="form-input" 
                            style={{ paddingLeft: "42px" }}
                            placeholder="Filter by product name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select 
                        className="form-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select 
                        className="form-select"
                        value={filterOutlet}
                        onChange={(e) => setFilterOutlet(e.target.value)}
                    >
                        <option value="">All Outlets</option>
                        {outlets.map((o) => (
                            <option key={o._id} value={o._id}>{o.name}</option>
                        ))}
                    </select>
                    <button 
                        className={`btn ${filterLowStock ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        style={{ height: "42px" }}
                    >
                        <AlertTriangle size={16} />
                        {filterLowStock ? "Showing Low Stock" : "Filter Low Stock"}
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="table-wrapper card-panel" style={{ padding: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Branch</th>
                            <th>Stock Quantity</th>
                            <th>Threshold</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Refill Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                    No inventory items match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((p) => {
                                const stock = p.stockLevel !== undefined ? p.stockLevel : 20;
                                const thresh = p.lowStockAlertThreshold || 10;
                                const isOut = stock === 0;
                                const isLow = stock > 0 && stock <= thresh;

                                return (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); setDetailProduct(p); }} style={{ color: "inherit", textDecoration: "none" }}>
                                                {p.name}
                                            </a>
                                        </td>
                                        <td><code className="pm-sku-code">{p.sku}</code></td>
                                        <td><span className="badge badge-success">{p.category}</span></td>
                                        <td>{p.outlet?.name || "Shipbasket Branch"}</td>
                                        <td style={{ fontWeight: "700", color: isOut ? "var(--color-danger)" : isLow ? "var(--color-warning)" : "var(--color-success)" }}>
                                            {stock} units
                                        </td>
                                        <td>{thresh} units</td>
                                        <td>
                                            <span className={`badge ${isOut ? "badge-danger" : isLow ? "badge-warning" : "badge-success"}`}>
                                                {isOut ? "CRITICAL OUT" : isLow ? "LOW STOCK" : "OPTIMAL"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => openRefillModal(p)}>
                                                <RefreshCw size={14} /> Refill Stock
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Refill Modal */}
            {modalOpen && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <div className="modal-header">
                            <h3>Refill Stock Level</h3>
                            <button type="button" style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => setModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleStockUpdate}>
                            <div className="modal-body">
                                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                                    Updating inventory for <strong>{selectedProduct.name}</strong> ({selectedProduct.sku})
                                </p>
                                <div className="form-group">
                                    <label className="form-label">New Stock Quantity (units)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={newStockVal}
                                        onChange={(e) => setNewStockVal(e.target.value)}
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Updating..." : "Save Stock"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {detailProduct && (
                <ProductDetailModal 
                    product={detailProduct} 
                    isOpen={!!detailProduct} 
                    onClose={() => setDetailProduct(null)} 
                />
            )}
        </div>
    );
}
