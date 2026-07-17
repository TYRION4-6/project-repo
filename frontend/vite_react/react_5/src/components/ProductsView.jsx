import React, { useState } from "react";
import { Plus, Edit2, Trash2, Package, Layers, X, Edit3, Settings } from "lucide-react";

export default function ProductsView({ 
  products, 
  outlets, 
  onCreateProduct, 
  onUpdateProduct, 
  onUpdateStock, 
  onDeleteProduct, 
  loading 
}) {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product form data
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    description: ""
  });

  // Stock update form data
  const [stockForm, setStockForm] = useState({
    outletId: "",
    quantity: ""
  });

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: "",
      category: "",
      price: "",
      description: ""
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      description: product.description || ""
    });
    setProductModalOpen(true);
  };

  const handleOpenAdjustStock = (product) => {
    setSelectedProduct(product);
    setStockForm({
      outletId: outlets.length > 0 ? outlets[0]._id : "",
      quantity: ""
    });
    setStockModalOpen(true);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct._id, productForm);
    } else {
      onCreateProduct(productForm);
    }
    setProductModalOpen(false);
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!stockForm.outletId) return;
    onUpdateStock(selectedProduct._id, stockForm.outletId, stockForm.quantity);
    setStockModalOpen(false);
  };

  const calculateTotalStock = (product) => {
    return product.stock.reduce((total, s) => total + (parseInt(s.quantity) || 0), 0);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading products inventory...</p>
      </div>
    );
  }

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
      <div className="flex-between mb-6">
        <div>
          <h2>Products Catalog & Inventory</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Add new products, monitor SKU levels, and adjust stock allocations across branches.
          </p>
        </div>
        <button onClick={handleOpenCreateProduct} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {products.length === 0 ? (
        <div className="glass-card text-center" style={{ padding: "48px 24px" }}>
          <Package size={48} className="text-muted" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ color: "#fff" }}>No Products Available</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "8px auto 24px" }}>
            Create a product entry in your catalog, then allocate stock to physical outlets.
          </p>
          <button onClick={handleOpenCreateProduct} className="btn btn-primary">
            Create First Product
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock by Outlet</th>
                  <th>Total Stock</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = calculateTotalStock(product);
                  return (
                    <tr key={product._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{product.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.description || "No description provided."}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{product.sku}</span>
                      </td>
                      <td>
                        <span className="badge badge-info">{product.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--primary-light)" }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td>
                        {product.stock && product.stock.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {product.stock.map((s, i) => {
                              const isLow = s.quantity <= 10;
                              return s.outletId ? (
                                <span 
                                  key={i} 
                                  className={`badge ${isLow ? "badge-danger" : "badge-success"}`}
                                  style={{ fontSize: "0.75rem", textTransform: "none" }}
                                  title={`${s.outletId.name} (${s.outletId.city})`}
                                >
                                  {s.outletId.name}: {s.quantity}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not stocked in any outlet</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${totalStock === 0 ? "badge-danger" : totalStock <= 20 ? "badge-warning" : "badge-success"}`}>
                          {totalStock} units
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button 
                            onClick={() => handleOpenAdjustStock(product)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: "4px", borderColor: "var(--primary)" }}
                            title="Adjust Stock levels"
                          >
                            <Settings size={12} style={{ color: "var(--primary-light)" }} />
                            <span>Stock</span>
                          </button>
                          <button 
                            onClick={() => handleOpenEditProduct(product)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                            title="Edit Product"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                                onDeleteProduct(product._id);
                              }
                            }}
                            className="btn btn-danger btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                            title="Delete Product"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between mb-6">
              <h2 style={{ margin: 0 }}>{editingProduct ? "Edit Product Details" : "Add Product to Catalog"}</h2>
              <button 
                onClick={() => setProductModalOpen(false)} 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    value={productForm.name} 
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                    placeholder="e.g. Leather Wallet"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    value={productForm.sku} 
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} 
                    placeholder="e.g. LTHR-WLT-01"
                    disabled={!!editingProduct}
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input 
                    type="text" 
                    value={productForm.category} 
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} 
                    placeholder="e.g. Accessories"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Selling Price (INR)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={productForm.price} 
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} 
                    placeholder="e.g. 1499"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  value={productForm.description} 
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
                  placeholder="Provide details about size, material, warranty etc."
                  rows={3}
                />
              </div>

              <div className="flex-end" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setProductModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {stockModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div className="flex-between mb-6">
              <div>
                <h2 style={{ margin: 0 }}>Adjust Stock</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                  Product: <strong style={{ color: "#fff" }}>{selectedProduct.name}</strong> ({selectedProduct.sku})
                </p>
              </div>
              <button 
                onClick={() => setStockModalOpen(false)} 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {outlets.length === 0 ? (
              <div className="text-center" style={{ padding: "20px 0" }}>
                <p style={{ color: "var(--text-secondary)" }}>Please add an outlet first in Outlets tab.</p>
              </div>
            ) : (
              <form onSubmit={handleStockSubmit}>
                <div className="form-group">
                  <label>Select Metro Branch</label>
                  <select 
                    value={stockForm.outletId} 
                    onChange={(e) => setStockForm({ ...stockForm, outletId: e.target.value })}
                    required
                  >
                    {outlets.map(outlet => (
                      <option key={outlet._id} value={outlet._id}>
                        {outlet.name} ({outlet.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Quantity (Units Available)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={stockForm.quantity} 
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} 
                    placeholder="e.g. 50"
                    required 
                  />
                </div>

                <div className="flex-end" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" onClick={() => setStockModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Stock level
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
