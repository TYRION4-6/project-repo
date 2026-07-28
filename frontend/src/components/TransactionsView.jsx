import { useState, useMemo } from "react";
import { History, FileText, Search, X, Printer } from "lucide-react";

export default function TransactionsView({ sales = [], outlets = [], userRole = "Manager" }) {
    const isCustomer = userRole === "Customer";
    const [selectedSale, setSelectedSale] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOutlet, setFilterOutlet] = useState("");

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        return d.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const activeSales = useMemo(() => {
        const list = Array.isArray(sales) ? [...sales] : [];
        return list.sort((a, b) => new Date(b.date || b.saleDate || b.createdAt || 0) - new Date(a.date || a.saleDate || a.createdAt || 0));
    }, [sales]);

    const filteredSales = activeSales.filter((sale) => {
        if (filterOutlet) {
            const sOutletId = sale.outletId || (typeof sale.outlet === 'object' ? sale.outlet?._id : sale.outlet);
            if (sOutletId !== filterOutlet) return false;
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const idMatch = (sale.saleNumber || sale._id || "").toLowerCase().includes(q);
            const outletMatch = (sale.outletName || sale.outlet?.name || "").toLowerCase().includes(q);
            const phoneMatch = (sale.customerPhone || "").toLowerCase().includes(q);
            const itemMatch = sale.items && sale.items.some(i => (i.productName || "").toLowerCase().includes(q));
            if (!idMatch && !outletMatch && !phoneMatch && !itemMatch) return false;
        }

        return true;
    });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">{isCustomer ? "My Purchase History & Orders" : "Transaction History & Audit Logs"}</h2>
                    <p className="page-subtitle">
                        {isCustomer 
                            ? "Review your past store orders, transaction receipts & invoice details" 
                            : "View, filter, and inspect historical sales invoices logged across outlets"}
                    </p>
                </div>
            </div>

            <div className="card-panel mb-4" style={{ padding: "16px 24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                    <div style={{ flexGrow: 1, minWidth: "240px", position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by Receipt #, Customer Mobile, or Branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: "42px" }}
                        />
                    </div>

                    <div style={{ minWidth: "200px" }}>
                        <select
                            className="form-select"
                            value={filterOutlet}
                            onChange={(e) => setFilterOutlet(e.target.value)}
                        >
                            <option value="">All Outlets</option>
                            {outlets.map((outlet) => (
                                <option key={outlet._id} value={outlet._id}>{outlet.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filteredSales.length === 0 ? (
                <div className="card-panel empty-state">
                    <History className="empty-state-icon" size={60} />
                    <h2>No Sales Logged Yet</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                        Completed Point-Of-Sale (POS) transactions will be listed here automatically.
                    </p>
                </div>
            ) : (
                <div className="table-wrapper card-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Date & Time</th>
                                <th>Branch Outlet</th>
                                <th>Payment Method</th>
                                <th>Total Amount</th>
                                <th style={{ textAlign: "right" }}>Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((sale) => (
                                <tr key={sale._id}>
                                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                        {sale.saleNumber || sale._id}
                                    </td>
                                    <td>{formatDate(sale.date || sale.saleDate || sale.createdAt)}</td>
                                    <td>{sale.outletName || sale.outlet?.name || "Shipbasket Outlet"}</td>
                                    <td>
                                        <span className="badge badge-success">{sale.paymentMethod || "UPI"}</span>
                                    </td>
                                    <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                                        {formatCurrency(sale.totalAmount)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => setSelectedSale(sale)}>
                                            <FileText size={14} /> View Receipt
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Receipt Modal */}
            {selectedSale && (
                <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                        <div className="modal-header">
                            <h3>Sales Receipt Details</h3>
                            <button type="button" style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }} onClick={() => setSelectedSale(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ background: "#ffffff", color: "#000000", borderRadius: "12px", padding: "20px" }}>
                            <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "1px dashed #ccc", paddingBottom: "12px" }}>
                                <h2 style={{ fontSize: "18px", margin: 0, color: "#000" }}>Shipbasket Enterprise</h2>
                                <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>{selectedSale.outletName || selectedSale.outlet?.name || "Shipbasket Branch"}</p>
                                <p style={{ fontSize: "11px", color: "#777", margin: "2px 0 0" }}>Txn ID: {selectedSale.saleNumber || selectedSale._id}</p>
                                <p style={{ fontSize: "11px", color: "#777", margin: "2px 0 0" }}>Date: {formatDate(selectedSale.date || selectedSale.saleDate)}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                                {selectedSale.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                        <span>{item.productName || item.product?.name || "Item"} (x{item.quantity})</span>
                                        <span>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ borderTop: "1px solid #000", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                                <span>Paid ({selectedSale.paymentMethod || "UPI"})</span>
                                <span>{formatCurrency(selectedSale.totalAmount)}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => window.print()}>
                                <Printer size={16} /> Print Receipt
                            </button>
                            <button className="btn btn-primary" onClick={() => setSelectedSale(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
