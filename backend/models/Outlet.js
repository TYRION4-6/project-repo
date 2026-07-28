const mongoose = require("mongoose");

const OutletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    city: { type: String, required: true },
    locality: { type: String, required: true },
    contactNumber: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    managerId: { type: String, default: "mgr_1" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Outlet", OutletSchema);
