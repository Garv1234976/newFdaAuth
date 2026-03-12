
import SimCardsManager from 'react-native-sim-cards-manager';

export const getDeviceSIMs = async () => {
  try {

    const data = await SimCardsManager.getSimCardsNative();

    console.log("RAW SIM DATA:", data);

    return Object.values(data);

  } catch (error) {

    console.log("SIM ERROR", error);

    return [];

  }
};


