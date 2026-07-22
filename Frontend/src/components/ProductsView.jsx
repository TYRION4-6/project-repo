import React, { useState } from "react";
import { Plus, Edit2, Trash2, Package, Layers, X, Edit3, Settings, AlertCircle } from "lucide-react";

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

  // Form error and loading states
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Product form data
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    description: "",
    outletId: "",
    stock: "0"
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
      description: "",
      outletId: outlets.length > 0 ? outlets[0]._id : "",
      stock: "0"
    });
    setFormErrors({});
    setSubmitError("");
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    
    // Find default outlet (prefer one already stocked, or first available)
    const defaultOutletId = product.stock && product.stock.length > 0 
      ? (product.stock[0].outletId?._id || product.stock[0].outletId || (outlets.length > 0 ? outlets[0]._id : ""))
      : (outlets.length > 0 ? outlets[0]._id : "");
      
    // Find stock for this default outlet
    const defaultStockItem = product.stock && product.stock.length > 0
      ? product.stock.find(s => {
          const sId = s.outletId?._id || s.outletId;
          return sId === defaultOutletId;
        })
      : null;
    const defaultStockQty = defaultStockItem ? defaultStockItem.quantity : 0;

    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      description: product.description || "",
      outletId: defaultOutletId,
      stock: defaultStockQty.toString()
    });
    setFormErrors({});
    setSubmitError("");
    setProductModalOpen(true);
  };

  const handleOutletChange = (newOutletId) => {
    let stockQty = "0";
    if (editingProduct) {
      const stockItem = editingProduct.stock && editingProduct.stock.find(s => {
        const sId = s.outletId?._id || s.outletId;
        return sId === newOutletId;
      });
      stockQty = stockItem ? stockItem.quantity.toString() : "0";
    }
    setProductForm(prev => ({
      ...prev,
      outletId: newOutletId,
      stock: stockQty
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!productForm.name.trim()) {
      errors.name = "Product name is required";
    } else if (productForm.name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters";
    }
    
    // SKU validation
    const skuRegex = /^[a-zA-Z0-9-_]+$/;
    if (!productForm.sku.trim()) {
      errors.sku = "SKU is required";
    } else if (!skuRegex.test(productForm.sku.trim())) {
      errors.sku = "SKU must contain only letters, numbers, hyphens, and underscores";
    }
    
    // Category validation
    if (!productForm.category.trim()) {
      errors.category = "Category is required";
    }
    
    // Price validation
    const priceNum = parseFloat(productForm.price);
    if (productForm.price === "" || isNaN(priceNum)) {
      errors.price = "Price is required";
    } else if (priceNum < 0) {
      errors.price = "Price must be a positive number";
    }
    
    // Outlet validation
    if (outlets.length > 0 && !productForm.outletId) {
      errors.outletId = "Please select an outlet";
    } else if (outlets.length === 0) {
      errors.outletId = "At least one outlet must exist in the system";
    }
    
    // Stock validation
    const stockNum = parseInt(productForm.stock, 10);
    if (productForm.stock === "" || isNaN(stockNum)) {
      errors.stock = "Stock quantity is required";
    } else if (stockNum < 0 || !Number.isInteger(stockNum)) {
      errors.stock = "Stock must be a non-negative integer";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdjustStock = (product) => {
    setSelectedProduct(product);
    setStockForm({
      outletId: outlets.length > 0 ? outlets[0]._id : "",
      quantity: ""
    });
    setStockModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const priceNum = parseFloat(productForm.price);
      const stockNum = parseInt(productForm.stock, 10);
      
      if (editingProduct) {
        // Update product info
        const updatedProductData = {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim(),
          price: priceNum,
          description: productForm.description.trim(),
        };
        
        await onUpdateProduct(editingProduct._id, updatedProductData);
        
        // Update stock level for the selected outlet
        if (productForm.outletId) {
          await onUpdateStock(editingProduct._id, productForm.outletId, stockNum);
        }
      } else {
        // Create product with stock
        const newProductData = {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim(),
          price: priceNum,
          description: productForm.description.trim(),
          stock: productForm.outletId ? [{ outletId: productForm.outletId, quantity: stockNum }] : []
        };
        
        await onCreateProduct(newProductData);
      }
      setProductModalOpen(false);
    } catch (err) {
      setSubmitError(err.message || "Failed to save product. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              {submitError && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  color: "var(--danger)", 
                  background: "rgba(239, 68, 68, 0.08)", 
                  padding: "10px 14px", 
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "20px",
                  border: "1px solid rgba(239, 68, 68, 0.15)"
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    value={productForm.name} 
                    onChange={(e) => {
                      setProductForm({ ...productForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }} 
                    placeholder="e.g. Leather Wallet"
                    style={{ 
                      borderColor: formErrors.name ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.name ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  />
                  {formErrors.name && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    value={productForm.sku} 
                    onChange={(e) => {
                      setProductForm({ ...productForm, sku: e.target.value });
                      if (formErrors.sku) setFormErrors({ ...formErrors, sku: null });
                    }} 
                    placeholder="e.g. LTHR-WLT-01"
                    disabled={!!editingProduct}
                    style={{ 
                      borderColor: formErrors.sku ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.sku ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  />
                  {formErrors.sku && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.sku}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input 
                    type="text" 
                    value={productForm.category} 
                    onChange={(e) => {
                      setProductForm({ ...productForm, category: e.target.value });
                      if (formErrors.category) setFormErrors({ ...formErrors, category: null });
                    }} 
                    placeholder="e.g. Accessories"
                    style={{ 
                      borderColor: formErrors.category ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.category ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  />
                  {formErrors.category && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.category}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Selling Price (INR)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={productForm.price} 
                    onChange={(e) => {
                      setProductForm({ ...productForm, price: e.target.value });
                      if (formErrors.price) setFormErrors({ ...formErrors, price: null });
                    }} 
                    placeholder="e.g. 1499"
                    style={{ 
                      borderColor: formErrors.price ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.price ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  />
                  {formErrors.price && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.price}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Metro Outlet</label>
                  <select 
                    value={productForm.outletId} 
                    onChange={(e) => {
                      handleOutletChange(e.target.value);
                      if (formErrors.outletId) setFormErrors({ ...formErrors, outletId: null });
                    }}
                    style={{ 
                      borderColor: formErrors.outletId ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.outletId ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  >
                    {outlets.length === 0 ? (
                      <option value="">No outlets available. Add one first.</option>
                    ) : (
                      <>
                        <option value="">-- Select Outlet --</option>
                        {outlets.map(outlet => (
                          <option key={outlet._id} value={outlet._id}>
                            {outlet.name} ({outlet.city})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {formErrors.outletId && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.outletId}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Stock (Units Available)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={productForm.stock} 
                    onChange={(e) => {
                      setProductForm({ ...productForm, stock: e.target.value });
                      if (formErrors.stock) setFormErrors({ ...formErrors, stock: null });
                    }} 
                    placeholder="e.g. 50"
                    style={{ 
                      borderColor: formErrors.stock ? "var(--danger)" : "var(--border-light)",
                      boxShadow: formErrors.stock ? "0 0 0 1px rgba(239, 68, 68, 0.25)" : "none"
                    }}
                  />
                  {formErrors.stock && (
                    <span style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "2px" }}>
                      {formErrors.stock}
                    </span>
                  )}
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
                <button 
                  type="button" 
                  onClick={() => setProductModalOpen(false)} 
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
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
