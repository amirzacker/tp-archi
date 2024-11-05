const { Schema, model } = require("mongoose");

const PaymentSchema = new Schema({
  restaurantId: String,
  reservationDate: Date,
  numberOfGuests: Number,
  amount: Number,
  transactionId: String,
  paymentStatus: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    autopopulate: true
  },
}, { timestamps: true });

PaymentSchema.plugin(require('mongoose-autopopulate'));
module.exports = model("Payment", PaymentSchema);
