/// Allows Lovense devices to be controlled with WebBluetooth.
///
/// See protocol documentation at
/// https://stpihkal.docs.buttplug.io/hardware/lovense.html.

import { assert, first, unwrap, only, throwIf, unsafe } from "./safety";
import utf8 from "./utf8";
import { withEventStream } from "./events";

export default class Lovense {
  /// Prompts the user for Bluetooth access to a local Lovense device,
  /// then connects to it.
  ///
  /// This must be called from a synchronous response to a user input event.
  public static async request(): Promise<Lovense> {
    const device = await navigator.bluetooth.requestDevice(deviceProfile);

    let lovense;
    {
      const server = await unwrap(device.gatt).connect();
      const service = only(await server.getPrimaryServices());
      const characteristics = await service.getCharacteristics();
      const transmitter = only(characteristics.filter(c => c.properties.write));
      const receiver = only(characteristics.filter(c => !c.properties.write));
      receiver.startNotifications();
      lovense = new Lovense(device, server, transmitter, receiver);
    }

    try {
    } catch (error) {
      lovense.destroy(error);
      throw error;
    }

    return lovense;
  }

  private destroyed: Error | null = null;
  private responseLogger: (event: unsafe) => void;

  private constructor(
    private device: BluetoothDevice,
    private server: BluetoothRemoteGATTServer,
    private transmitter: BluetoothRemoteGATTCharacteristic,
    private receiver: BluetoothRemoteGATTCharacteristic
  ) {
    this.responseLogger = (event: unsafe) => {
      assert(event && event.target && event.target.value instanceof DataView);
      const binary: DataView = event.target.value;
      const s = utf8.decode(binary);
      console.debug(this.device.name, "received", s);
    };
    this.receiver.addEventListener("characteristicvaluechanged", this.responseLogger);
  }

  private async call<Result>(
    request: string,
    handler: (responses: ReadableStreamReader<string>) => Promise<Result>
  ): Promise<Result> {
    return withEventStream(
      this.receiver,
      "characteristicvaluechanged",
      (event: unsafe) => {
        assert(event && event.target && event.target.value instanceof DataView);
        const binary: DataView = event.target.value;
        return utf8.decode(binary);
      },
      async responses => {
        await this.transmitter.writeValue(utf8.encode(request));
        return await handler(responses);
      }
    );
  }

  public destroy(error: Error = new Error("Lovense::destroy()ed")) {
    throwIf(this.destroyed);
    this.destroyed = error;

    this.receiver.removeEventListener("characteristicvaluechanged", this.responseLogger);
    this.server.disconnect();

    this.responseLogger = null as unsafe;
    this.device = null as unsafe;
    this.server = null as unsafe;
    this.transmitter = null as unsafe;
    this.receiver = null as unsafe;
  }

  /// Return the model name of this device.
  public async deviceType(): Promise<string> {
    return this.call("DeviceType;", async responses => {
      const { value } = await responses.read();
      const modelId = unwrap(first(value.split(":")));
      return modelNames.get(modelId)!;
    });
  }

  /// Returns the battery level as a value between 0.0 and 1.0.
  public async battery(): Promise<number> {
    return this.call("Battery;", async responses => {
      const { value } = await responses.read();
      const level = Number(only(value.split(";")));

      if (!(Number.isSafeInteger(level) && 0 <= level && level <= 100)) {
        throw new Error("Battery should be integer from 0-100.");
      }

      return level / 100.0;
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

    return this.call(`Vibrate:${level}`, async responses => {
      const { value } = await responses.read();
      assert(value === "Ok;", "Unexpected response to vibration command.");
    });
  }

  /// Return a patterns currently set on the device.
  ///
  /// The result is an array of values between 0.0 and 1.0, each indicating the
  /// target power level for half of a second.
  public async getPattern(index: number): Promise<Array<number>> {
    return this.call(`GetPatten:${index};`, async responses => {
      const powers = [];
      while (true) {
        const { value } = await responses.read();
        if (value === "ER;") {
          throw new Error("Got Error response from device.");
        }
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
    });
  }
}

/// WebBluetooth device profile covering all Lovense devices and services.
const deviceProfile = {
  filters: [{ namePrefix: "LVS-" }],
  optionalServices: [
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    ...[..."34"]
      .map(y =>
        [..."0123456789abcdef"].map(x => `5${x}300001-002${y}-4bd4-bbd5-a6920e4c5653`)
      )
      .flat()
  ]
};

/// The name corresponding to each Lovense model identifier used in the DeviceInfo response.
const modelNames = new Map([
  ["A", "Nora"],
  ["C", "Nora"],
  ["B", "Max"],
  ["S", "Lush"],
  ["Z", "Hush"],
  ["W", "Domi"],
  ["P", "Edge"],
  ["O", "Osci"]
]);
