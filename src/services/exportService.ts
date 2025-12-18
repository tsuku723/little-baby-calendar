import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { Achievement, UserProfile } from "@/state/AppStateContext";

const pad = (value: number) => value.toString().padStart(2, "0");

export async function exportAppDataToJson(params: {
  profiles: UserProfile[];
  achievements: Record<string, Achievement[]>;
}): Promise<void> {
  const { profiles, achievements } = params;

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      birthDate: p.birthDate,
      dueDate: p.dueDate,
      createdAt: p.createdAt,
    })),
    achievements,
  };

  const now = new Date();
  const fileName = `little-baby-calendar_export_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}.json`;

  const dir = FileSystem.documentDirectory;
  if (!dir) {
    throw new Error("Document directory is not available");
  }

  const fileUri = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri);
}
