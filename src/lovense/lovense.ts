/// Allows Lovense devices to be controlled with WebBluetooth.
///
/// See protocol documentation at
/// https://stpihkal.docs.buttplug.io/hardware/lovense.html.

import { assert, first, unwrap, only, unsafe, Lock, AsyncDestroy } from "../common/safety";
import utf8 from "../common/utf8";
import { withEventStream } from "../common/events";
import { addTimeout, sleep } from "../common/async";
import { Model, modelsById, modelCapabilities, DeviceCapabilities } from "./models";

type EventType = "connect" | "disconnect";

export default class Lovense implements AsyncDestroy {
  // TODO: this generic opaque lock might not be a useful abstraction here
  // we might want a request queue that's visible to this class
  /// A lock used to serialize all Bluetooth calls, since the protocol isn't concurrency-safe.
  private lock: Lock = new Lock();
  /// Returns an Promise<Error> if this instance is being or has been destroyed, else null.
  private destroyed: Promise<Error> | null = null;
  /// A promise for the result of an active connection attempt if one is in progress,
  /// or undefined if we're disconnected and aren't currently tying to conect.
  private connected: undefined | Promise<void>;
  /// The number of times we have attempted to connect.
  private connectionCount: number = 0;

  private device: BluetoothDevice;
  private server: BluetoothRemoteGATTServer;

  /// Safety: these must only be accessed after we've connected (which initializes them).
  private service: BluetoothRemoteGATTService = undefined as unsafe;
  private characteristics: BluetoothRemoteGATTCharacteristic[] = undefined as unsafe;
  private transmitter: BluetoothRemoteGATTCharacteristic = undefined as unsafe;
  private receiver: BluetoothRemoteGATTCharacteristic = undefined as unsafe;

  /// Maximum of time to wait for a response before we mark a call as failed.
  private callTimeout: number = 4000;

  /// Safari doesn't support new EventTarget.
  private eventTarget: EventTarget = document.createElement("teledildonics-EventTarget");

  public constructor(device: BluetoothDevice) {
    this.device = device;
    this.server = unwrap(device.gatt, "Bluetooth device did not support GATT");

    this.connected = undefined;
  }

  deviceName() {
    return this.device.name || this.device.id;
  }

  private logPrefix(): string {
    return `${this.deviceName()
      .slice(0, 10)
      .padStart(10)}:`;
  }

  public addEventListener(type: EventType, listener: (event: unknown) => void): unknown {
    return this.eventTarget.addEventListener(type, listener);
  }

  public removeEventListener(type: EventType, listener: (event: unknown) => void): unknown {
    return this.removeEventListener(type, listener);
  }

  /// Connects to the device if not already connected.
  public async connect(): Promise<void> {
    if (this.destroyed) {
      throw await this.destroyed;
    }

    if (this.connected) {
      return this.connected;
    }

    console.info(this.logPrefix(), "Connecting.");

    this.connectionCount += 1;
    this.connected = addTimeout(
      (async () => {
        await this.server.connect();

        if (this.destroyed) {
          throw await this.destroyed;
        }

        const onMessage = (event: { target: { value: DataView } }) => {
          assert(event && event.target && event.target.value instanceof DataView);
          const binary: DataView = event.target.value;

          const s = utf8.decode(binary);
          console.info(
            `${this.logPrefix()} got  %c${s}`,
            "color: #131; font-weight: bold; border: 1px solid #131; padding: 2px 6px; background: #EEE;"
          );
        };

        const onDisconnected = () => {
          console.info(this.logPrefix(), "Disconnected.");
          this.connected = undefined;
          this.device.removeEventListener("gattserverdisconnected", onDisconnected);
          if (this.receiver) {
            this.receiver.removeEventListener(
              "characteristicvaluechanged",
              onMessage as unsafe
            );
          }
          this.eventTarget.dispatchEvent(new Event("disconnect"));
        };

        this.device.addEventListener("gattserverdisconnected", onDisconnected);

        this.service = only(await this.server.getPrimaryServices());
        this.characteristics = await this.service.getCharacteristics();
        this.transmitter = only(this.characteristics.filter(c => c.properties.write));
        this.receiver = only(this.characteristics.filter(c => !c.properties.write));

        this.receiver.addEventListener("characteristicvaluechanged", onMessage as unsafe);

        await this.receiver.startNotifications();

        this.eventTarget.dispatchEvent(new Event("connect"));

        if (this.destroyed) {
          throw await this.destroyed;
        }
      })(),
      6000,
      new Error("Initial connection to Lovense timed out")
    );

    this.connected.catch(() => {
      this.connected = undefined;
    });

    return this.connected;
  }

