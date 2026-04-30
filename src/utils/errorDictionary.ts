export const DEFAULT_SOROBAN_ERROR_MESSAGE =
  "Transaction failed: An unexpected contract error occurred";

const sorobanErrorMappings: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /HostError:\s*Error\(WasmVm,\s*InvalidAction\)/i,
    message: "Invalid contract action. Please try again.",
  },
  {
    pattern: /HostError:\s*Error\(WasmVm,\s*InvalidInput\)/i,
    message: "Contract input is invalid. Please verify your request and try again.",
  },
  {
    pattern: /HostError:\s*Error\(WasmVm,\s*MissingArgument\)/i,
    message: "Contract request is missing required data.",
  },
  {
    pattern: /HostError:\s*Error\(WasmVm,\s*StorageFull\)/i,
    message: "Contract storage capacity reached. Please reduce the transaction size.",
  },
  {
    pattern: /Trap:\s*InsufficientFunds|insufficient\s*funds|balance.*insufficient|balance.*error/i,
    message: "Insufficient funds for deposit",
  },
  {
    pattern: /Trap:\s*Balance|balance.*overflow/i,
    message: "Insufficient funds for deposit",
  },
  {
    pattern: /Trap:\s*Sequence|sequence.*error|transaction.*out.*of.*sync|bad\s*sequence/i,
    message: "Transaction out of sync, please try again.",
  },
  {
    pattern: /Trap:\s*Unauthorized|unauthorized|permission\s*denied/i,
    message: "Permission denied for this contract operation.",
  },
  {
    pattern: /Trap:\s*Expired|transaction.*expired|expired/i,
    message: "Transaction expired. Please try again.",
  },
  {
    pattern: /Trap:\s*NotFound|resource.*not.*found/i,
    message: "Required contract resource was not found.",
  },
];

export const mapSorobanErrorToMessage = (error: Error | string): string | undefined => {
  const rawMessage = typeof error === 'string' ? error : error?.message || '';
  if (!rawMessage) {
    return undefined;
  }

  const matchingEntry = sorobanErrorMappings.find(({ pattern }) => pattern.test(rawMessage));
  if (matchingEntry) {
    return matchingEntry.message;
  }

  if (/hosterror|wasmvm|trap:|contract/i.test(rawMessage)) {
    console.error('Unrecognized Soroban contract error:', rawMessage);
    return DEFAULT_SOROBAN_ERROR_MESSAGE;
  }

  return undefined;
};
