import { useState, useEffect } from "react";
import { api } from "../api";
import { ShoppingCart, Plus, Minus, Trash2, Search, Printer, CheckCircle } from "lucide-react";

export default function POSView({ products = [], outlets = [], token, refreshData, addToast, onSaleCreated, userRole = "Manager" }) {
    const isCustomer = userRole === "Customer";
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [customerPhone, setCustomerPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [receiptModal, setReceiptModal] = useState(null);

    useEffect(() => {
        if (outlets.length > 0 && !selectedOutlet) {
            setSelectedOutlet(outlets[0]._id);
        }
    }, [outlets, selectedOutlet]);

    const activeProducts = products.filter((p) => {
        const matchesOutlet = !selectedOutlet || p.outlet === selectedOutlet || (p.outlet && p.outlet._id === selectedOutlet);
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesOutlet && matchesSearch;
    });

    const addToCart = (product) => {
        const stock = product.stockLevel !== undefined ? product.stockLevel : 20;
        if (stock <= 0) {
            addToast("This product is out of stock!", "error");
            return;
        }

        const existingItem = cart.find((item) => item.productId === product._id);
        if (existingItem) {
            if (existingItem.quantity >= stock) {
                addToast(`Cannot add more. Only ${stock} units available in stock.`, "warning");
                return;
            }
            setCart(cart.map((item) => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, {
                productId: product._id,
                productName: product.name,
                unitPrice: product.price,
                maxStock: stock,
                quantity: 1,
            }]);
        }
        addToast(`${product.name} added to cart`, "success");
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map((item) => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta;
                if (newQty > item.maxStock) {
                    addToast(`Cannot exceed stock limit of ${item.maxStock} pcs`, "warning");
                    return item;
                }
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.productId !== productId));
    };

    const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const calculateTax = () => Math.round(calculateSubtotal() * 0.18); // 18% GST
    const calculateTotal = () => calculateSubtotal() + calculateTax();

    const handleCheckout = async () => {
        if (cart.length === 0) {
            addToast("Your cart is empty! Add products to checkout.", "warning");
            return;
        }

        if (!selectedOutlet) {
            addToast("Please select a store outlet for checkout", "warning");
            return;
        }

        setLoading(true);
        try {
            const saleData = {
                outletId: selectedOutlet,
                outlet: selectedOutlet,
                items: cart.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.unitPrice * item.quantity
                })),
                paymentMethod,
                customerPhone: customerPhone || "+91 98000 11223",
                totalAmount: calculateTotal()
            };

            const response = await api.recordSale(saleData, token);
            const outletObj = outlets.find((o) => o._id === selectedOutlet);
            
            const receipt = {
                saleNumber: response.saleNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                date: response.date || new Date().toISOString(),
                outletName: outletObj?.name || "Shipbasket Outlet",
                items: cart,
                totalAmount: calculateTotal(),
                paymentMethod,
                customerPhone: customerPhone || "Walk-in Customer"
            };

            if (onSaleCreated) {
                onSaleCreated(receipt);
            }

            setReceiptModal(receipt);
            setCart([]);
            setCustomerPhone("");
            addToast(isCustomer ? "Order placed successfully! Thank you for shopping." : "Sale completed & invoice generated!", "success");
            if (refreshData) refreshData();
        } catch (err) {
            addToast(err.message || "Failed to process transaction", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">{isCustomer ? "Express Customer Checkout" : "Point-of-Sale (POS) Terminal"}</h2>
                    <p className="page-subtitle">
                        {isCustomer 
                            ? "Select items from store catalog, add to cart, and place order online" 
                            : "Scan catalog items, manage customer carts, and print digital receipts"}
                    </p>
                </div>
            </div>

            <div className="pos-layout">
                {/* Product Catalog Grid */}
                <div>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ width: "220px" }}>
                            <select 
                                className="form-select"
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                            >
                                {outlets.map((o) => (
                                    <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ position: "relative", flexGrow: 1 }}>
                            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                            <input 
                                type="text" 
                                className="form-input"
                                style={{ paddingLeft: "42px" }}
                                placeholder="Search item by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pos-products-grid">
                        {activeProducts.map((p) => {
                            const stock = p.stockLevel !== undefined ? p.stockLevel : 20;
                            const isOut = stock <= 0;
                            return (
                                <div key={p._id} className="pos-product-card" onClick={() => !isOut && addToCart(p)}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span className="badge badge-success">{p.category}</span>
                                        <span className={`badge ${isOut ? "badge-danger" : "badge-warning"}`}>
                                            {isOut ? "Out" : `${stock} pcs`}
                                        </span>
                                    </div>
                                    <h4 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>{p.name}</h4>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>{p.sku}</span>
                                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-primary)" }}>
                                        ₹{p.price}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cart & Checkout Panel */}
                <div className="card-panel pos-cart-panel">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <ShoppingCart className="text-primary" size={20} />
                        <h3 style={{ margin: 0 }}>Current Checkout Cart</h3>
                    </div>

                    <div className="pos-cart-items">
                        {cart.length === 0 ? (
                            <div className="flex-center" style={{ height: "200px", color: "var(--text-secondary)", flexDirection: "column" }}>
                                <span>Cart is currently empty</span>
                                <span style={{ fontSize: "12px", marginTop: "4px" }}>Click products on left to add items</span>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.productId} className="pos-cart-item">
                                    <div>
                                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.productName}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>₹{item.unitPrice} × {item.quantity} = ₹{item.unitPrice * item.quantity}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.productId, -1)}>-</button>
                                        <span style={{ fontSize: "13px", fontWeight: "600" }}>{item.quantity}</span>
                                        <button className="pos-cart-qty-btn" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pos-cart-summary">
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <span>Subtotal</span>
                            <span>₹{calculateSubtotal()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <span>GST Tax (18%)</span>
                            <span>₹{calculateTax()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700", color: "var(--color-primary)", marginTop: "6px" }}>
                            <span>Total Pay</span>
                            <span>₹{calculateTotal()}</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                        <label className="form-label">Payment Method</label>
                        <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="UPI">UPI / QR Code</option>
                            <option value="Card">Credit / Debit Card</option>
                            <option value="Cash">Cash</option>
                            <option value="Net Banking">Net Banking</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                        <label className="form-label">Customer Mobile (Optional)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="+91 98765 43210"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>

                    <button 
                        className="btn btn-primary" 
                        style={{ width: "100%", padding: "14px" }}
                        disabled={cart.length === 0 || loading}
                        onClick={handleCheckout}
                    >
                        {loading ? "Processing Sale..." : `Complete Checkout (₹${calculateTotal()})`}
                    </button>
                </div>
            </div>

            {/* Receipt Printable Modal */}
            {receiptModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <div className="modal-header">
                            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CheckCircle color="var(--color-success)" size={20} />
                                Digital Receipt Generated
                            </h3>
                        </div>
                        <div className="modal-body" style={{ background: "#ffffff", color: "#000000", borderRadius: "12px", padding: "20px" }}>
                            <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "1px dashed #ccc", paddingBottom: "12px" }}>
                                <h2 style={{ fontSize: "18px", margin: 0, color: "#000" }}>Shipbasket Retail Portal</h2>
                                <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>{receiptModal.outletName || "Shipbasket Branch"}</p>
                                <p style={{ fontSize: "11px", color: "#777", margin: "2px 0 0" }}>Receipt #: {receiptModal.saleNumber || "TXN-88219"}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                                {receiptModal.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                        <span>{item.productName} (x{item.quantity})</span>
                                        <span>₹{item.subtotal}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ borderTop: "1px solid #000", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                                <span>Grand Total</span>
                                <span>₹{receiptModal.totalAmount}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => window.print()}>
                                <Printer size={16} /> Print Receipt
                            </button>
                            <button className="btn btn-primary" onClick={() => setReceiptModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
