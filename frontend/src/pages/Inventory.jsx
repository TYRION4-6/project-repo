import React, { useState, useEffect } from "react";
import { productsAPI, outletsAPI } from "../api";
import { Plus, Edit, Trash2, Search, X, ShieldAlert, AlertTriangle } from "lucide-react";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedOutletFilter, setSelectedOutletFilter] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null for create
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [outletId, setOutletId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const outletsData = await outletsAPI.getAll();
      setOutlets(outletsData);
      
      const productsData = await productsAPI.getAll();
      setProducts(productsData);
    } catch (err) {
      setError(err.message || "Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setName("");
    setSku("");
    setCategory("");
    setPrice("");
    setStock("");
    setOutletId(outlets.length > 0 ? outlets[0]._id : "");
    setSubmitError("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditId(product._id);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setPrice(product.price);
    setStock(product.stock);
    setOutletId(product.outlet ? product.outlet._id : "");
    setSubmitError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!outletId) {
      setSubmitError("Please create an outlet first before adding products.");
      return;
    }

    setSubmitLoading(true);
    const productData = {
      name,
      sku,
      category,
      price: Number(price),
      stock: Number(stock),
      outlet: outletId,
    };

    try {
      if (editId) {
        await productsAPI.update(editId, productData);
      } else {
        await productsAPI.create(productData);
      }
      setModalOpen(false);
      // Refresh products list
      const updatedProducts = await productsAPI.getAll();
      setProducts(updatedProducts);
    } catch (err) {
      setSubmitError(err.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product? All sales transactions linked to this product will also be deleted.")) {
      try {
        await productsAPI.delete(id);
        const updatedProducts = await productsAPI.getAll();
        setProducts(updatedProducts);
      } catch (err) {
        alert(err.message || "Delete failed");
      }
    }
  };

  // Filter products by search query and selected outlet
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesOutlet = selectedOutletFilter
      ? product.outlet && product.outlet._id === selectedOutletFilter
      : true;

    return matchesSearch && matchesOutlet;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Catalog</h1>
          <p className="page-description">Manage product details, stock levels, and pricing</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="actions-row">
        <div style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, SKU, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px" }}
          />
        </div>

        <div>
          <select
            className="filter-select"
            value={selectedOutletFilter}
            onChange={(e) => setSelectedOutletFilter(e.target.value)}
          >
            <option value="">All Metro Outlets</option>
            {outlets.map((outlet) => (
              <option key={outlet._id} value={outlet._id}>
                {outlet.name} ({outlet.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div className="dot" style={{ width: "24px", height: "24px" }}></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No Products Found</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            {products.length === 0
              ? "Your inventory is currently empty. Add products to stock up your outlets."
              : "No items match your search filter criteria."}
          </p>
          {products.length === 0 && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "16px" }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Outlet</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{p.name}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", color: "var(--secondary)" }}>{p.sku}</code>
                    </td>
                    <td>
                      <div>{p.outlet ? p.outlet.name : <span style={{ color: "var(--text-muted)" }}>None</span>}</div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {p.outlet ? p.outlet.city : ""}
                      </span>
                    </td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: "500" }}>{formatCurrency(p.price)}</td>
                    <td>
                      {p.stock <= 10 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className="badge badge-low-stock">{p.stock} Left</span>
                          <AlertTriangle size={14} style={{ color: "var(--accent)" }} title="Stock critically low!" />
                        </div>
                      ) : (
                        <span className="badge badge-in-stock">{p.stock} units</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => openEditModal(p)} title="Edit Product">
                          <Edit size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(p._id)} title="Delete Product">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? "Edit Product Details" : "Add Inventory Item"}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {submitError && (
              <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="prod-outlet">Metro Outlet</label>
                <select
                  id="prod-outlet"
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  required
                  disabled={!!editId} // Keep outlet constant once created for data integrity
                >
                  <option value="" disabled>Select Outlet</option>
                  {outlets.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="prod-name">Product Name</label>
                <input
                  id="prod-name"
                  type="text"
                  placeholder="e.g. 5G Smart Phone"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="prod-sku">SKU Code</label>
                  <input
                    id="prod-sku"
                    type="text"
                    placeholder="e.g. PHN-MUM-492"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prod-cat">Category</label>
                  <input
                    id="prod-cat"
                    type="text"
                    placeholder="e.g. Electronics"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prod-price">Price (₹)</label>
                  <input
                    id="prod-price"
                    type="number"
                    min="0"
                    placeholder="e.g. 24999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prod-stock">Stock Quantity</label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? "Saving..." : editId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
