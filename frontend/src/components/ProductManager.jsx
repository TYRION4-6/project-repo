import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Plus, Edit, Trash2, X, Package, AlertTriangle, ChevronLeft, ChevronRight, Store, Search } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";

const ITEMS_PER_PAGE = 10;

export default function ProductManager({ outlets = [], token, refreshData, addToast, userRole = "Manager", onOrderProduct }) {
    const isCustomer = userRole === "Customer";
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filterOutlet, setFilterOutlet] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stockLevel, setStockLevel] = useState("");
    const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState("10");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState([]);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const filters = { page: currentPage, limit: ITEMS_PER_PAGE };
            if (filterOutlet) filters.outlet = filterOutlet;
            if (searchQuery) filters.search = searchQuery;

            const res = await api.getProductsPaginated(filters, token);
            if (res.products) {
                setProducts(res.products);
                setTotal(res.total || res.products.length);
            } else if (Array.isArray(res)) {
                setProducts(res);
                setTotal(res.length);
            }
        } catch (err) {
            console.error("Failed to load products", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterOutlet, searchQuery, token]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddImageUrl = () => {
        if (!newImageUrl || !newImageUrl.trim()) return;
        const url = newImageUrl.trim();
        setImages(prev => [...prev, url]);
        setNewImageUrl("");
    };

    const handleRemoveImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const openAddModal = () => {
        if (isCustomer) return;
        setEditProduct(null);
        setName("");
        setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
        setCategory("Electronics");
        setPrice("1999");
        setStockLevel("25");
        setLowStockAlertThreshold("10");
        setSelectedOutlet(outlets[0]?._id || "");
        setDescription("");
        setImages([
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop"
        ]);
        setNewImageUrl("");
        setModalOpen(true);
    };

    const openEditModal = (p) => {
        if (isCustomer) return;
        setEditProduct(p);
        setName(p.name);
        setSku(p.sku);
        setCategory(p.category);
        setPrice(p.price);
        setStockLevel(p.stockLevel !== undefined ? p.stockLevel : 20);
        setLowStockAlertThreshold(p.lowStockAlertThreshold || 10);
        setSelectedOutlet(p.outlet?._id || p.outlet || "");
        setDescription(p.description || "");
        const existingImgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
        setImages(existingImgs.length > 0 ? existingImgs : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"]);
        setNewImageUrl("");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCustomer) return;
        if (!name || !price || !sku || !category) {
            addToast("Please fill in all required fields", "warning");
            return;
        }

        setFormLoading(true);
        try {
            const firstImg = images.length > 0 ? images[0] : "";
            const payload = {
                name,
                sku,
                category,
                price: Number(price),
                stockLevel: Number(stockLevel),
                lowStockAlertThreshold: Number(lowStockAlertThreshold),
                minStockThreshold: Number(lowStockAlertThreshold),
                outlet: selectedOutlet || (outlets[0] ? outlets[0]._id : undefined),
                description,
                image: firstImg,
                images: images
            };

            if (editProduct) {
                await api.updateProduct(editProduct._id, payload, token);
                addToast(`Product "${name}" updated successfully`, "success");
            } else {
                await api.createProduct(payload, token);
                addToast(`Product "${name}" added to catalog`, "success");
            }

            setModalOpen(false);
            fetchProducts();
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Failed to save product", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || isCustomer) return;
        try {
            await api.deleteProduct(deleteTarget._id, token);
            addToast(`Product "${deleteTarget.name}" removed`, "success");
            setDeleteTarget(null);
            fetchProducts();
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Failed to delete product", "error");
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">{isCustomer ? "Store Product Catalog" : "Product Catalog Management"}</h2>
                    <p className="page-subtitle">{isCustomer ? "Browse available items, view live prices and place orders" : "Add, inspect, and update stock catalog items across metro branch outlets"}</p>
                </div>
                {!isCustomer && (
                    <button id="add-product-btn" className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} />
                        Add Product
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flexGrow: 1, minWidth: "240px" }}>
                    <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input 
                        type="text" 
                        className="form-input" 
                        style={{ paddingLeft: "42px" }}
                        placeholder="Search product by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ width: "220px" }}>
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
                </div>
            </div>

            {/* Products Table */}
            <div className="table-wrapper card-panel" style={{ padding: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>{isCustomer ? "Action" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                                    Loading products catalog...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                    No products found matching your search.
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => {
                                const stock = p.stockLevel !== undefined ? p.stockLevel : 20;
                                const thresh = p.lowStockAlertThreshold || 10;
                                const isOut = stock === 0;
                                const isLow = stock > 0 && stock <= thresh;

                                const imgList = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
                                const firstImg = imgList[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop";

                                return (
                                    <tr key={p._id}>
                                        <td>
                                            <div 
                                                style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", position: "relative", cursor: "pointer" }}
                                                onClick={() => setDetailProduct(p)}
                                                title="Click to view product details"
                                            >
                                                <img 
                                                    src={firstImg} 
                                                    alt={p.name} 
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"; }}
                                                />
                                                {imgList.length > 1 && (
                                                    <span style={{ position: "absolute", bottom: "1px", right: "1px", background: "rgba(0,0,0,0.85)", color: "var(--color-warning)", fontSize: "9px", fontWeight: "700", padding: "0 3px", borderRadius: "3px" }}>
                                                        +{imgList.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                            <a 
                                                href="#" 
                                                onClick={(e) => { e.preventDefault(); setDetailProduct(p); }} 
                                                style={{ color: "inherit", textDecoration: "none" }}
                                            >
                                                {p.name}
                                            </a>
                                        </td>
                                        <td><code className="pm-sku-code">{p.sku}</code></td>
                                        <td><span className="badge badge-success">{p.category}</span></td>
                                        <td style={{ fontWeight: "600" }}>₹{p.price}</td>
                                        <td style={{ fontWeight: "600" }}>{stock} pcs</td>
                                        <td>
                                            <span className={`badge ${isOut ? "badge-danger" : isLow ? "badge-warning" : "badge-success"}`}>
                                                {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {!isCustomer ? (
                                                <div style={{ display: "inline-flex", gap: "8px" }}>
                                                    <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => openEditModal(p)}>
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                    <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => setDeleteTarget(p)}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    className="btn btn-primary" 
                                                    style={{ padding: "6px 14px", fontSize: "13px", background: "linear-gradient(135deg, #2ec4b6, #007185)", border: "none" }} 
                                                    onClick={() => {
                                                        if (onOrderProduct) onOrderProduct(p);
                                                    }}
                                                >
                                                    Buy / Checkout
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pm-pagination">
                    <span className="pm-pagination-info">Page {currentPage} of {totalPages} ({total} products total)</span>
                    <div className="pm-pagination-controls">
                        <button className="pm-page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <button className="pm-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {(modalOpen && !isCustomer) && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h3>{editProduct ? "Edit Product" : "Add New Product"}</h3>
                            <button type="button" style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => setModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label className="form-label">SKU Code</label>
                                        <input type="text" className="form-input" value={sku} onChange={(e) => setSku(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Category</label>
                                        <input type="text" className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label className="form-label">Price (₹)</label>
                                        <input type="number" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Stock Qty</label>
                                        <input type="number" className="form-input" value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Alert Thresh</label>
                                        <input type="number" className="form-input" value={lowStockAlertThreshold} onChange={(e) => setLowStockAlertThreshold(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Branch Outlet</label>
                                    <select className="form-select" value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)}>
                                        {outlets.map((o) => (
                                            <option key={o._id} value={o._id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Multiple Pictures Section */}
                                <div className="form-group" style={{ background: "rgba(17, 24, 39, 0.4)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Product Pictures Gallery ({images.length} added)</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Add multiple photos</span>
                                    </label>

                                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                        <input 
                                            type="url" 
                                            className="form-input" 
                                            placeholder="Paste picture URL..." 
                                            value={newImageUrl} 
                                            onChange={(e) => setNewImageUrl(e.target.value)} 
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImageUrl(); } }}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={handleAddImageUrl}
                                            style={{ padding: "0 16px", whiteSpace: "nowrap", flexShrink: 0 }}
                                        >
                                            <Plus size={16} /> Add Photo
                                        </button>
                                    </div>

                                    {/* Preset Sample Photo Options */}
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Presets:</span>
                                        {[
                                            { label: "+ Headset", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop" },
                                            { label: "+ Watch", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop" },
                                            { label: "+ Sneakers", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop" },
                                            { label: "+ Camera", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop" }
                                        ].map((pItem, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="btn btn-secondary"
                                                style={{ padding: "3px 8px", fontSize: "11px" }}
                                                onClick={() => setImages(prev => [...prev, pItem.url])}
                                            >
                                                {pItem.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Added Images Thumbnails List */}
                                    {images.length > 0 ? (
                                        <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "6px 0" }}>
                                            {images.map((imgUrl, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ 
                                                        position: "relative", 
                                                        width: "68px", 
                                                        height: "68px", 
                                                        borderRadius: "10px", 
                                                        overflow: "hidden", 
                                                        border: idx === 0 ? "2px solid var(--color-success)" : "1px solid var(--border-color)",
                                                        flexShrink: 0,
                                                        background: "rgba(0,0,0,0.4)"
                                                    }}
                                                >
                                                    <img src={imgUrl} alt={`Product ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    {idx === 0 && (
                                                        <span style={{ position: "absolute", bottom: "2px", left: "2px", right: "2px", background: "rgba(46, 196, 182, 0.95)", color: "#000", fontSize: "9px", fontWeight: "800", textAlign: "center", borderRadius: "3px", padding: "1px 0" }}>
                                                            MAIN
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        style={{
                                                            position: "absolute",
                                                            top: "2px",
                                                            right: "2px",
                                                            background: "rgba(220, 53, 69, 0.9)",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "50%",
                                                            width: "18px",
                                                            height: "18px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            cursor: "pointer",
                                                            padding: 0
                                                        }}
                                                        title="Remove photo"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                            No pictures added yet. Paste a URL or select a preset above.
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <textarea className="form-input" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? "Saving..." : editProduct ? "Update Product" : "Create Product"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {(deleteTarget && !isCustomer) && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "420px" }}>
                        <div className="modal-header">
                            <h3 className="text-danger">Delete Product?</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: "var(--text-secondary)" }}>
                                Delete <strong>{deleteTarget.name}</strong> from catalog?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteTarget._id)}>Confirm Delete</button>
                        </div>
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
