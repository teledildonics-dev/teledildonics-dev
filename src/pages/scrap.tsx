import { FC, ReactElement, useState, useEffect } from "react";
import { AsyncDisposable } from "../common/disposable";
import { sleep } from "../common/async";
import { Model, Nora } from "../lovense/models";
import React from "react";
import BluetoothSelector from "../components/bluetooth-selector";
import { deviceProfile } from "../lovense/lovense";

export const ScrapPage: FC = () => {
  return <LovenseSelector onChange={() => {}} />;
};

export const LovenseSelector: FC<{
  onChange: (lovense: Lovense | undefined) => void;
}> = ({ onChange }) => {
  const [lovense, setLovense] = useState<Lovense>();
  const [info, setInfo] = useState<LovenseDeviceInfo>();

  useEffect(() => {
    if (!lovense) {
      return lovense;
    }

    let abortion = new AbortController();

    lovense.info().then(info => {
      if (abortion.signal.aborted) {
        return;
      }

      setInfo(info);
    });

    return () => {
      abortion.abort();
    };
  }, [lovense]);

  if (!lovense) {
    return (
      <div>
        <BluetoothSelector
          options={deviceProfile}
          onChange={event => {
            setInfo(undefined);
            const device = event.target.value;
            if (device) {
              const lovense = new LovenseDevice(device);
              setLovense(lovense);
              onChange(lovense);
            } else {
              setLovense(undefined);
              onChange(lovense);
            }
          }}
        />
        <button
          onClick={_event => {
            setInfo(undefined);
            const lovense = new LovenseFake();
            setLovense(lovense);
            onChange(lovense);
          }}
        >
          fake device
        </button>
      </div>
    );
  } else {
    let description = info ? JSON.stringify(info) : lovense.toString();
    return <div>selected {description}</div>;
  }
};

/// The information we get or derive from the DeviceType call.
export type LovenseDeviceInfo = {
  /// Which Lovense model is this device?
  /// This does not specify the generation/revision.
  model: Model;
  /// A string ID uniquely identifying this device.
  /// Includes its production batch date and its Bluetooth MAC address.
  id: string;
};

abstract class Lovense extends AsyncDisposable {
  /// Returns metadata about this device. Immutable, so, memoized.
  async info(): Promise<LovenseDeviceInfo> {
    if (!this.cachedInfo) {
      this.cachedInfo = this.info_();
    }

    return this.cachedInfo;
  }
  private cachedInfo: Promise<LovenseDeviceInfo> | undefined;
  protected abstract async info_(): Promise<LovenseDeviceInfo>;

  /// The device's current vibration level, or undefined if unknown.
  abstract vibration: VibrationLevel;
  async setVibration(vibration: VibrationLevel): Promise<VibrationLevel> {
    this.throwIfDisposeStarted();
    return this.setVibration_(vibration);
  }
  protected abstract async setVibration_(
    vibration: VibrationLevel
  ): Promise<VibrationLevel>;

  /// Whether this device is capable of rotation or not.
  async canRotate() {
    const { model } = await this.info();
    return model === Nora;
  }

  /// The device's current rotation level and direction, or undefined if unknown.
  ///
  /// Throws an error if the device does not support rotation.
  abstract rotation: RotationLevel;
  async setRotation(rotation: RotationLevel): Promise<RotationLevel> {
    if (!(await this.canRotate())) {
      throw new Error(`This device does not support rotation. Try .canRotate().`);
    }

    this.throwIfDisposeStarted();

    return this.setRotation_(rotation);
  }
  protected abstract async setRotation_(rotation: RotationLevel): Promise<RotationLevel>;

  async stop(): Promise<unknown> {
    this.throwIfDisposeStarted();
    return Promise.all([this.setVibration_(0), this.setRotation_(0)]);
  }

  protected async onDispose() {
    await Promise.all([this.setVibration_(0), this.setRotation_(0)]);
  }
}

export class LovenseFake extends Lovense {
  protected async info_() {
    return {
      model: Nora,
      id:
        "20191109" +
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

export class LovenseDevice extends LovenseFake {
  private device: BluetoothDevice;
  constructor(device: BluetoothDevice) {
    super();
    this.device = device;
  }
}

export function isRotationLevel(n: number): n is RotationLevel {
  return Number.isFinite(n) && -20 <= n && n <= +20;
}
export type RotationLevel =
  | (-20 | -19 | -18 | -17 | -16 | -15 | -14 | -13 | -12 | -11)
  | (-10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1)
  | (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
  | (11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20);

export function isVibrationLevel(n: number): n is RotationLevel {
  return Number.isFinite(n) && -20 <= n && n <= +20;
}

export type VibrationLevel =
  | (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
  | (11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20);
