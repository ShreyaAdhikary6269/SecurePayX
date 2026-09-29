// In-memory store for user feedback on fraud predictions - resets on restart.
let feedbackList = [];
let idCounter = 1;

class Feedback {
  constructor({ user, transactionId, verdict }) {
    this.id = String(idCounter++);
    this.user = user;
    this.transactionId = transactionId;
    this.verdict = verdict; // 'confirmed' or 'not_fraud'
    this.createdAt = new Date();
  }

  // One verdict per user per transaction: a new one replaces the old.
  async save() {
    feedbackList = feedbackList.filter(
      (f) => !(f.user === this.user && f.transactionId === this.transactionId)
    );
    feedbackList.push(this);
    return this;
  }

  static async find({ user }) {
    return feedbackList.filter((f) => f.user === user);
  }
}

module.exports = Feedback;