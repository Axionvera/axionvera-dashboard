import { parseSorobanEvents } from '../utils/parseEvents';
import { xdr } from 'stellar-sdk';

describe('parseEvents', () => {
  describe('parseSorobanEvents', () => {
    it('should parse an empty array', () => {
      expect(parseSorobanEvents([])).toEqual([]);
    });

    it('should parse a raw Horizon event with XDR topics and value', () => {
      const mockRawEvents = [
        {
          id: '0000000001-00001',
          contractId: 'CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          ledger: 100,
          ledgerClosedAt: '2024-01-01T00:00:00Z',
          topic: [
            // Mocked ScVal for Symbol 'transfer'
            {
              switch: () => xdr.ScValType.scvSymbol(),
              symbol: () => ({ toString: () => 'transfer' })
            }
          ],
          value: {
            xdr: {
              switch: () => xdr.ScValType.scvString(),
              str: () => ({ toString: () => 'success' })
            }
          }
        }
      ];

      const parsed = parseSorobanEvents(mockRawEvents);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('transfer');
      expect(parsed[0].value).toBe('success');
      expect(parsed[0].topics).toContain('transfer');
    });

    it('should handle malformed event data gracefully', () => {
      const malformed = [{ id: 'bad' }];
      const parsed = parseSorobanEvents(malformed);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('unknown');
      expect(parsed[0].topics).toEqual([]);
    });

    it('should handle special characters in event values', () => {
      const mockRawEvents = [
        {
          topic: ['event_name'],
          value: '🚀 special characters test'
        }
      ];

      const parsed = parseSorobanEvents(mockRawEvents);
      expect(parsed[0].value).toBe('🚀 special characters test');
    });
  });
});
