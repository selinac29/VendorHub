const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    default: undefined,
    set: (v) => (v === "" || v == null ? undefined : v),
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  displayName: {
    type: String,
    trim: true,
    default: "",
  },
  profilepicUrl: {
    type: String,
    trim: true,
    default: "",
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Points to the Event collection
    },
  ],
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
