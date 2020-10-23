const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  email: {
    required: true,
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    required: true,
    type: String,
  },
});

// This will get fired before saving any document
UserSchema.pre("save", async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// This will get fired after save
// UserSchema.post("save", function(){})

// Creating our own custom method to validate password
UserSchema.methods.isPasswordValid = async function (password) {
  try {
    return bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
