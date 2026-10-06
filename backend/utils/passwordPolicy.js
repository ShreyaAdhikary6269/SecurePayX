const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  'password1',
  'password12',
  'password123',
  'password1234',
  'qwerty123',
  'qwerty1234',
  'abc12345',
  'abcd1234',
  'iloveyou1',
  'admin1234',
  'welcome123',
  'letmein123',
  'a1234567',
  'a12345678',
  '12345678a',
  '123456789a',
]);

// Returns an error message when the password is not acceptable, or null when it is fine.
function checkPassword(password, email = '') {
  if (typeof password !== 'string' || password === '') return 'Password is required';
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (password.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return 'That password is too common. Please choose another one';

  const namePart = String(email).split('@')[0].toLowerCase();
  if (namePart.length >= 4 && lower.includes(namePart)) {
    return 'Password must not contain your email name';
  }

  return null;
}

module.exports = { checkPassword, MIN_LENGTH, MAX_LENGTH };