/**
 * Converts pence (integer) to formatted GBP string
 * @param {number} pence - Amount in pence (e.g., 1599)
 * @returns {string} Formatted string (e.g., "£15.99")
 */
export const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;
