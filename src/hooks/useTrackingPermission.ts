import { useEffect } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  PermissionStatus,
} from "expo-tracking-transparency";

const ATT_REQUESTED_KEY = "att_requested";

export function useTrackingPermission() {
  useEffect(() => {
    async function requestIfNeeded() {
      const already = await AsyncStorage.getItem(ATT_REQUESTED_KEY);
      if (already) return;

      const { status } = await getTrackingPermissionsAsync();
      if (status === PermissionStatus.UNDETERMINED) {
        await requestTrackingPermissionsAsync();
      }

      await AsyncStorage.setItem(ATT_REQUESTED_KEY, "true");
    }

    requestIfNeeded();
  }, []);
}
