/*
import { AsyncDisposable } from "../common/disposable";

// Trying a different approach.

export {};

type DeviceState =
  | {
      connected: false;
      vibration: undefined;
      rotation: undefined;
    }
  | {
      connected: unknown;
      vibration: undefined | VibrationLevel;
      rotation: undefined | RotationLevel;
    };

type TargetState =
  | {
      connected: false;
      vibration: undefined;
      rotation: undefined;
    }
  | {
      connected: true;
      vibration: VibrationLevel;
      rotation: RotationLevel;
    };

/// The public interface exposed by Lovense.
abstract class LovenseInterface extends AsyncDisposable {
  // The device's current vibration level, or undefined if unknown.
  abstract vibration: undefined | VibrationLevel;
  abstract async setVibration(vibration: VibrationLevel): Promise<VibrationLevel>;

  /// The device's current rotation level and direction, or undefined if unknown.
  abstract rotation: undefined | RotationLevel;
  abstract async setRotation(rotation: RotationLevel): Promise<RotationLevel>;

  async stop(): Promise<unknown> {
    return Promise.all([this.setVibration(0), this.setRotation(0)]);
  }
}

export class Lovense extends LovenseInterface {}

import { unwrap, unreachable, unsafe } from "../common/safety";
import { sleep, addTimeout } from "../common/async";
import { AsyncDisposable } from "../common/disposable";

abstract class State<T> {
  private nextChangeListeners: Array<(_event: unknown) => unknown> = [];
  private addEventListener(_name: "change", listener: (_events: unknown) => void, _options: {once: true}) {
    this.nextChangeListeners.push(listener);
  }
  public constructor(public initial: T) {

  }
}

export class Lovense extends AsyncDisposable {
  // === Static Properties
  private readonly device: BluetoothDevice;
  private readonly server: BluetoothRemoteGATTServer;
  private transmitter: BluetoothRemoteGATTCharacteristic = undefined as unsafe;
  private receiver: BluetoothRemoteGATTCharacteristic = undefined as unsafe;

  const nextVibration: Promise<void>;
  async vibration() {
    nextVib
    await lock();
    if 
  }

  constructor(device: BluetoothDevice) {
    super();

    this.device = device;
    this.server = unwrap(device.gatt);

    this.device.addEventListener("gattserverdisconnected", this.onDisconnect);
  }

  // === State Management

  /// How fast is the device vibrating?
  public get vibration() {
    return this.actualVibration;
  }
  /// How fast is the device vibrating?
  private actualVibration: Unknown | VibrationLevel = Unknown;
  /// How fast do we want the device to be vibrating?
  private targetVibration: VibrationLevel = Off;

  /// Are we connected to the device?
  public get connected() {
    return this.actualConnected;
  }
  /// Are we connected to the device?
  private actualConnected: boolean = false;
  /// Do we want to be connected to the device?
  private targetConnected: boolean = false;

  /// Whether the current actual and target states are the same.
  private isReconciled(): boolean {
    return !(
      this.actualConnected === this.targetConnected &&
      this.actualVibration === this.targetVibration
    );
  }

  /// A Promise for the result of a currently-running call to reconcile(),
  /// if one is in progress.
  private activeReconciliation: Promise<void> | undefined;

  /// Attempt to transition actual states to target states.
  private async reconcile() {
    if (this.activeReconciliation) {
      return this.activeReconciliation;
    }

    try {
      this.activeReconciliation = this.doReconcile();
      return await this.activeReconciliation;
    } finally {
      this.activeReconciliation = undefined;
    }
  }

  /// Implementation of reconcile().
  ///
  /// Safety: only one instance of this method may be running concurrently.
  private async doReconcile() {
    this.throwIfDisposeComplete();

    if (this.activeReconciliation) {
      return this.activeReconciliation;
    }

    if (this.isReconciled()) {
      return;
    }

    try {
      /// First we try to reconcile disconnected => connected, because we can't
      /// get anything else done until we're connected.
      if (this.targetConnected === true && this.actualConnected === false) {
        const connectionTimeout = 4000;
        await addTimeout(this.server.connect(), connectionTimeout);
        this.onConnect();
      }

      if (this.targetConnected && !this.actualConnected) {
        await this.server.disconnect();
        this.throwIfDisposeComplete();

        this.actualConnected = false;
      }

      if (this.targetConnected) {
      }
    } catch (error) {
      console.warn("Error during reconciliation.", error);
      await sleep(500);
      this.throwIfDisposeComplete();
    }

    if (!this.isReconciled()) {
      // The target states must have changed in the meanwhile. Try again.
      await this.reconcile();
    }
  }

  private onDisconnect() {
    this.actualConnected = false;
    this.actualVibration = Unknown;
    this.reconcile();
  }

  private onConnect() {
    this.actualConnected = true;
    this.reconcile();
  }

  // === Disposable Implementation

  async doDispose() {
    await this.doVibrate(0);
    await this.doDisconnect();
  }

  // === Public Interface Implementations
  //
  // These implementations are private because they can be called during disposal,
  // while actually public wrappers we expose below can not.

  /// Implementation of connect().
  private async doConnect(): Promise<void> {
    this.throwIfDisposeComplete();

    this.targetConnected = true;
    await this.reconcile;
    this.throwIfDisposeComplete();
  }

  /// Implementation of disconnect().
  private async doDisconnect(): Promise<void> {
    this.throwIfDisposeComplete();

    this.targetConnected = false;
    await this.reconcile; //// XXX: but this waits for everything to be reconciled, not just this state!
    this.throwIfDisposeComplete();
  }

  /// Implementation of vibrate().
  private async doVibrate(target: VibrationLevel): Promise<VibrationLevel> {
    this.throwIfDisposeComplete();

    this.targetConnected = true;
    this.targetVibration = target;
    await this.reconcile;
    this.throwIfDisposeComplete();

    if (this.actualVibration !== Unknown) {
      return this.actualVibration;
    } else {
      // After the first reconciliation it shouldn't be possible for actualVibration to be
      // Unknown.
      throw unreachable();
    }
  }

  // === Public Interface Exposed

  /// Connects to the device.
  private async connect(): Promise<void> {
    this.throwIfDisposeStarted();

    return this.doConnect();
  }

  /// Disconnects from the device.
  private async disconnect(): Promise<void> {
    this.throwIfDisposeStarted();

    return this.doDisconnect();
  }

  /// Sets the device's vibration vibration.
  ///
  /// If another .vibrate() call is made before this command is sent to the, device, this
  /// command will be skipped. The result of this function will reflect the final vibration
  /// that was actually set.
  private async vibrate(target: VibrationLevel): Promise<VibrationLevel> {
    this.throwIfDisposeStarted();

    return this.vibrate(target);
  }
}


export type Unknown = "unknown";
export const Unknown: Unknown = "unknown";

export const Off = 0;

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

  */
export {};
