
import { Platform } from 'react-native';
import SimCardsManager from 'react-native-sim-cards-manager';

export const getDeviceSIMs = async () => {
  if (Platform.OS !== "android") return [];
  try {

    const data = await SimCardsManager.getSimCardsNative();

    console.log("RAW SIM DATA:", data);

    return Object.values(data);

  } catch (error) {

    console.log("SIM ERROR", error);

    return [];

  }
};


