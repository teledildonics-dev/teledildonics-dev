import { LovenseFake } from "./lovense-fake";

/// Indicates that an operation did not suceed or fail, but was superseded and replaced  by
/// a subsequent operation which did then suceed.
export type superseded = "superseded";
export const superseded: superseded = "superseded";

export class LovenseDevice extends LovenseFake {
  private device: BluetoothDevice;
  constructor(device: BluetoothDevice) {
    super();
    this.device = device;
  }
}
