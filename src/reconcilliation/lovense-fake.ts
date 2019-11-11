import { Lovense } from "./lovense-abstract";

import { Nora } from "../lovense/models";

import { VibrationLevel, RotationLevel } from "./lovense-abstract";

import { sleep } from "../common/async";

export class LovenseFake extends Lovense {
  protected async info_() {
    return {
      model: Nora,
      id:
        "191109" +
        performance
          .now()
          .toString(16)
          .slice(6)
    };
  }

  public vibration: VibrationLevel = 0;
  protected async setVibration_(vibration: VibrationLevel) {
    await sleep(250);
    this.vibration = vibration;
    return vibration;
  }

  public rotation: RotationLevel = 0;
  protected async setRotation_(rotation: RotationLevel) {
    await sleep(250);
    this.rotation = rotation;
    return rotation;
  }
}
