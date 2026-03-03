import { cleanupReplacedPhotoAsync, removeAchievementPhotoAsync } from '../src/services/achievementService';

jest.mock('../src/utils/photo', () => ({
  deleteIfExistsAsync: jest.fn(async () => undefined),
}));

import { deleteIfExistsAsync } from '../src/utils/photo';

describe('achievementService exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cleanupReplacedPhotoAsync deletes only when path changed', async () => {
    await cleanupReplacedPhotoAsync('/old.jpg', undefined);
    await cleanupReplacedPhotoAsync('/old.jpg', '/old.jpg');
    await cleanupReplacedPhotoAsync('/old.jpg', '/new.jpg');

    expect(deleteIfExistsAsync).toHaveBeenCalledTimes(1);
    expect(deleteIfExistsAsync).toHaveBeenCalledWith('/old.jpg');
  });

  test('cleanupReplacedPhotoAsync no-op when previous path missing', async () => {
    await cleanupReplacedPhotoAsync(undefined, '/new.jpg');
    expect(deleteIfExistsAsync).not.toHaveBeenCalled();
  });

  test('removeAchievementPhotoAsync delegates even for null input', async () => {
    await removeAchievementPhotoAsync('/target.jpg');
    await removeAchievementPhotoAsync(null);

    expect(deleteIfExistsAsync).toHaveBeenNthCalledWith(1, '/target.jpg');
    expect(deleteIfExistsAsync).toHaveBeenNthCalledWith(2, null);
  });
});
