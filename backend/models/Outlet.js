const mongoose = require("mongoose");

const outletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    city: { type: String, required: true }, // e.g. Mumbai, Delhi, Bengaluru, Hyderabad, Pune, Chennai
    locality: { type: String, required: true }, // e.g. Bandra West, Connaught Place, Indiranagar
    contactNumber: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive", "Renovating"], default: "Active" },
    managerId: { type: String, default: "default_manager" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Outlet", outletSchema);
