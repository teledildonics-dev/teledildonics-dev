import Lovense from "../lovense/lovense";
import { useState, useEffect } from "react";

export const useLovense = (device: BluetoothDevice): Lovense | null => {
  const [lovense, setState] = useState();

  useEffect(() => {
    const lovense = new Lovense(device);

    setState(lovense);

    return () => {
      (async () => {
        try {
          await lovense.stop();
        } catch (error) {
          console.error("Error from stop command while cleaning up useLovense():", error);
        }
        await lovense.disconnect();
        await lovense.destroy();
      })();
    };
  }, [device]);

  return lovense;
};
