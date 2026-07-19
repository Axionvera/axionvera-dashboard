import { SearchStore } from '@/store/searchStore';

describe('SearchStore', () => {
  let store: SearchStore;

  beforeEach(() => {
    store = new SearchStore();
    sessionStorage.clear();
  });

  it('updates query and notifies subscribers', () => {
    const listener = jest.fn();
    store.subscribe(listener);
    store.setQuery('deposit');
    expect(store.getSnapshot().query).toBe('deposit');
    expect(listener).toHaveBeenCalled();
  });

  it('persists query and filters to sessionStorage', () => {
    store.setQuery('quorum');
    store.setFilters({ entityTypes: ['proposal'] });

    const fresh = new SearchStore();
    fresh.hydrate();

    expect(fresh.getSnapshot().query).toBe('quorum');
    expect(fresh.getSnapshot().filters.entityTypes).toEqual(['proposal']);
  });

  it('merges partial filter updates', () => {
    store.setFilters({ entityTypes: ['transaction'] });
    store.updateFilters({ status: ['success'] });
    expect(store.getSnapshot().filters).toEqual({
      entityTypes: ['transaction'],
      status: ['success'],
    });
  });

  it('clears filters to defaults', () => {
    store.setFilters({ entityTypes: ['proposal'], status: ['active'] });
    store.clearFilters();
    expect(store.getSnapshot().filters).toEqual({});
  });

  it('resets state and clears persistence', () => {
    store.setQuery('test');
    store.reset();
    expect(store.getSnapshot().query).toBe('');
    expect(sessionStorage.getItem('axionvera:search:state')).toBeNull();
  });

  it('toggles panel open state', () => {
    store.setOpen(true);
    expect(store.getSnapshot().isOpen).toBe(true);
    store.setOpen(false);
    expect(store.getSnapshot().isOpen).toBe(false);
  });
});
