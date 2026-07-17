import { useState } from "react";
import { History, FileText, Search, X, Calendar, MapPin } from "lucide-react";

export default function TransactionsView({ sales, outlets }) {
    const [selectedSale, setSelectedSale] = useState(null); // Receipt modal
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOutlet, setFilterOutlet] = useState("");

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Filter sales records
    const filteredSales = sales.filter((sale) => {
        // Outlet filter
        if (filterOutlet && sale.outlet?._id !== filterOutlet && sale.outlet !== filterOutlet) {
            return false;
        }

        // Search match (Shortened ID or product names in the sale)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const idMatch = sale._id.toLowerCase().includes(q);
            const outletMatch = sale.outlet?.name?.toLowerCase().includes(q);
            const productMatch = sale.items?.some(
                (item) => item.product?.name?.toLowerCase().includes(q)
            );
            if (!idMatch && !outletMatch && !productMatch) return false;
        }

        return true;
    });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Transaction History</h2>
                    <p className="page-subtitle">View and inspect historical sales invoices logged across outlets</p>
                </div>
            </div>

            {sales.length === 0 ? (
                <div className="card-panel empty-state">
                    <History className="empty-state-icon" size={60} />
                    <h2>No Transactions Found</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                        Sales transactions will appear here once you checkout orders from the POS terminal.
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters Toolbar */}
                    <div className="card-panel mb-4" style={{ padding: "16px 24px" }} id="transaction-filters">
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
                                    id="search-transactions-input"
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by Transaction ID or Product..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>

                            {/* Outlet Filter */}
                            <div style={{ minWidth: "200px" }}>
                                <select
                                    id="filter-transactions-outlet"
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
                    </div>

                    {/* Transactions Table */}
                    {filteredSales.length === 0 ? (
                        <div className="card-panel empty-state">
                            <History className="empty-state-icon" size={60} />
                            <h2>No Match Found</h2>
                            <p style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                                No transactions match your current search filters.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper card-panel" style={{ padding: 0 }} id="transactions-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Date & Time</th>
                                        <th>Branch Outlet</th>
                                        <th>Items Purchased</th>
                                        <th>Total Revenue</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((sale) => (
                                        <tr key={sale._id}>
                                            <td style={{ fontWeight: "600", color: "white", fontSize: "13px" }}>
                                                #{sale._id.slice(-8).toUpperCase()}
                                            </td>
                                            <td>{formatDate(sale.date)}</td>
                                            <td>
                                                <div style={{ fontWeight: "500", color: "white" }}>
                                                    {sale.outlet?.name || "Deleted Outlet"}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                                    {sale.outlet?.city || ""}
                                                </div>
                                            </td>
                                            <td>
                                                {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                    ({sale.items.length} unique items)
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: "700", color: "var(--color-success)" }}>
                                                {formatCurrency(sale.totalAmount)}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                                    onClick={() => setSelectedSale(sale)}
                                                >
                                                    <FileText size={12} />
                                                    View Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Receipt Modal */}
            {selectedSale && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "550px" }}>
                        <div className="modal-header">
                            <h3>Sales Invoice Receipt</h3>
                            <button
                                type="button"
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                                onClick={() => setSelectedSale(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Receipt Header details */}
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-color)", paddingBottom: "16px" }}>
                                <div>
                                    <h4 style={{ color: "white", fontSize: "16px" }}>#{selectedSale._id.toUpperCase()}</h4>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                                        <Calendar size={12} />
                                        {formatDate(selectedSale.date)}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", fontWeight: "600", color: "white" }}>
                                        <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                                        {selectedSale.outlet?.name || "Deleted Outlet"}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                        {selectedSale.outlet?.city || ""}
                                    </div>
                                </div>
                            </div>

                            {/* Itemized list */}
                            <div>
                                <h4 style={{ color: "white", fontSize: "14px", marginBottom: "12px" }}>Itemized Breakdown</h4>
                                <div className="table-wrapper" style={{ background: "rgba(17,24,39,0.3)" }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th style={{ textAlign: "right" }}>Qty</th>
                                                <th style={{ textAlign: "right" }}>Price</th>
                                                <th style={{ textAlign: "right" }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSale.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ color: "white", fontWeight: "500" }}>
                                                        {item.product?.name || "Deleted Product"}
                                                        <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                                            SKU: {item.product?.sku || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>{item.quantity}</td>
                                                    <td style={{ textAlign: "right" }}>{formatCurrency(item.priceAtSale)}</td>
                                                    <td style={{ textAlign: "right", fontWeight: "600", color: "white" }}>
                                                        {formatCurrency(item.priceAtSale * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total summary */}
                            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div className="flex-between">
                                    <span style={{ color: "var(--text-secondary)" }}>Total Quantity</span>
                                    <span style={{ color: "white", fontWeight: "600" }}>
                                        {selectedSale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                    </span>
                                </div>
                                <div className="flex-between" style={{ marginTop: "4px" }}>
                                    <span style={{ fontSize: "16px", fontWeight: "600", color: "white" }}>Total Paid</span>
                                    <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--color-success)" }}>
                                        {formatCurrency(selectedSale.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setSelectedSale(null)}
                                style={{ width: "100%" }}
                            >
                                Close Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
