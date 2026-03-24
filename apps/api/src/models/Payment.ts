import mongoose, { Schema } from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from "@loadgo/shared";

const paymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    method: { type: String, enum: PAYMENT_METHODS satisfies readonly PaymentMethod[], required: true },
    status: { type: String, enum: PAYMENT_STATUSES satisfies readonly PaymentStatus[], default: "pending", index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model("Payment", paymentSchema);
