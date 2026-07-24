import React, { useState } from "react";
import { Package, Plus, Edit2, Trash2, RefreshCw, AlertTriangle, Layers } from "lucide-react";
import { api } from "../api";

export default function ProductsManager({ products, outlets, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Electronics",
    price: "",
    costPrice: "",
    unit: "pcs",
    minStockThreshold: 15,
    description: "",
    initialStockPerOutlet: 20,
  });

  const [restockData, setRestockData] = useState({
    outletId: "",
    productId: "",
    quantityToAdd: 20,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      category: "Electronics",
      price: "",
      costPrice: "",
      unit: "pcs",
      minStockThreshold: 15,
      description: "",
      initialStockPerOutlet: 20,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      price: prod.price,
      costPrice: prod.costPrice,
      unit: prod.unit,
      minStockThreshold: prod.minStockThreshold,
      description: prod.description || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenRestock = (prod, outletId = "") => {
    setRestockData({
      productId: prod._id,
      outletId: outletId || (outlets[0] ? outlets[0]._id : ""),
      quantityToAdd: 20,
    });
    setIsRestockOpen(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert("Failed to save product");
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.restockInventory(
        restockData.outletId,
        restockData.productId,
        restockData.quantityToAdd
      );
      setIsRestockOpen(false);
      onRefresh();
    } catch (err) {
      alert("Failed to restock product");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product from all inventories?")) {
      try {
        await api.deleteProduct(id);
        onRefresh();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Product Inventory Catalog</h2>
          <p>Global inventory catalog with real-time stock levels per branch outlet</p>
        </div>

        <div className="filter-controls">
          <input
            type="text"
            className="text-input"
            placeholder="Search product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Groceries">Groceries</option>
            <option value="Apparel">Apparel</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Furniture">Furniture</option>
          </select>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Product Item
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU & Product</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Total Stock</th>
              <th>Min Threshold</th>
              <th>Stock Distribution per Outlet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((prod) => (
              <tr key={prod._id}>
                <td>
                  <div style={{ fontWeight: 700, color: "white" }}>{prod.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prod.sku}</div>
                </td>
                <td>
                  <span
                    style={{
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "#818cf8",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {prod.category}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: "#34d399" }}>₹{prod.price.toLocaleString("en-IN")}</td>
                <td>
                  <span
                    style={{
                      fontWeight: 800,
                      color: prod.isLowStock ? "#ef4444" : "#34d399",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {prod.isLowStock && <AlertTriangle size={14} />}
                    {prod.totalStock} {prod.unit}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{prod.minStockThreshold} {prod.unit}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {prod.outletBreakdown?.map((ob) => (
                      <span
                        key={ob.outletId}
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          background: ob.isLowStock ? "rgba(239, 68, 68, 0.2)" : "var(--bg-surface)",
                          color: ob.isLowStock ? "#fca5a5" : "var(--text-main)",
                          border: `1px solid ${ob.isLowStock ? "rgba(239, 68, 68, 0.4)" : "var(--border-color)"}`,
                        }}
                        title={`${ob.outletName}: ${ob.stock} in stock`}
                      >
                        {ob.city}: <strong>{ob.stock}</strong>
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Restock Item"
                      onClick={() => handleOpenRestock(prod)}
                    >
                      <RefreshCw size={14} /> Restock
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(prod)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(prod._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "white" }}>
                {editingProduct ? "Edit Product Details" : "Add New Inventory Item"}
              </h3>
            </div>

            <form onSubmit={handleSubmitProduct}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Noise-Canceling Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>SKU (Optional auto-generated)</label>
                  <input
                    type="text"
                    placeholder="ELE-AUDIO-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="7999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    placeholder="4800"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="pcs, kg, box"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Min Low-Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="form-group">
                  <label>Initial Stock per Outlet Branch</label>
                  <input
                    type="number"
                    value={formData.initialStockPerOutlet}
                    onChange={(e) => setFormData({ ...formData, initialStockPerOutlet: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {isRestockOpen && (
        <div className="modal-overlay" onClick={() => setIsRestockOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "white" }}>Replenish Inventory Stock</h3>
            </div>

            <form onSubmit={handleRestockSubmit}>
              <div className="form-group">
                <label>Select Outlet Branch</label>
                <select
                  value={restockData.outletId}
                  onChange={(e) => setRestockData({ ...restockData, outletId: e.target.value })}
                  required
                >
                  {outlets.map((out) => (
                    <option key={out._id} value={out._id}>
                      {out.name} ({out.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity to Restock (Add units)</label>
                <input
                  type="number"
                  min="1"
                  value={restockData.quantityToAdd}
                  onChange={(e) => setRestockData({ ...restockData, quantityToAdd: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Confirm Restock
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRestockOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
