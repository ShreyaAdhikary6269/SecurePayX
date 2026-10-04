// In-memory record of admin actions (who did what, to whom, when).
// Keeps the most recent 500 entries - resets on server restart.
let entries = [];
let idCounter = 1;
const MAX_ENTRIES = 500;

class AuditLog {
  static async record({ adminId, adminEmail, action, targetId, targetEmail, details, ip }) {
    const entry = {
      id: String(idCounter++),
      adminId,
      adminEmail,
      action,
      targetId,
      targetEmail,
      details,
      ip,
      createdAt: new Date(),
    };
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
    return entry;
  }

  // Newest first
  static async findAll() {
    return [...entries].reverse();
  }
}

module.exports = AuditLog;