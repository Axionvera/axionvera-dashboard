/**
 * Address and balance formatting utilities for the Axionvera Dashboard.
 */

/**
 * Truncates a Stellar address or hash for display purposes.
 * @param address The full address or hash to truncate
 * @param chars Number of characters to show at the beginning and end
 * @returns Truncated string like "GABC...XYZ"
 */
export function truncateAddress(address: string | null | undefined, chars = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Formats a balance from Stroops (smallest unit) to a human-readable string.
 * Handles massive BigInt values with perfect decimal precision.
 * 1 unit = 10,000,000 Stroops (7 decimal places).
 * 
 * @param stroops Amount in Stroops as a string, bigint, or number
 * @returns Formatted string with commas and up to 7 decimal places
 */
export function formatBalance(stroops: string | bigint | number | null | undefined): string {
  if (stroops === undefined || stroops === null || stroops === "") return "0";
  
  let b: bigint;
  try {
    b = BigInt(stroops);
  } catch {
    return "0";
  }

  const sign = b < 0n ? "-" : "";
  const absoluteValue = b < 0n ? -b : b;
  
  const divisor = BigInt(10_000_000);
  const integerPart = absoluteValue / divisor;
  const fractionalPart = absoluteValue % divisor;
  
  const fractionStr = fractionalPart.toString().padStart(7, "0").replace(/0+$/, "");
  
  // Use Intl.NumberFormat for thousands separators in the integer part
  const formattedInteger = new Intl.NumberFormat("en-US").format(integerPart);
  
  return fractionStr.length > 0 
    ? `${sign}${formattedInteger}.${fractionStr}`
    : `${sign}${formattedInteger}`;
}
