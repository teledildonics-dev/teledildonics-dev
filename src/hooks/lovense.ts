import Lovense from "../lovense/lovense";
import { useState, useEffect } from "react";
import { addTimeout, sleep } from "../common/async";

export const useLovense = (device: BluetoothDevice): Lovense | null => {
  const [lovense, setLovense] = useState();

  useEffect(() => {
    const lovense = (async () => {
      while (true) {
        try {
          return await addTimeout(Lovense.connect(device), 4000);
        } catch (error) {
          console.error("Failed to connect Lovense:", error);
          await sleep(1000);
          console.info("Re-attempting to connect Lovense...");
        }
      }
    })();

    lovense.then(setLovense);

    return () => {
      lovense.then(lovense => lovense.destroy());
    };
  }, [device]);

  return lovense;
};