  /// Disconnects from the device if connected.
  public async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await this.connected;
      } catch (error) {
        return;
      }
    }

    console.info(this.logPrefix(), "Disconnecting");

    await this.server.disconnect();
  }

  /// Runs a callback after ensure we're connected, and retries if it throws
  /// an error but the connection was lost.
  private async connectAndRetry<T>(f: () => T): Promise<T> {
    while (true) {
      while (true) {
        if (this.destroyed) {
          throw await this.destroyed;
        }

        try {
          await this.connect();
          break;
        } catch (error) {
          console.error(this.logPrefix(), "Failed to connect", error);
          await sleep(500);
          continue;
        }
      }

      const connectionCount = this.connectionCount;
      try {
        return f();
      } catch (error) {
        if (this.connected === undefined || this.connectionCount > connectionCount) {
          console.warn(
            this.logPrefix(),
            "disconnected then",
            error,
            "was thrown. Retrying in 1s."
          );
          await sleep(500);
          await this.connect();
          continue;
        } else {
          console.error(
            this.logPrefix(),
            "didn't disconnnect but command still failed. Retrying in 10s.",
            error
          );
          await sleep(10000);
          continue;
        }
      }
    }
  }

  /// Cleans up all resources assocaited with this instance, disconnects, and makes it unusable.
  public async destroy(error: Error = new Error("Lovense::destroy()ed")): Promise<Error> {
    if (!this.destroyed) {
      this.destroyed = (async () => {
        try {
          // Let any commands that are already called complete, but destroy the rest.
          try {
            await this.lock.use(async () => {
              throw new Error("Lovense instance destroyed");
            });
          } catch (_) {}

          await this.disconnect();

          this.device = null as unsafe;
          this.server = null as unsafe;
          this.transmitter = null as unsafe;
          this.receiver = null as unsafe;
        } finally {
          return error;
        }
      })();
    }
    return this.destroyed;
  }

  public async call<Result>(
    request: string,
    handler: (responses: ReadableStreamReader<string>) => Promise<Result>,
    timeout: number | undefined = this.callTimeout
  ): Promise<Result> {
    if (this.destroyed) {
      throw await this.destroyed;
    }

    if (handler === undefined) {
      // Only for convenience during debugging, since the static type signature requires a handler.
      console.warn(this.logPrefix(), "call() handler was null");
      handler = (async () => {}) as unsafe;
    }

    return this.lock.use(async () =>
      this.connectAndRetry(() => {
        let result = withEventStream(
          this.receiver,
          "characteristicvaluechanged",
          (event: unsafe) => {
            assert(event && event.target && event.target.value instanceof DataView);
            const binary: DataView = event.target.value;
            return utf8.decode(binary);
          },
          async responses => {
            console.info(
              `${this.logPrefix()} sent %c${request}`,
              "color: purple; font-weight: bold; border: 1px solid purple; padding: 2px 6px; background: #EEE;"
            );
            await this.transmitter.writeValue(utf8.encode(request));
            return await handler(responses);
          }
        );

        if (timeout !== undefined) {
          result = addTimeout(result, timeout);
        }

        return result;
      })
    );
  }

  /// The DeviceType response never changes, so we can cache it as soon as we have it.
  private cachedInfo: undefined | LovenseDeviceInfo = undefined;

  /// Returns information about the device
  public async info(): Promise<LovenseDeviceInfo> {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    return this.call("DeviceType;", async responses => {
      const { value } = await responses.read();
      const [id, firmware, serial] = value.slice(0, -1).split(":");
      const model = unwrap(modelsById.get(id));
      const capabilities = unwrap(modelCapabilities.get(model));
      this.cachedInfo = {
        id,
        model,
        firmware: Number(firmware),
        capabilities,
        serial
      };
      return this.cachedInfo;
    });
  }

  /// Returns the battery level as a value between 0.0 and 1.0.
  public async battery(): Promise<number> {
    const value = await this.call("Battery;", async responses => {
      const { value } = await responses.read();
      return value;
    });

    let body = unwrap(first(value.split(";")));

    if (body[0] === "s") {
      console.warn(
        this.logPrefix(),
        "Got `s` prefix in battery value. Not sure why this happens."
      );
      // This seems to be what happens if you request the battery level while it's currently vibrating.
      // Maybe it's the way you check if it's active, so you know if you need to stop it?
      body = body.slice(1);
    }

    const level = Number(body);

    if (!(Number.isSafeInteger(level) && 0 <= level && level <= 100)) {
      throw new Error("Battery should be integer from 0-100.");
    }

    return level / 100.0;
  }

  /// Returns the production batch date of this device.
  public async batch(): Promise<number> {
    return this.call("GetBatch;", async responses => {
      const { value } = await responses.read();
      return Number(unwrap(first(value.split(/[;,]/))));
    });
  }

  /// Set the vibration level to a value between 0.0 and 1.0.
  public async vibrate(power: number): Promise<void> {
    if (!(0 <= power && power <= 1.0)) {
      throw new Error("Power must be from 0.0-1.0.");
    }

    const level = Math.round(power * 20.0);

    if (!(Number.isSafeInteger(level) && 0 <= level && level <= 20)) {
      throw new Error("Level must be integer from 0-20.");
    }

    return this.call(`Vibrate:${level};`, async responses => {
      const { value } = await responses.read();
      assert(value === "OK;", "Unexpected response to Vibrate command.");
    });
  }

  /// Set the rotation level to a value between -1.0 (anticlockwise) and +1.0 (clockwise).
  public async rotate(power: number): Promise<void> {
    if (!(-1.0 <= power && power <= 1.0)) {
      throw new Error("Power must be from -1.0 to +1.0.");
    }

    let command;
    if (power > 0) {
      command = "Rotate:True";
    } else if (power < 0) {
      command = "Rotate:False";
    } else {
      command = "Rotate";
    }

    const level = Math.round(Math.abs(power * 20.0));

    if (!(Number.isSafeInteger(level) && 0 <= level && level <= 20)) {
      throw new Error("Level must be integer from 0-20.");
    }

    return this.call(`${command}:${level};`, async responses => {
      const { value } = await responses.read();
      assert(value === "OK;", "Unexpected response to Rotate command.");
    });
  }

  /// Return a pattern currently set on the device.
  ///
  /// The result is an array of values between 0.0 and 1.0, each indicating the
  /// target power level for half of a second.
  private async getPattern(index: number): Promise<Array<number>> {
    return this.call(
      `GetPatten:${index};`,
      async responses => {
        const powers = [];
        while (true) {
          const { value } = await responses.read();
          if (value === "ER;") {
            throw new Error("Got Error response from device.");
          }
          assert(
            /^P[0-9]:[0-9]{1,2}\/[0-9]{1,2}:[0-9]+;$/.test(value),
            "Unexpected response to GetPatten:#"
          );
          const body = unwrap(first(value.split(";")));
          const [tag, part, levels] = body.split(/:/g);
          assert(tag === `P${index}`, "Got pattern response for wrong index!");
          const [partIndex, partCount] = part.split("/");
          powers.push(...[...levels].map(digit => Number(digit) / 9.0));
          if (partIndex === partCount) {
            break;
          }
        }
        return powers;
      },
      this.callTimeout * 10
    );
  }

  /// Return all patterns currently set on the device.
  ///
  /// The result is an array of arrays of values between 0.0 and 1.0,
  /// each indicating the target power level for half of a second.
  public async patterns(): Promise<Array<Array<number>>> {
    const response = await this.call(`GetPatten;`, async responses => {
      const { value } = await responses.read();
      return value;
    });
    assert(/^P:0?1?2?3?4?5?6?7?8?9?;$/.test(response), "Unexpected response to GetPatten");
    const indices = unwrap(first(response.slice(2).split(";")));
    const patterns = [];
    for (const index of indices) {
      patterns.push(await this.getPattern(Number(index)));
    }
    return patterns;
  }

  /// Starts running a programmed pattern on loop.
  ///
  ///
  public async startPattern(index: number): Promise<void> {
    return this.call(`Preset:${index};`, async responses => {
      const { value } = await responses.read();
      assert(value === "OK;", "Unexpected response to preset command.");
    });
  }

  /// Stops all activity on the device.
  public async stop(): Promise<void> {
    const { capabilities } = await this.info();
    if (capabilities.vibration) {
      await this.vibrate(0);
    }
    if (capabilities.rotation) {
      await this.rotate(0);
    }
  }
}

/// The information we get or derive from the DeviceType call.
export type LovenseDeviceInfo = {
  id: string;
  model: Model;
  capabilities: DeviceCapabilities;
  firmware: number;
  serial: string;
};

/// WebBluetooth device profile covering all Lovense devices and services.
export const deviceProfile = {
  filters: [{ namePrefix: "LVS-" }],
  optionalServices: [
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    ...[..."45"]
      .map(a =>
        [..."0123456789abcdef"].map(b =>
          [..."34"].map(c => `${a}${b}300001-002${c}-4bd4-bbd5-a6920e4c5653`)
        )
      )
      .flat(3)
  ]
};
