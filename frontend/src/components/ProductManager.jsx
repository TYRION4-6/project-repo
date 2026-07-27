import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, X, Package, AlertTriangle, ChevronLeft, ChevronRight, Store } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function ProductManager({ outlets, token, refreshData, addToast }) {
    // Paginated product data (separate from parent's products)
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: ITEMS_PER_PAGE });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Outlet filter
    const [filterOutlet, setFilterOutlet] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    // Form states
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stockLevel, setStockLevel] = useState("");
    const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState("10");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    // Validation errors
    const [fieldErrors, setFieldErrors] = useState({});

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Fetch paginated products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const filters = { page: currentPage, limit: ITEMS_PER_PAGE };
            if (filterOutlet) filters.outlet = filterOutlet;

            const data = await api.getProductsPaginated(filters, token);
            if (data.products && data.pagination) {
                setProducts(data.products);
                setPagination(data.pagination);
            } else {
                // Fallback for unexpected response shape
                setProducts(Array.isArray(data) ? data : []);
                setPagination({ page: 1, pages: 1, total: 0, limit: ITEMS_PER_PAGE });
            }
        } catch (err) {
            addToast(err.message || "Failed to load products", "error");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterOutlet, token, addToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Reset to page 1 when outlet filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterOutlet]);

    // Validation
    function validateForm() {
        const errors = {};
        if (!name.trim()) errors.name = "Product name is required";
        if (!sku.trim()) errors.sku = "SKU code is required";
        if (!category.trim()) errors.category = "Category is required";
        if (price === "" || Number(price) < 0) errors.price = "Valid price is required";
        if (stockLevel === "" || Number(stockLevel) < 0) errors.stockLevel = "Valid stock level is required";
        if (!selectedOutlet) errors.outlet = "Please select an outlet";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function openAddModal() {
        setEditProduct(null);
        setName("");
        setSku("");
        setCategory("");
        setPrice("");
        setStockLevel("");
        setLowStockAlertThreshold("10");
        setSelectedOutlet(outlets[0]?._id || "");
        setFieldErrors({});
        setModalOpen(true);
    }

    function openEditModal(product) {
        setEditProduct(product);
        setName(product.name);
        setSku(product.sku);
        setCategory(product.category);
        setPrice(product.price);
        setStockLevel(product.stockLevel);
        setLowStockAlertThreshold(product.lowStockAlertThreshold !== undefined ? product.lowStockAlertThreshold : "10");
        setSelectedOutlet(product.outlet?._id || product.outlet || "");
        setFieldErrors({});
        setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm()) {
            addToast("Please fix the highlighted fields", "warning");
            return;
        }

        const productData = {
            name: name.trim(),
            sku: sku.trim(),
            category: category.trim(),
            price: Number(price),
            stockLevel: Number(stockLevel),
            lowStockAlertThreshold: Number(lowStockAlertThreshold),
            outlet: selectedOutlet
        };

        setFormLoading(true);
        try {
            if (editProduct) {
                await api.updateProduct(editProduct._id, productData, token);
                addToast("Product updated successfully", "success");
            } else {
                await api.createProduct(productData, token);
                addToast("Product added successfully", "success");
            }
            setModalOpen(false);
            fetchProducts();
            refreshData(); // Refresh parent data for dashboard/POS sync
        } catch (err) {
            addToast(err.message || "Failed to save product", "error");
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDelete(id) {
        try {
            await api.deleteProduct(id, token);
            addToast("Product deleted successfully", "success");
            setDeleteTarget(null);
            // If last item on page, go back
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage((p) => p - 1);
            } else {
                fetchProducts();
            }
            refreshData();
        } catch (err) {
            addToast(err.message || "Failed to delete product", "error");
            setDeleteTarget(null);
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function getStockBadge(product) {
        const threshold = product.lowStockAlertThreshold !== undefined ? product.lowStockAlertThreshold : 10;
        if (product.stockLevel === 0) return <span className="badge badge-danger">Out of Stock</span>;
        if (product.stockLevel <= threshold) return <span className="badge badge-warning">Low Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
    }

    // Pagination helpers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    const visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Products</h2>
                    <p className="page-subtitle">
                        View, add, edit, and delete products across your outlet branches
                    </p>
                </div>
                <button
                    id="add-product-btn"
                    className="btn btn-primary"
                    onClick={openAddModal}
                    disabled={outlets.length === 0}
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {outlets.length === 0 ? (
                <div className="card-panel empty-state">
                    <AlertTriangle className="empty-state-icon text-warning" size={60} />
                    <h2>Setup Outlets First</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                        You must add at least one outlet branch before you can manage products.
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters Toolbar */}
                    <div className="card-panel mb-4" style={{ padding: "16px 24px" }} id="products-filters">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                                {/* Outlet Filter */}
                                <div style={{ minWidth: "200px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Store size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                                    <select
                                        id="products-filter-outlet"
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
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>
                                {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    {loading ? (
                        <div className="card-panel" style={{ padding: "60px 24px", textAlign: "center" }}>
                            <div className="pm-loader">
                                <div className="pm-loader-dot" style={{ animationDelay: "0s" }} />
                                <div className="pm-loader-dot" style={{ animationDelay: "0.15s" }} />
                                <div className="pm-loader-dot" style={{ animationDelay: "0.3s" }} />
                            </div>
                            <p style={{ color: "var(--text-secondary)", marginTop: "16px", fontSize: "14px" }}>
                                Loading products...
                            </p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="card-panel empty-state">
                            <Package className="empty-state-icon" size={60} />
                            <h2>No Products Found</h2>
                            <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                                {filterOutlet
                                    ? "No products found for this outlet. Try selecting a different outlet or add a new product."
                                    : "No products yet. Click \"Add Product\" to create your first product."
                                }
                            </p>
                            {filterOutlet && (
                                <button
                                    id="products-clear-filter-btn"
                                    className="btn btn-secondary mt-4"
                                    onClick={() => setFilterOutlet("")}
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-wrapper card-panel" style={{ padding: 0 }} id="products-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>SKU</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Outlet</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product._id}>
                                            <td style={{ fontWeight: "600", color: "white" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div className="pm-product-icon">
                                                        <Package size={14} />
                                                    </div>
                                                    <div>
                                                        <div>{product.name}</div>
                                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400", marginTop: "2px" }}>
                                                            {product.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="pm-sku-code">{product.sku}</code>
                                            </td>
                                            <td style={{ fontWeight: "600", color: "white" }}>
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontWeight: "600",
                                                    color: product.stockLevel <= (product.lowStockAlertThreshold || 10)
                                                        ? "var(--color-danger)" : "white"
                                                }}>
                                                    {product.stockLevel} units
                                                </span>
                                            </td>
                                            <td>
                                                {product.outlet?.name || "N/A"}
                                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                    {product.outlet?.city || ""}
                                                </div>
                                            </td>
                                            <td>{getStockBadge(product)}</td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: "6px 10px", fontSize: "13px" }}
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit product"
                                                    >
                                                        <Edit size={12} />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: "6px 10px", fontSize: "13px" }}
                                                        onClick={() => setDeleteTarget(product)}
                                                        title="Delete product"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {pagination.pages > 1 && (
                                <div className="pm-pagination">
                                    <span className="pm-pagination-info">
                                        Showing {((currentPage - 1) * pagination.limit) + 1}–{Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}
                                    </span>
                                    <div className="pm-pagination-controls">
                                        <button
                                            type="button"
                                            className="pm-page-btn"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                            title="Previous page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {startPage > 1 && (
                                            <>
                                                <button type="button" className="pm-page-btn" onClick={() => setCurrentPage(1)}>1</button>
                                                {startPage > 2 && <span className="pm-page-ellipsis">…</span>}
                                            </>
                                        )}

                                        {visiblePages.map((p) => (
                                            <button
                                                type="button"
                                                key={p}
                                                className={`pm-page-btn ${p === currentPage ? "active" : ""}`}
                                                onClick={() => setCurrentPage(p)}
                                            >
                                                {p}
                                            </button>
                                        ))}

                                        {endPage < pagination.pages && (
                                            <>
                                                {endPage < pagination.pages - 1 && <span className="pm-page-ellipsis">…</span>}
                                                <button type="button" className="pm-page-btn" onClick={() => setCurrentPage(pagination.pages)}>
                                                    {pagination.pages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            type="button"
                                            className="pm-page-btn"
                                            disabled={currentPage >= pagination.pages}
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            title="Next page"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Product Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editProduct ? "Edit Product" : "Add New Product"}</h3>
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
                                    <label className="form-label" htmlFor="pm-name-input">Product Name</label>
                                    <input
                                        id="pm-name-input"
                                        type="text"
                                        className={`form-input ${fieldErrors.name ? "input-error" : ""}`}
                                        placeholder="e.g. Sony WH-1000XM5"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
                                    />
                                    {fieldErrors.name && <span className="pm-field-error">{fieldErrors.name}</span>}
                                </div>

                                <div className="grid-cols-2">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pm-sku-input">SKU Code</label>
                                        <input
                                            id="pm-sku-input"
                                            type="text"
                                            className={`form-input ${fieldErrors.sku ? "input-error" : ""}`}
                                            placeholder="e.g. SNY-WH1000-B"
                                            value={sku}
                                            onChange={(e) => { setSku(e.target.value); setFieldErrors((prev) => ({ ...prev, sku: undefined })); }}
                                        />
                                        {fieldErrors.sku && <span className="pm-field-error">{fieldErrors.sku}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pm-category-input">Category</label>
                                        <input
                                            id="pm-category-input"
                                            type="text"
                                            className={`form-input ${fieldErrors.category ? "input-error" : ""}`}
                                            placeholder="e.g. Electronics"
                                            value={category}
                                            onChange={(e) => { setCategory(e.target.value); setFieldErrors((prev) => ({ ...prev, category: undefined })); }}
                                        />
                                        {fieldErrors.category && <span className="pm-field-error">{fieldErrors.category}</span>}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pm-price-input">Price (INR)</label>
                                        <input
                                            id="pm-price-input"
                                            type="number"
                                            className={`form-input ${fieldErrors.price ? "input-error" : ""}`}
                                            placeholder="29990"
                                            min="0"
                                            value={price}
                                            onChange={(e) => { setPrice(e.target.value); setFieldErrors((prev) => ({ ...prev, price: undefined })); }}
                                        />
                                        {fieldErrors.price && <span className="pm-field-error">{fieldErrors.price}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pm-stock-input">Stock Level</label>
                                        <input
                                            id="pm-stock-input"
                                            type="number"
                                            className={`form-input ${fieldErrors.stockLevel ? "input-error" : ""}`}
                                            placeholder="50"
                                            min="0"
                                            value={stockLevel}
                                            onChange={(e) => { setStockLevel(e.target.value); setFieldErrors((prev) => ({ ...prev, stockLevel: undefined })); }}
                                        />
                                        {fieldErrors.stockLevel && <span className="pm-field-error">{fieldErrors.stockLevel}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pm-threshold-input">Low Alert</label>
                                        <input
                                            id="pm-threshold-input"
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
                                    <label className="form-label" htmlFor="pm-outlet-select">Outlet Branch</label>
                                    <select
                                        id="pm-outlet-select"
                                        className={`form-select ${fieldErrors.outlet ? "input-error" : ""}`}
                                        value={selectedOutlet}
                                        onChange={(e) => { setSelectedOutlet(e.target.value); setFieldErrors((prev) => ({ ...prev, outlet: undefined })); }}
                                        disabled={!!editProduct}
                                    >
                                        <option value="">Select outlet</option>
                                        {outlets.map((o) => (
                                            <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                        ))}
                                    </select>
                                    {fieldErrors.outlet && <span className="pm-field-error">{fieldErrors.outlet}</span>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalOpen(false)}
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    id="pm-submit-btn"
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={formLoading}
                                >
                                    {formLoading ? "Saving..." : editProduct ? "Update Product" : "Add Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "420px" }}>
                        <div className="modal-header" style={{ borderBottom: "none" }}>
                            <h3 className="text-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Trash2 size={20} />
                                Delete Product?
                            </h3>
                        </div>
                        <div className="modal-body" style={{ paddingTop: 0 }}>
                            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                                Are you sure you want to delete <strong style={{ color: "white" }}>{deleteTarget.name}</strong>?
                                This action is permanent and cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ borderTop: "none" }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                id="pm-delete-confirm-btn"
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDelete(deleteTarget._id)}
                            >
                                <Trash2 size={14} />
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
