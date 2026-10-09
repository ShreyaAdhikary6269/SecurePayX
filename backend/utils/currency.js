const CURRENCY_SYMBOL = '₹';

// Formats a number as Indian rupees, for example 150000 becomes ₹1,50,000.00
function formatMoney(value) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return `${CURRENCY_SYMBOL}${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

module.exports = { CURRENCY_SYMBOL, formatMoney };