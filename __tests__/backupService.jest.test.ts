import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
}));

jest.mock('jszip');

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
const mockWriteAsStringAsync = FileSystem.writeAsStringAsync as jest.Mock;

let mockZipInstance: { file: jest.Mock; generateAsync: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockZipInstance = {
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue('base64zipdata'),
  };
  (JSZip as unknown as jest.Mock).mockImplementation(() => mockZipInstance);
  mockGetInfoAsync.mockResolvedValue({ exists: false });
  mockWriteAsStringAsync.mockResolvedValue(undefined);
});

const baseProfile = {
  id: 'u1',
  name: 'テストちゃん',
  birthDate: '2024-01-01',
  dueDate: null,
  settings: {
    showCorrectedUntilMonths: 24,
    ageFormat: 'ymd' as const,
    showDaysSinceBirth: true,
    lastViewedMonth: null,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
};

const baseAchievement = {
  id: 'a1',
  date: '2024-06-01',
  title: 'はじめての笑顔',
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

describe('BackupService', () => {
  test('プロフィールと記録が backup.json に含まれる', async () => {
    const { createBackup } = require('../src/services/backupService');
    const profiles = [baseProfile];
    const achievements = { u1: [baseAchievement] };

    await createBackup(profiles, achievements);

    expect(mockZipInstance.file).toHaveBeenCalledWith(
      'backup.json',
      expect.stringContaining('"テストちゃん"')
    );
    expect(mockZipInstance.file).toHaveBeenCalledWith(
      'backup.json',
      expect.stringContaining('"はじめての笑顔"')
    );
  });

  test('backup.json に version・appVersion・exportedAt が含まれる', async () => {
    const { createBackup } = require('../src/services/backupService');

    await createBackup([baseProfile], { u1: [baseAchievement] });

    const [, jsonString] = mockZipInstance.file.mock.calls.find(
      ([name]: [string]) => name === 'backup.json'
    );
    const parsed = JSON.parse(jsonString);
    expect(parsed.version).toBe(1);
    expect(parsed.appVersion).toBeDefined();
    expect(parsed.exportedAt).toBeDefined();
  });

  test('写真が存在する場合は photos/ に格納し photoPath を ZIP 内パスに変換する', async () => {
    const { createBackup } = require('../src/services/backupService');
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockReadAsStringAsync.mockResolvedValue('base64photo');

    const achievementWithPhoto = {
      ...baseAchievement,
      photoPath: 'file:///documents/photo_a1.jpg',
    };

    await createBackup([baseProfile], { u1: [achievementWithPhoto] });

    expect(mockZipInstance.file).toHaveBeenCalledWith(
      'photos/photo_a1.jpg',
      'base64photo',
      { base64: true }
    );

    const [, jsonString] = mockZipInstance.file.mock.calls.find(
      ([name]: [string]) => name === 'backup.json'
    );
    const parsed = JSON.parse(jsonString);
    expect(parsed.achievements.u1[0].photoPath).toBe('photos/photo_a1.jpg');
  });

  test('写真ファイルが存在しない場合は ZIP に含めない', async () => {
    const { createBackup } = require('../src/services/backupService');
    mockGetInfoAsync.mockResolvedValue({ exists: false });

    const achievementWithPhoto = {
      ...baseAchievement,
      photoPath: 'file:///documents/missing.jpg',
    };

    await createBackup([baseProfile], { u1: [achievementWithPhoto] });

    const photoFileCalls = mockZipInstance.file.mock.calls.filter(
      ([name]: [string]) => name.startsWith('photos/')
    );
    expect(photoFileCalls).toHaveLength(0);
  });

  test('generateAsync が失敗した場合は例外を投げる', async () => {
    const { createBackup } = require('../src/services/backupService');
    mockZipInstance.generateAsync.mockRejectedValue(new Error('ZIP生成失敗'));

    await expect(createBackup([baseProfile], {})).rejects.toThrow('ZIP生成失敗');
  });

  test('返り値のURIにファイル名と日付が含まれる', async () => {
    const { createBackup } = require('../src/services/backupService');

    const uri = await createBackup([baseProfile], {});

    expect(uri).toMatch(/little-baby-log-backup-\d{8}\.zip$/);
    expect(uri).toContain('file:///cache/');
  });

  test('同一写真パスは一度だけ ZIP に追加される', async () => {
    const { createBackup } = require('../src/services/backupService');
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockReadAsStringAsync.mockResolvedValue('base64photo');

    const sharedPhotoPath = 'file:///documents/shared.jpg';
    const achievements = {
      u1: [
        { ...baseAchievement, id: 'a1', photoPath: sharedPhotoPath },
        { ...baseAchievement, id: 'a2', photoPath: sharedPhotoPath },
      ],
    };

    await createBackup([baseProfile], achievements);

    const photoFileCalls = mockZipInstance.file.mock.calls.filter(
      ([name]: [string]) => name === 'photos/shared.jpg'
    );
    expect(photoFileCalls).toHaveLength(1);
  });
});
