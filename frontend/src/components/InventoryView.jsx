import { useState } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, Search, X, Package, AlertTriangle } from "lucide-react";

export default function InventoryView({ products, outlets, token, refreshData, addToast }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null); // If not null, editing this product
    
    // Form states
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stockLevel, setStockLevel] = useState("");
    const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState("10");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [loading, setLoading] = useState(false);

    // Filters state
    const [filterOutlet, setFilterOutlet] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Get unique categories list from existing products for filtering
    const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

    const openAddModal = () => {
        setEditProduct(null);
        setName("");
        setSku("");
        setCategory("");
        setPrice("");
        setStockLevel("");
        setLowStockAlertThreshold("10");
        setSelectedOutlet(outlets[0]?._id || "");
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditProduct(product);
        setName(product.name);
        setSku(product.sku);
        setCategory(product.category);
        setPrice(product.price);
        setStockLevel(product.stockLevel);
        setLowStockAlertThreshold(product.lowStockAlertThreshold !== undefined ? product.lowStockAlertThreshold : "10");
        setSelectedOutlet(product.outlet?._id || product.outlet || "");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !sku || !category || price === "" || stockLevel === "" || !selectedOutlet) {
            addToast("Please fill in all required fields", "warning");
            return;
        }

        const productData = {
            name,
            sku,
            category,
            price: Number(price),
            stockLevel: Number(stockLevel),
            lowStockAlertThreshold: Number(lowStockAlertThreshold),
            outlet: selectedOutlet
        };

        setLoading(true);
        try {
            if (editProduct) {
                await api.updateProduct(editProduct._id, productData, token);
                addToast("Product updated successfully", "success");
            } else {
                await api.createProduct(productData, token);
                addToast("Product added to inventory", "success");
            }
            setModalOpen(false);
            refreshData();
        } catch (err) {
            addToast(err.message || "Failed to save product", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteProduct(id, token);
            addToast("Product removed from inventory", "success");
            setDeleteConfirmId(null);
            refreshData();
        } catch (err) {
            addToast(err.message || "Failed to delete product", "error");
        }
    };

    // Client-side filtering logic
    const filteredProducts = products.filter((product) => {
        // Outlet filter
        if (filterOutlet && product.outlet?._id !== filterOutlet && product.outlet !== filterOutlet) {
            return false;
        }
        // Category filter
        if (filterCategory && product.category !== filterCategory) {
            return false;
        }
        // Low Stock filter
        if (filterLowStock) {
            const threshold = product.lowStockAlertThreshold !== undefined ? product.lowStockAlertThreshold : 10;
            if (product.stockLevel > threshold) return false;
        }
        // Search query (Name or SKU)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(q);
            const skuMatch = product.sku.toLowerCase().includes(q);
            if (!nameMatch && !skuMatch) return false;
        }
        return true;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Inventory Management</h2>
                    <p className="page-subtitle">Track, update, and manage stock levels of products across outlet branches</p>
                </div>
                <button 
                    id="add-product-btn"
                    className="btn btn-primary" 
                    onClick={openAddModal}
                    disabled={outlets.length === 0}
                >
                    <Plus size={18} />
                    New Product
                </button>
            </div>

            {outlets.length === 0 ? (
                <div className="card-panel empty-state">
                    <AlertTriangle className="empty-state-icon text-warning" size={60} />
                    <h2>Setup Outlets First</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                        You must add at least one outlet branch before you can add products to inventory.
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters Toolbar */}
                    <div className="card-panel mb-4" style={{ padding: "16px 24px" }} id="inventory-filters">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                            {/* Search */}
                            <div style={{ flexGrow: 1, minWidth: "240px", position: "relative" }}>
                                <Search 
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
                                    id="search-products-input"
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by Product Name or SKU..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>

                            {/* Outlet Filter */}
                            <div style={{ minWidth: "180px" }}>
                                <select
                                    id="filter-outlet-select"
                                    className="form-select"
                                    value={filterOutlet}
                                    onChange={(e) => setFilterOutlet(e.target.value)}
                                >
                                    <option value="">All Outlets</option>
                                    {outlets.map((o) => (
                                        <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div style={{ minWidth: "160px" }}>
                                <select
                                    id="filter-category-select"
                                    className="form-select"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Low Stock Status Toggle */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                    id="filter-low-stock-checkbox"
                                    type="checkbox"
                                    checked={filterLowStock}
                                    onChange={(e) => setFilterLowStock(e.target.checked)}
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "4px",
                                        accentColor: "var(--color-primary)",
                                        cursor: "pointer",
                                        marginTop: 0
                                    }}
                                />
                                <label 
                                    htmlFor="filter-low-stock-checkbox"
                                    style={{ 
                                        fontSize: "14px", 
                                        color: "var(--text-secondary)", 
                                        cursor: "pointer", 
                                        userSelect: "none",
                                        fontWeight: "500"
                                    }}
                                >
                                    Low Stock Alerts
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    {filteredProducts.length === 0 ? (
                        <div className="card-panel empty-state">
                            <Package className="empty-state-icon" size={60} />
                            <h2>No Products Found</h2>
                            <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                                No products match your search or filter criteria. Add a product or clear the filters to view items.
                            </p>
                            {(searchQuery || filterOutlet || filterCategory || filterLowStock) && (
                                <button
                                    id="clear-filters-btn"
                                    className="btn btn-secondary mt-4"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterOutlet("");
                                        setFilterCategory("");
                                        setFilterLowStock(false);
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-wrapper card-panel" style={{ padding: 0 }} id="inventory-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product Details</th>
                                        <th>SKU</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock Level</th>
                                        <th>Branch Outlet</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => {
                                        const isLowStock = product.stockLevel <= (product.lowStockAlertThreshold !== undefined ? product.lowStockAlertThreshold : 10);
                                        return (
                                            <tr key={product._id}>
                                                <td style={{ fontWeight: "600", color: "white" }}>
                                                    {product.name}
                                                </td>
                                                <td>{product.sku}</td>
                                                <td>
                                                    <span className="badge badge-success" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: "600", color: "white" }}>
                                                    {formatCurrency(product.price)}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontWeight: "600", color: isLowStock ? "var(--color-danger)" : "white" }}>
                                                            {product.stockLevel} units
                                                        </span>
                                                        {isLowStock && (
                                                            <span className={`badge ${product.stockLevel === 0 ? "badge-danger" : "badge-warning"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                                                {product.stockLevel === 0 ? "Out of Stock" : "Low Stock"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {product.outlet?.name || "N/A"}
                                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                        {product.outlet?.city || ""}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ padding: "6px 10px", fontSize: "13px" }}
                                                            onClick={() => openEditModal(product)}
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                        <button 
                                                            className="btn btn-danger" 
                                                            style={{ padding: "6px 10px", fontSize: "13px" }}
                                                            onClick={() => setDeleteConfirmId(product._id)}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Product Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editProduct ? "Edit Product Inventory" : "Add Product to Outlet"}</h3>
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
                                    <label className="form-label" htmlFor="product-name-input">Product Name</label>
                                    <input 
                                        id="product-name-input"
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Sony WH-1000XM5"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid-cols-2">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="product-sku-input">SKU Code</label>
                                        <input 
                                            id="product-sku-input"
                                            type="text" 
                                            className="form-input" 
                                            placeholder="e.g. SNY-WH1000-B"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="product-category-input">Category</label>
                                        <input 
                                            id="product-category-input"
                                            type="text" 
                                            className="form-input" 
                                            placeholder="e.g. Electronics"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="product-price-input">Price (INR)</label>
                                        <input 
                                            id="product-price-input"
                                            type="number" 
                                            className="form-input" 
                                            placeholder="29990"
                                            min="0"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="product-stock-input">Stock Level</label>
                                        <input 
                                            id="product-stock-input"
                                            type="number" 
                                            className="form-input" 
                                            placeholder="50"
                                            min="0"
                                            value={stockLevel}
                                            onChange={(e) => setStockLevel(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="product-threshold-input">Low Threshold</label>
                                        <input 
                                            id="product-threshold-input"
                                            type="number" 
                                            className="form-input" 
                                            placeholder="10"
                                            min="0"
                                            value={lowStockAlertThreshold}
                                            onChange={(e) => setLowStockAlertThreshold(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="product-outlet-select">Outlet Branch</label>
                                    <select
                                        id="product-outlet-select"
                                        className="form-select"
                                        value={selectedOutlet}
                                        onChange={(e) => setSelectedOutlet(e.target.value)}
                                        required
                                        disabled={!!editProduct} // SKU uniqueness is tied to outlet, lock it on edit to prevent complications
                                    >
                                        {outlets.map((o) => (
                                            <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                        ))}
                                    </select>
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
                                    id="product-submit-btn"
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : editProduct ? "Update Product" : "Add Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "420px" }}>
                        <div className="modal-header" style={{ borderBottom: "none" }}>
                            <h3 className="text-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Trash2 size={20} />
                                Remove Product?
                            </h3>
                        </div>
                        <div className="modal-body" style={{ paddingTop: 0 }}>
                            <p style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                Are you sure you want to remove this product from inventory? This action is permanent.
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
                                id="delete-product-confirm-btn"
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
