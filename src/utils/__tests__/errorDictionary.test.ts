import { mapSorobanErrorToMessage, DEFAULT_SOROBAN_ERROR_MESSAGE } from '../errorDictionary';

describe('errorDictionary utility', () => {
  it('should map a Soroban HostError invalid action to a friendly message', () => {
    const rawError = 'HostError: Error(WasmVm, InvalidAction)';
    expect(mapSorobanErrorToMessage(rawError)).toBe('Invalid contract action. Please try again.');
  });

  it('should map an insufficient funds trap to a friendly message', () => {
    const rawError = 'Trap: InsufficientFunds';
    expect(mapSorobanErrorToMessage(rawError)).toBe('Insufficient funds for deposit');
  });

  it('should map a sequence error trap to a friendly message', () => {
    const rawError = 'Trap: SequenceMismatch';
    expect(mapSorobanErrorToMessage(rawError)).toBe('Transaction out of sync, please try again.');
  });

  it('should fallback to the default Soroban error message for unknown contract errors', () => {
    const rawError = 'HostError: Error(WasmVm, SomeNewError)';
    expect(mapSorobanErrorToMessage(rawError)).toBe(DEFAULT_SOROBAN_ERROR_MESSAGE);
  });

  it('should return undefined for unrelated errors', () => {
    expect(mapSorobanErrorToMessage('Network request failed')).toBeUndefined();
  });
});
