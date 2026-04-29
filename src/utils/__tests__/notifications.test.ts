import { toast } from 'sonner';
import { notify } from '../notifications';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

describe('notifications utility', () => {
  it('should call toast.success', () => {
    notify.success('Success', 'Description');
    expect(toast.success).toHaveBeenCalledWith('Success', { description: 'Description' });
  });

  it('should call toast.error', () => {
    notify.error('Error', 'Description');
    expect(toast.error).toHaveBeenCalledWith('Error', { description: 'Description' });
  });

  it('should call toast.info', () => {
    notify.info('Info', 'Description');
    expect(toast.info).toHaveBeenCalledWith('Info', { description: 'Description' });
  });

  it('should call toast.warning', () => {
    notify.warning('Warning', 'Description');
    expect(toast.warning).toHaveBeenCalledWith('Warning', { description: 'Description' });
  });

  it('should call toast.loading', () => {
    notify.loading('Loading');
    expect(toast.loading).toHaveBeenCalledWith('Loading');
  });

  it('should call toast.dismiss', () => {
    notify.dismiss('id');
    expect(toast.dismiss).toHaveBeenCalledWith('id');
  });
});
