import { decodeSorobanSymbol } from '../utils/sorobanDecoder';
import { xdr } from 'stellar-sdk';

describe('sorobanDecoder', () => {
  describe('decodeSorobanSymbol', () => {
    it('should return an empty string for null or undefined', () => {
      expect(decodeSorobanSymbol(null)).toBe('');
      expect(decodeSorobanSymbol(undefined)).toBe('');
    });

    it('should decode a Soroban Symbol (scvSymbol)', () => {
      // Mocking ScVal for Symbol
      const mockScVal = {
        switch: () => xdr.ScValType.scvSymbol(),
        symbol: () => ({ toString: () => 'my_symbol' })
      };
      expect(decodeSorobanSymbol(mockScVal)).toBe('my_symbol');
    });

    it('should decode a Soroban String (scvString)', () => {
      // Mocking ScVal for String
      const mockScVal = {
        switch: () => xdr.ScValType.scvString(),
        str: () => ({ toString: () => 'hello world' })
      };
      expect(decodeSorobanSymbol(mockScVal)).toBe('hello world');
    });

    it('should decode Soroban Bytes (scvBytes)', () => {
      const testString = 'byte data';
      const bytes = Buffer.from(testString, 'utf8');
      
      const mockScVal = {
        switch: () => xdr.ScValType.scvBytes(),
        bytes: () => bytes
      };
      expect(decodeSorobanSymbol(mockScVal)).toBe(testString);
    });

    it('should handle native string values from scValToNative fallback', () => {
      expect(decodeSorobanSymbol('native string')).toBe('native string');
    });

    it('should handle Buffer values from scValToNative fallback', () => {
      const buf = Buffer.from('buffer data');
      expect(decodeSorobanSymbol(buf)).toBe('buffer data');
    });

    it('should handle objects by stringifying them to avoid [Object object]', () => {
      const obj = { key: 'value' };
      expect(decodeSorobanSymbol(obj)).toBe('{"key":"value"}');
    });

    it('should handle empty objects by returning an empty string', () => {
      expect(decodeSorobanSymbol({})).toBe('');
    });

    it('should handle special characters in strings', () => {
      const special = '🚀 Stellar Symbol! @#$%^&*()';
      expect(decodeSorobanSymbol(special)).toBe(special);
    });

    it('should return empty string on error and log it', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorScVal = {
        switch: () => { throw new Error('Test Error'); }
      };
      expect(decodeSorobanSymbol(errorScVal)).toBe('');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
