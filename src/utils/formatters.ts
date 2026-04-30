/**
 * Address and balance formatting utilities for the Axionvera Dashboard.
 */

/**
 * Truncates a Stellar address or hash for display purposes.
 * @param address The full address or hash to truncate
 * @param startChars Number of characters to show at the beginning
 * @param endChars Number of characters to show at the end
 * @returns Truncated string like "GBAB...XYZ"
 */
export function truncateAddress(
  address: string | null | undefined,
  startChars = 4,
  endChars = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a balance from Stroops (smallest unit) to a human-readable string.
 * Handles massive BigInt values with perfect decimal precision.
 *
 * @param amount Amount in Stroops as a string, bigint, or number
 * @param decimals Number of decimal places (default 7 for Soroban/Stellar)
 * @returns Formatted string with commas and up to specified decimal places
 */
export function formatBalance(
  amount: string | bigint | number | null | undefined,
  decimals = 7
): string {
  if (amount === undefined || amount === null || amount === '') return '0';

  let b: bigint;
  try {
    b = BigInt(amount);
  } catch {
    return '0';
  }

  const sign = b < 0n ? '-' : '';
  const absoluteValue = b < 0n ? -b : b;

  const divisor = BigInt(10 ** decimals);
  const integerPart = absoluteValue / divisor;
  const fractionalPart = absoluteValue % divisor;

  const fractionStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');

  // Use Intl.NumberFormat for thousands separators in the integer part
  const formattedInteger = new Intl.NumberFormat('en-US').format(integerPart);

  return fractionStr.length > 0
    ? `${sign}${formattedInteger}.${fractionStr}`
    : `${sign}${formattedInteger}`;
}
