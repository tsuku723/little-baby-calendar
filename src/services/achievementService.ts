import { deleteIfExistsAsync } from "@/utils/photo";

/**
 * 差し替え前後のパスを比較し、古い写真が不要になった場合に削除する。
 */
export const cleanupReplacedPhotoAsync = async (
  previousPhotoPath?: string,
  desiredPhotoPath?: string | null
): Promise<void> => {
  if (!previousPhotoPath) return;
  if (desiredPhotoPath === undefined) return;
  if (desiredPhotoPath === previousPhotoPath) return;

  await deleteIfExistsAsync(previousPhotoPath);
};

/**
 * 実績削除などで写真が不要になった場合に削除する。
 */
export const removeAchievementPhotoAsync = async (
  photoPath?: string | null
): Promise<void> => {
  await deleteIfExistsAsync(photoPath);
};
