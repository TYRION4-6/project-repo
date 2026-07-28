import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";

export default function ProductDetailModal({ product, isOpen, onClose }) {
    if (!isOpen || !product) return null;

    const defaultPlaceholder = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop";
    
    const allImages = (product.images && product.images.length > 0)
        ? product.images.filter(Boolean)
        : (product.image ? [product.image] : [defaultPlaceholder]);

    const displayImages = allImages.length > 0 ? allImages : [defaultPlaceholder];

    const [selectedImgIndex, setSelectedImgIndex] = useState(0);

    useEffect(() => {
        setSelectedImgIndex(0);
    }, [product]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const stock = product.stockLevel !== undefined ? product.stockLevel : 25;
    const threshold = product.lowStockAlertThreshold || 10;
    const isOut = stock === 0;
    const isLow = stock > 0 && stock <= threshold;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
                <div className="modal-header">
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={20} className="text-primary" />
                        {product.name}
                    </h3>
                    <button 
                        type="button" 
                        style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {/* Multiple Pictures Gallery View */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ position: "relative", width: "100%", height: "260px", borderRadius: "14px", overflow: "hidden", background: "rgba(17, 24, 39, 0.6)", border: "1px solid var(--border-color)" }}>
                            <img 
                                src={displayImages[selectedImgIndex] || defaultPlaceholder} 
                                alt={product.name} 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { e.target.src = defaultPlaceholder; }}
                            />
                            <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                                Picture {selectedImgIndex + 1} of {displayImages.length}
                            </div>
                        </div>

                        {/* Interactive Thumbnail Bar */}
                        {displayImages.length > 1 && (
                            <div style={{ display: "flex", gap: "10px", marginTop: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                                {displayImages.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedImgIndex(idx)}
                                        style={{
                                            border: selectedImgIndex === idx ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                                            borderRadius: "10px",
                                            padding: 0,
                                            background: "none",
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            width: "64px",
                                            height: "64px",
                                            flexShrink: 0,
                                            opacity: selectedImgIndex === idx ? 1 : 0.55,
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow: selectedImgIndex === idx ? "var(--shadow-glow)" : "none"
                                        }}
                                    >
                                        <img 
                                            src={imgUrl} 
                                            alt={`Thumbnail ${idx + 1}`} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            onError={(e) => { e.target.src = defaultPlaceholder; }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                        <div>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>SKU Code</span>
                            <code className="pm-sku-code">{product.sku}</code>
                        </div>
                        <div>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Category</span>
                            <span className="badge badge-success">{product.category}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Retail Price</span>
                            <span style={{ fontSize: "20px", fontWeight: "700", color: "var(--color-primary)" }}>{formatCurrency(product.price)}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Stock Status</span>
                            <span className={`badge ${isOut ? "badge-danger" : isLow ? "badge-warning" : "badge-success"}`}>
                                {isOut ? "Out of Stock" : isLow ? `Low Stock (${stock} pcs)` : `In Stock (${stock} pcs)`}
                            </span>
                        </div>
                    </div>

                    {product.description && (
                        <div style={{ marginBottom: "20px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Description</span>
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Close Details</button>
                </div>
            </div>
        </div>
    );
}
