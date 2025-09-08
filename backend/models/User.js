// backend/models/User.js
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city:   { type: String, default: "" },
    zip:    { type: String, default: "" },
    country:{ type: String, default: "" },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    locale:     { type: String, default: "cs" },
    newsletter: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false }, // nikdy nevracet hash
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    pharmacyCode: { type: String, default: null },

    // PROFIL (všechno volitelné)
    fullName:  { type: String, default: "" },
    company:   { type: String, default: "" },
    phone:     { type: String, default: "" },
    address:   { type: addressSchema, default: () => ({}) },
    avatarUrl: { type: String, default: "" },
    settings:  { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
