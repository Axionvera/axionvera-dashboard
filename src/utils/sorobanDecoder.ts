import { xdr, scValToNative } from 'stellar-sdk';

/**
 * Decodes a Soroban ScVal (XDR) into a human-readable JavaScript string.
 * Specifically handles Symbol, String, and Bytes types while providing
 * robust fallbacks to avoid [Object object] or technical garbage in the UI.
 * 
 * @param scVal - The Soroban ScVal to decode
 * @returns A UTF-8 string representation of the value, or an empty string if null/invalid
 */
export function decodeSorobanSymbol(scVal: any): string {
  if (!scVal) return '';

  // If it's already a string, just return it
  if (typeof scVal === 'string') return scVal;

  try {
    // 1. Direct XDR switch check (if scVal is a proper XDR object)
    if (scVal && typeof scVal === 'object' && typeof scVal.switch === 'function') {
      const type = scVal.switch();
      
      // Symbol type (ScvSymbol)
      if (type.value === xdr.ScValType.scvSymbol().value) {
        return scVal.symbol().toString();
      }
      
      // String type (ScvString)
      if (type.value === xdr.ScValType.scvString().value) {
        return scVal.str().toString();
      }
      
      // Bytes type (ScvBytes)
      if (type.value === xdr.ScValType.scvBytes().value) {
        const bytes = scVal.bytes();
        return Buffer.from(bytes).toString('utf8');
      }
    }

    // 2. If it's a Buffer, decode it
    if (Buffer.isBuffer(scVal)) {
      return scVal.toString('utf8');
    }

    // 3. Fallback to scValToNative if it looks like an ScVal
    // (scValToNative is strict and throws on invalid inputs)
    let native: any;
    if (scVal && typeof scVal === 'object' && typeof scVal.switch === 'function') {
      try {
        native = scValToNative(scVal);
      } catch {
        native = scVal;
      }
    } else {
      native = scVal;
    }

    if (native === null || native === undefined) {
      return '';
    }

    // If it's already a string, we're good
    if (typeof native === 'string') {
      return native;
    }

    // Handle remaining objects by stringifying
    if (typeof native === 'object') {
      try {
        const str = JSON.stringify(native);
        return str === '{}' ? '' : str;
      } catch {
        return '[Complex Value]';
      }
    }

    return String(native);
  } catch (error) {
    console.error('Error decoding Soroban value:', error);
    return '';
  }
}

/**
 * Decodes a raw Soroban RPC ScVal.
 *
 * Soroban RPC returns event topics and values as base64-encoded XDR strings.
 * If the input is not valid XDR, the original value is returned unchanged.
 */
export function decodeSorobanScVal(scVal: any): unknown {
  if (scVal === null || scVal === undefined) {
    return null;
  }

  try {
    if (typeof scVal === 'string') {
      try {
        const parsed = xdr.ScVal.fromXDR(scVal, 'base64');
        return scValToNative(parsed);
      } catch {
        return scVal;
      }
    }

    if (
      typeof scVal === 'object' &&
      typeof scVal.switch === 'function'
    ) {
      return scValToNative(scVal);
    }

    return scVal;
  } catch {
    return scVal;
  }
}
