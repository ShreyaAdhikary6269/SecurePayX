const bcrypt = require('bcryptjs');

// In-memory "database" - resets every time the server restarts.
// Swap this file for a Mongoose version later; the method names
// (findOne, findById, save, matchPassword) match Mongoose's API.
let users = [];
let idCounter = 1;

const byNewest = (a, b) => b.createdAt - a.createdAt || Number(b._id) - Number(a._id);

class User {
  constructor({ email, password, role = 'user' }) {
    this._id = String(idCounter++);
    this.id = this._id;
    this.email = email;
    this.password = password; // hashed in save()
    this.role = role === 'admin' ? 'admin' : 'user';
    this.isActive = true;
    this.lastLoginAt = null;
    this.createdAt = new Date();
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
    return users.find((u) => u._id === String(id)) || null;
  }

  // All users, newest first (used by the admin dashboard)
  static async all() {
    return [...users].sort(byNewest);
  }
}

module.exports = User;