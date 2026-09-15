import mongoose, { Schema } from 'mongoose';

const SupportTicketSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default
  mongoose.models.SupportTicket ||
  mongoose.model('SupportTicket', SupportTicketSchema);
