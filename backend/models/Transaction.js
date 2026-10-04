// In-memory "database" for logged fraud checks - resets on server restart.
// Swap for a Mongoose version later; callers rely on find() returning
// an array sorted newest-first.
let transactions = [];
let idCounter = 1;

const byNewest = (a, b) => b.createdAt - a.createdAt || Number(b._id) - Number(a._id);

class Transaction {
  constructor({ user, paymentType, amount, fraudProbability, isFraud, thresholdUsed, rawInput }) {
    this._id = String(idCounter++);
    this.id = this._id; // frontend components read `id`
    this.user = user;
    this.paymentType = paymentType;
    this.amount = amount;
    this.fraudProbability = fraudProbability;
    this.isFraud = isFraud;
    this.thresholdUsed = thresholdUsed;
    this.rawInput = rawInput;
    this.createdAt = new Date();
  }

  async save() {
    transactions.push(this);
    return this;
  }

  static async find({ user }) {
    return transactions.filter((t) => t.user === user).sort(byNewest);
  }

  // Every user's transactions, newest first (used by the admin dashboard)
  static async findAll() {
    return [...transactions].sort(byNewest);
  }
}

module.exports = Transaction;