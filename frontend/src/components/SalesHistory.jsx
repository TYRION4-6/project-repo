import React, { useState, useEffect } from "react";
import { Receipt, Search, Calendar, CreditCard, Building2 } from "lucide-react";
import { api } from "../api";

export default function SalesHistory({ outlets }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales(selectedOutlet);
      setSales(data);
    } catch (err) {
      console.error("Failed to load sales history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedOutlet]);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Sales Transaction Audit Log</h2>
          <p>Complete history of receipts and completed retail sales transactions</p>
        </div>

        <div className="filter-controls">
          <input
            type="text"
            className="text-input"
            placeholder="Search receipt #, branch or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="select-input"
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
          >
            <option value="">All Branch Outlets</option>
            {outlets.map((out) => (
              <option key={out._id} value={out._id}>
                {out.name} ({out.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Loading Sales History...
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Branch Outlet</th>
                <th>Purchased Items</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale._id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "#818cf8", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Receipt size={16} /> {sale.saleNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "white" }}>{sale.outletName}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                      {sale.items.map((it, idx) => (
                        <div key={idx}>
                          • {it.productName} ({it.quantity}x @ ₹{it.unitPrice})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#60a5fa",
                      }}
                    >
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                    ₹{sale.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {new Date(sale.saleDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
