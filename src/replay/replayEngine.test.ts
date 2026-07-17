import { ReplayEngine } from './replayEngine';
import { InMemoryEventStore } from './eventStore';
import { ReplayReportGenerator } from './reportGenerator';
import type { ProtocolEvent, StateReconstructor } from './types';

interface TestState {
  balance: number;
  history: string[];
}

describe('Replay Framework', () => {
  describe('InMemoryEventStore', () => {
    it('should add and retrieve events in order', async () => {
      const store = new InMemoryEventStore();
      const event1: ProtocolEvent = {
        id: '1',
        type: 'deposit',
        timestamp: 1000,
        data: { amount: 100 }
      };
      const event2: ProtocolEvent = {
        id: '2',
        type: 'withdraw',
        timestamp: 2000,
        data: { amount: 50 }
      };
      
      await store.addEvent(event2);
      await store.addEvent(event1);
      
      const events = await store.getEvents();
      
      expect(events.length).toBe(2);
      expect(events[0].id).toBe('1');
      expect(events[1].id).toBe('2');
    });
    
    it('should filter events by type', async () => {
      const store = new InMemoryEventStore({
        events: [
          { id: '1', type: 'deposit', timestamp: 1, data: {} },
          { id: '2', type: 'withdraw', timestamp: 2, data: {} },
          { id: '3', type: 'deposit', timestamp: 3, data: {} }
        ]
      });
      
      const events = await store.getEvents({ types: ['deposit'] });
      
      expect(events.length).toBe(2);
    });
  });

  describe('ReplayEngine', () => {
    it('should replay events and reconstruct state', async () => {
      const events: ProtocolEvent[] = [
        { id: '1', type: 'deposit', timestamp: 1, data: { amount: 100 } }
      ];
      const store = new InMemoryEventStore({ events });
      
      const reconstructor: StateReconstructor<TestState> = {
        initialState: { balance: 0, history: [] },
        applyEvent: (state, event) => {
          if (event.type === 'deposit') {
            return {
              balance: state.balance + (event.data.amount as number),
              history: [...state.history, event.id]
            };
          }
          return state;
        }
      };
      
      const engine = new ReplayEngine(store, reconstructor);
      const report = await engine.replay();
      
      expect(report.successCount).toBe(1);
      expect((report.finalState as TestState).balance).toBe(100);
    });
    
    it('should handle errors during replay', async () => {
      const events: ProtocolEvent[] = [
        { id: '1', type: 'deposit', timestamp: 1, data: { amount: 100 } }
      ];
      const store = new InMemoryEventStore({ events });
      
      const reconstructor: StateReconstructor<TestState> = {
        initialState: { balance: 0, history: [] },
        applyEvent: () => {
          throw new Error('Test error');
        }
      };
      
      const engine = new ReplayEngine(store, reconstructor);
      const report = await engine.replay();
      
      expect(report.errorCount).toBe(1);
    });
  });

  describe('ReplayReportGenerator', () => {
    it('should generate reports', () => {
      const mockReport = {
        startedAt: Date.now() - 100,
        finishedAt: Date.now(),
        totalEvents: 2,
        successCount: 2,
        errorCount: 0,
        steps: [],
        finalState: { balance: 100 }
      };
      
      const textReport = ReplayReportGenerator.generateTextReport(mockReport);
      const jsonReport = ReplayReportGenerator.generateJSONReport(mockReport);
      
      expect(textReport).toContain('Protocol Event Replay Report');
      expect(JSON.parse(jsonReport)).toEqual(mockReport);
    });
  });
});
