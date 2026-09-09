import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    dateInput: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dateOutput: {
      type: Date,
      default: null,
    },
    qui: {
      type: String,
      required: true,
      trim: true,
    },
    quoi: {
      type: String,
      required: true,
      trim: true,
    },
    combien: {
      type: Number,
      required: true,
      min: 0,
    },
    lanaGarde: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('Ticket', ticketSchema);