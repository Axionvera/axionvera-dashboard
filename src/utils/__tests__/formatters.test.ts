import { truncateAddress, formatBalance } from '../formatters';

describe('formatters utility', () => {
  describe('truncateAddress', () => {
    it('should truncate a long address correctly', () => {
      const address = 'GBRP4S7X3Y3B3S3X3Y3B3S3X3Y3B3S3X3Y3B3S3X3Y3B3S3X3Y3B3S3X';
      expect(truncateAddress(address)).toBe('GBRP4S...3B3S3X');
    });

    it('should return an empty string for undefined/null input', () => {
      expect(truncateAddress(undefined)).toBe('');
      expect(truncateAddress(null as any)).toBe('');
      expect(truncateAddress('')).toBe('');
    });

    it('should not truncate if the address is short enough', () => {
      const shortAddr = 'GABC123';
      expect(truncateAddress(shortAddr, 4)).toBe(shortAddr);
    });

    it('should use default chars=6 if not provided', () => {
      const address = 'GDQP2KPQGKI76Z67S73YV7R66M2X7G4Y6NVYV7R66M2X7G4Y6NVY';
      expect(truncateAddress(address)).toBe('GDQP2K...4Y6NVY');
    });

    it('should respect custom chars parameter', () => {
      const address = 'GDQP2KPQGKI76Z67S73YV7R66M2X7G4Y6NVYV7R66M2X7G4Y6NVY';
      expect(truncateAddress(address, 4)).toBe('GDQP...6NVY');
    });

    it('should handle addresses exactly at the threshold', () => {
      // chars = 6, threshold = 15
      const exact = '123456789012345';
      expect(truncateAddress(exact, 6)).toBe(exact);
      
      const oneMore = '1234567890123456';
      expect(truncateAddress(oneMore, 6)).toBe('123456...123456');
    });
  });

  describe('formatBalance', () => {
    it('should return "0" for invalid inputs', () => {
      expect(formatBalance(undefined)).toBe('0');
      expect(formatBalance(null)).toBe('0');
      expect(formatBalance('')).toBe('0');
      expect(formatBalance('not a number')).toBe('0');
    });

    it('should format small integer values', () => {
      expect(formatBalance('10000000')).toBe('1');
      expect(formatBalance(20000000n)).toBe('2');
    });

    it('should format decimal values correctly', () => {
      expect(formatBalance('1000000')).toBe('0.1');
      expect(formatBalance('1')).toBe('0.0000001');
      expect(formatBalance('10000001')).toBe('1.0000001');
    });

    it('should handle massive BigInt values without precision loss', () => {
      // 100,000,000,000.1234567 XLM
      const massiveStroops = '1000000000001234567';
      expect(formatBalance(massiveStroops)).toBe('100,000,000,000.1234567');
      
      const evenLarger = 1000000000000000000000000n; // 10^23 Stroops = 10^16 XLM
      expect(formatBalance(evenLarger)).toBe('100,000,000,000,000,000');
    });

    it('should trim trailing zeros in the fractional part', () => {
      expect(formatBalance('15000000')).toBe('1.5');
      expect(formatBalance('15500000')).toBe('1.55');
      expect(formatBalance('15555550')).toBe('1.555555');
    });

    it('should handle negative balances', () => {
      expect(formatBalance('-10000000')).toBe('-1');
      expect(formatBalance('-10000001')).toBe('-1.0000001');
      expect(formatBalance('-5000000')).toBe('-0.5');
    });

    it('should handle zero correctly', () => {
      expect(formatBalance('0')).toBe('0');
      expect(formatBalance(0n)).toBe('0');
      expect(formatBalance(0)).toBe('0');
    });

    it('should format values with thousands separators', () => {
      expect(formatBalance('10000000000')).toBe('1,000');
      expect(formatBalance('12345678900000')).toBe('1,234,567.89');
    });
  });
});
