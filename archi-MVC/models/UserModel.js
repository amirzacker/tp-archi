const { Schema, model } = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const userSchema = Schema({
  firstname: {
    type: String,
    require: false
  },
  lastname: {
    type: String,
    require: false
  },
  date: {
    type: Date,
    require: false
  },
  email: {
    type: String,
    required: true,
    max: 50,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    immutable: true
  },
  isCustomer: {
    type: Boolean,
    default: false,
    immutable: true
  },

}, { timestamps: true } );


userSchema.pre("save", async function () {
  this.email = this.email.toLowerCase();
});

userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.pre('findOneAndUpdate', async function() {
  // Check if the password field is being modified
  if (this._update.password) {
    // Hash the password before updating the user
    this._update.password = await bcrypt.hash(this._update.password, 10);
  }
});
userSchema.plugin(require('mongoose-autopopulate'));
module.exports = model("User", userSchema);
