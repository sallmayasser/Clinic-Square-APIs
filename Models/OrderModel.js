const mongoose = require("mongoose");

// 1- Create Schema
const orderSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: "Patient",
  },
  pharmacy: {
    type: mongoose.Schema.ObjectId,
    ref: "Pharmacy",
  },
  medicine: {
    type: [String],
  },
  totalCost: {
    type: String,
  },
  state: {
    type: String,
    enum: ["delivered", "shipping", "pending"],
    default: "pending",
  },
  
});

// 2- Create model
const OrderModel = mongoose.model("Order", orderSchema);

module.exports = OrderModel;
