import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env";
import { BookingModel } from "../models/Booking";
import { PaymentModel } from "../models/Payment";
import { ApiError } from "../utils/api-error";

let razorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!razorpay) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(500, "Razorpay is not configured");
    }

    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpay;
}

export async function createPaymentOrder(bookingId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const payment = await PaymentModel.findOne({ bookingId: booking._id });
  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  if (booking.paymentMethod === "cash") {
    payment.status = "cash_due";
    booking.paymentStatus = "cash_due";
    await Promise.all([payment.save(), booking.save()]);
    return {
      method: "cash",
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    };
  }

  if (env.USE_MOCK_SERVICES) {
    payment.razorpayOrderId = `mock_order_${booking.id}`;
    payment.status = "authorized";
    booking.paymentStatus = "authorized";
    await Promise.all([payment.save(), booking.save()]);

    return {
      method: booking.paymentMethod,
      orderId: payment.razorpayOrderId,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency,
      status: payment.status
    };
  }

  const order = await getRazorpayClient().orders.create({
    amount: Math.round(payment.amount * 100),
    currency: payment.currency,
    receipt: booking.id
  });

  payment.razorpayOrderId = order.id;
  payment.status = "authorized";
  booking.paymentStatus = "authorized";
  await Promise.all([payment.save(), booking.save()]);

  return {
    method: booking.paymentMethod,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: payment.status
  };
}

export async function verifyPaymentSignature(payload: {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const payment = await PaymentModel.findOne({ bookingId: payload.bookingId });
  const booking = await BookingModel.findById(payload.bookingId);
  if (!payment || !booking) {
    throw new ApiError(404, "Booking payment not found");
  }

  if (env.USE_MOCK_SERVICES) {
    payment.razorpayOrderId = payload.razorpayOrderId;
    payment.razorpayPaymentId = payload.razorpayPaymentId;
    payment.razorpaySignature = payload.razorpaySignature;
    payment.status = "paid";
    payment.paidAt = new Date();
    booking.paymentStatus = "paid";
    await Promise.all([payment.save(), booking.save()]);
    return { success: true };
  }

  const signature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  if (signature !== payload.razorpaySignature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  payment.razorpayOrderId = payload.razorpayOrderId;
  payment.razorpayPaymentId = payload.razorpayPaymentId;
  payment.razorpaySignature = payload.razorpaySignature;
  payment.status = "paid";
  payment.paidAt = new Date();
  booking.paymentStatus = "paid";

  await Promise.all([payment.save(), booking.save()]);
  return { success: true };
}
