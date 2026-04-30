import type { VaultTx } from "./contractHelpers";

export interface CSVTransaction {
  "Transaction ID": string;
  "Type": string;
  "Amount (XLM)": string;
  "Status": string;
  "Date (UTC)": string;
  "Date (Local)": string;
  "Transaction Hash": string;
}

export function formatAmountForCSV(amount: string): string {
  // Ensure amount is properly formatted without scientific notation
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  
  // Format with up to 7 decimal places to prevent Excel rounding errors
  // Use toFixed to ensure consistent decimal representation
  return num.toFixed(7);
}

export function formatDateForCSV(date: Date | string | number): {
  utc: string;
  local: string;
} {
  const d = new Date(date);
  
  // ISO format for UTC (standard for data exchange)
  const utc = d.toISOString();
  
  // Local format for human readability in user's timezone
  const local = d.toLocaleString();
  
  return { utc, local };
}

export function convertTransactionsToCSV(transactions: VaultTx[]): string {
  if (!transactions.length) {
    return "";
  }

  // Prepare CSV data with proper headers
  const headers: (keyof CSVTransaction)[] = [
    "Transaction ID",
    "Type",
    "Amount (XLM)",
    "Status",
    "Date (UTC)",
    "Date (Local)",
    "Transaction Hash"
  ];

  // Convert each transaction to CSV row
  const rows = transactions.map((tx) => {
    const dates = formatDateForCSV(tx.createdAt);
    
    return {
      "Transaction ID": tx.id,
      "Type": tx.type.charAt(0).toUpperCase() + tx.type.slice(1), // Capitalize first letter
      "Amount (XLM)": formatAmountForCSV(tx.amount),
      "Status": tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
      "Date (UTC)": dates.utc,
      "Date (Local)": dates.local,
      "Transaction Hash": tx.hash || "N/A"
    };
  });

  // Convert to CSV string with proper escaping
  const escapeCSVField = (field: string | number): string => {
    const stringField = String(field);
    // If field contains comma, newline, or double quote, wrap in double quotes
    if (stringField.includes(",") || stringField.includes("\n") || stringField.includes('"')) {
      // Replace double quotes with two double quotes (CSV escaping)
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // Create header row
  const headerRow = headers.map(escapeCSVField).join(",");
  
  // Create data rows
  const dataRows = rows.map((row) =>
    headers.map((header) => escapeCSVField(row[header])).join(",")
  );

  // Combine with BOM for UTF-8 encoding (helps Excel with special characters)
  const bom = "\uFEFF";
  return bom + [headerRow, ...dataRows].join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  if (!csvContent) {
    console.warn("No CSV content to download");
    return;
  }

  // Create blob with proper MIME type
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export function generateFilename(address: string | null): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const addressSuffix = address ? shortenAddressForFilename(address) : "unknown";
  return `axionvera_history_${addressSuffix}_${timestamp}.csv`;
}

function shortenAddressForFilename(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function getCSVSummary(transactions: VaultTx[]): {
  totalCount: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalClaims: string;
} {
  const deposits = transactions.filter(tx => tx.type === "deposit");
  const withdrawals = transactions.filter(tx => tx.type === "withdraw");
  const claims = transactions.filter(tx => tx.type === "claim");
  
  const sumAmounts = (txs: VaultTx[]) => 
    txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(7);
  
  return {
    totalCount: transactions.length,
    totalDeposits: sumAmounts(deposits),
    totalWithdrawals: sumAmounts(withdrawals),
    totalClaims: sumAmounts(claims)
  };
}