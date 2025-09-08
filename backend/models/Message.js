const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },          // např. "HRANIK"
    pharmacyCode: { type: String, required: false },    // např. "0064" (volitelné)
    scope: { type: String, enum: ["company", "pharmacy"], required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

MessageSchema.index({ company: 1, pharmacyCode: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
