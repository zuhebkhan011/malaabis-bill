/**
 * Malaabis Studio — Currency Utility
 * All monetary values formatted in INR (₹) using Indian number system
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as Indian Rupees
 * @param {number|string} value
 * @returns {string} e.g. "₹1,23,456"
 */
export function formatINR(value) {
  const num = Number(value) || 0;
  return INR_FORMATTER.format(num);
}

/**
 * Format a number as plain ₹ without Intl (fallback)
 * @param {number|string} value
 * @returns {string} e.g. "₹1,23,456"
 */
export function formatRupee(value) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default formatINR;
