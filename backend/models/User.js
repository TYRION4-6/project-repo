const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Manager", "Admin", "Staff", "Customer"], default: "Manager" },
    businessName: { type: String, default: "MetroRetail Outlets" },
    city: { type: String, default: "Mumbai" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password && (this.password.startsWith("$2a$") || this.password.startsWith("$2b$"))) {
    try {
      return await bcrypt.compare(enteredPassword, this.password);
    } catch (e) {
      return false;
    }
  }
  return enteredPassword === this.password;
};

module.exports = mongoose.model("User", UserSchema);
