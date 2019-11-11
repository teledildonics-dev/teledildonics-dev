import { Model, Nora } from "../lovense/models";
import { AsyncDisposable } from "../common/disposable";

/// The information we get or derive from the DeviceType call.
export type LovenseDeviceInfo = {
  /// Which Lovense model is this device?
  /// This does not specify the generation/revision.
  model: Model;
  /// A string ID uniquely identifying this device.
  /// Includes its production batch date and its Bluetooth MAC address.
  id: string;
};

// Supersceded~!

export abstract class Lovense extends AsyncDisposable {
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

export function isRotationLevel(n: number): n is RotationLevel {
  return Number.isFinite(n) && -20 <= n && n <= +20;
}

/// A rotation level with direction indicated by sign.
/// Positive values are clockwise, negative values are anticlockwise.
export type RotationLevel =
  | (-20 | -19 | -18 | -17 | -16 | -15 | -14 | -13 | -12 | -11)
  | (-10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1)
  | (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
  | (11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20);

export function isVibrationLevel(n: number): n is VibrationLevel {
  return Number.isFinite(n) && -20 <= n && n <= +20;
}

/// Vibration levels.
export type VibrationLevel =
  | (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
  | (11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20);
