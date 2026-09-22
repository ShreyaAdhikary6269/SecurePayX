const bcrypt = require('bcryptjs');

// In-memory "database" - resets every time the server restarts.
// Swap this file for a Mongoose version later without touching Auth.js,
// since the method names (findOne, save, matchPassword) match Mongoose's API.
let users = [];
let idCounter = 1;

class User {
  constructor({ email, password }) {
    this._id = String(idCounter++);
    this.email = email;
    this.password = password; // hashed in save()
  }

  async save() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    users.push(this);
    return this;
  }

  async matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  static async findOne({ email }) {
    return users.find((u) => u.email === email) || null;
  }

  static async findById(id) {
    return users.find((u) => u._id === id) || null;
  }
}

module.exports = User;