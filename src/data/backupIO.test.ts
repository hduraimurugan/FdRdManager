import { writeFile, unlink, CachesDirectoryPath } from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';
import { pick, errorCodes } from '@react-native-documents/picker';
import { writeBackupFile, shareBackupFile, deleteBackupFile, pickBackupFileText } from './backupIO';
const originalFetch = globalThis.fetch;
beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { globalThis.fetch = originalFetch; });
describe('BIO: native backup adapter', () => {
  it('BIO-001 writes UTF-8 into cache and returns the exact path', async () => {
    await expect(writeBackupFile('{"name":"₹"}', 'backup.json')).resolves.toBe(`${CachesDirectoryPath}/backup.json`);
    expect(writeFile).toHaveBeenCalledWith(`${CachesDirectoryPath}/backup.json`, '{"name":"₹"}', 'utf8');
  });
  it('BIO-002 propagates write failures', async () => {
    jest.mocked(writeFile).mockRejectedValueOnce(new Error('disk full'));
    await expect(writeBackupFile('{}', 'b.json')).rejects.toThrow('disk full');
  });
  it('BIO-003 shares JSON with cancellation allowed', async () => {
    await shareBackupFile('/cache/b.json', 'b.json');
    expect(Share.open).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/b.json', type: 'application/json', failOnCancel: false }));
  });
  it('BIO-004 cancellation does not reject', async () => {
    jest.mocked(Share.open).mockRejectedValueOnce(new Error('cancelled'));
    await expect(shareBackupFile('/cache/b.json', 'b.json')).resolves.toBeUndefined();
  });
  it('BIO-005 cleanup is idempotent when the file is missing', async () => {
    jest.mocked(unlink).mockRejectedValueOnce(new Error('ENOENT'));
    await expect(deleteBackupFile('/cache/b.json')).resolves.toBeUndefined();
    expect(unlink).toHaveBeenCalledWith('/cache/b.json');
  });
  it('BIO-006 picker cancellation returns null', async () => {
    jest.mocked(pick).mockRejectedValueOnce({ code: errorCodes.OPERATION_CANCELED });
    await expect(pickBackupFileText()).resolves.toBeNull();
  });
  it('BIO-007 reads the selected content URI', async () => {
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://backup/1' }] as never);
    globalThis.fetch = jest.fn().mockResolvedValue({ text: async () => '{"ok":true}' });
    await expect(pickBackupFileText()).resolves.toBe('{"ok":true}');
    expect(globalThis.fetch).toHaveBeenCalledWith('content://backup/1');
  });
  it('BIO-008 propagates picker and fetch errors', async () => {
    jest.mocked(pick).mockRejectedValueOnce(new Error('picker unavailable'));
    await expect(pickBackupFileText()).rejects.toThrow('picker unavailable');
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://missing' }] as never);
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('read failed'));
    await expect(pickBackupFileText()).rejects.toThrow('read failed');
  });
});
