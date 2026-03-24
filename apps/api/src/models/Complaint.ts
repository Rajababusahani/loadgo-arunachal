import mongoose, { Schema } from "mongoose";
import { COMPLAINT_STATUSES, type ComplaintStatus } from "@loadgo/shared";

const complaintSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    description: { type: String, required: true },
    status: { type: String, enum: COMPLAINT_STATUSES satisfies readonly ComplaintStatus[], default: "open", index: true },
    resolutionNotes: { type: String }
  },
  { timestamps: true }
);

export const ComplaintModel = mongoose.model("Complaint", complaintSchema);
