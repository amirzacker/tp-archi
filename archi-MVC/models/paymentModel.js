const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  restaurantId: String,
  reservationDate: Date,
  numberOfGuests: Number,
  amount: Number,
  transactionId: String,
  paymentStatus: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", PaymentSchema);
