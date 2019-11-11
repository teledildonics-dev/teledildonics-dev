import { Model } from "../lovense/models";
import {
  VibrationLevel,
  RotationLevel,
  Lovense,
  LovenseDeviceInfo
} from "./lovense-abstract";
import { useEffect, useState } from "react";
import { unsafe } from "../common/safety";

type UseLovense =
  | undefined
  | {
      lovense: Lovense;
      model: Model;
      id: string;
      canRotate: true;
      stop(): Promise<unknown>;
      vibration: VibrationLevel;
      setVibration(level: VibrationLevel): Promise<VibrationLevel>;
      rotation: RotationLevel;
      setRotation(rotation: RotationLevel): Promise<RotationLevel>;
    };

export const useLovense = (lovense?: Lovense): UseLovense => {
  const [info, setInfo] = useState<LovenseDeviceInfo>();
  const [canRotate, setCanRotate] = useState(false);

  useEffect(() => {
    if (!lovense) {
      return;
    }

    Promise.all([lovense.info(), lovense.canRotate()]).then(([info, canRotate]) => {
      setInfo(info);
      setCanRotate(canRotate);
    });
  }, [lovense]);

  if (!(lovense && info)) {
    return;
  }

  return ({
    lovense,
    model: info.model,
    id: info.id,
    canVibrate: true,
    canRotate: canRotate
  } as unsafe) as UseLovense;
};
