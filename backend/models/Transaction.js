// In-memory "database" for logged fraud checks - resets on server restart.
// Swap for a Mongoose version later; dashboardController.js won't need changes
// as long as find() keeps returning an array sorted newest-first.
let transactions = [];
let idCounter = 1;

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
    return transactions
      .filter((t) => t.user === user)
      .sort((a, b) => b.createdAt - a.createdAt || Number(b._id) - Number(a._id));
  }
}

module.exports = Transaction;