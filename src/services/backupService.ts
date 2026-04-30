import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";

import { Achievement, UserProfile } from "@/state/AppStateContext";

const APP_VERSION = "1.0.0";
const BACKUP_FORMAT_VERSION = 1;

export type BackupData = {
  version: number;
  appVersion: string;
  exportedAt: string;
  profiles: UserProfile[];
  achievements: Record<string, Achievement[]>;
};

export const createBackup = async (
  profiles: UserProfile[],
  achievements: Record<string, Achievement[]>
): Promise<string> => {
  const zip = new JSZip();
  const exportedAt = new Date().toISOString();

  const photoMap: Record<string, string> = {};

  for (const records of Object.values(achievements)) {
    for (const achievement of records) {
      if (achievement.photoPath && !photoMap[achievement.photoPath]) {
        const originalPath = achievement.photoPath;
        const filename = originalPath.split("/").pop() ?? `photo_${achievement.id}.jpg`;
        const zipPath = `photos/${filename}`;
        photoMap[originalPath] = zipPath;

        const fileInfo = await FileSystem.getInfoAsync(originalPath);
        if (fileInfo.exists) {
          const base64 = await FileSystem.readAsStringAsync(originalPath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          zip.file(zipPath, base64, { base64: true });
        }
      }
    }
  }

  const exportedAchievements: Record<string, Achievement[]> = {};
  for (const [userId, records] of Object.entries(achievements)) {
    exportedAchievements[userId] = records.map((a) => ({
      ...a,
      photoPath: a.photoPath ? photoMap[a.photoPath] : undefined,
    }));
  }

  const backupData: BackupData = {
    version: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt,
    profiles,
    achievements: exportedAchievements,
  };

  zip.file("backup.json", JSON.stringify(backupData, null, 2));

  const base64Zip = await zip.generateAsync({ type: "base64" });
  const date = exportedAt.slice(0, 10).replace(/-/g, "");
  const outputUri = `${FileSystem.cacheDirectory}little-baby-log-backup-${date}.zip`;

  await FileSystem.writeAsStringAsync(outputUri, base64Zip, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return outputUri;
};
