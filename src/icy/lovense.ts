// https://stpihkal.docs.buttplug.io/hardware/lovense.html

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

interface Connection {
  send(value: string): Promise<void>;
  response: Promise<string>;
}

export default class Lovense {
  readonly requested: Promise<BluetoothDevice>;
  readonly connected: Promise<Connection>;

  /// This must be called in response to a user input event.
  constructor() {
    this.requested = navigator.bluetooth.requestDevice({
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
    });
    this.connected = this.requested.then(device => this.connect(device));
  }

  protected async connect(device: BluetoothDevice) {
    const server = await device.gatt!.connect();
    const service = (await server.getPrimaryServices())[0]!;
    const characteristics = await service.getCharacteristics();
    const transmitter = characteristics.find(c => c.properties.write)!;
    const receiver = characteristics.find(c => !c.properties.write)!;

    const send = async (value: string) => {
      await transmitter.writeValue(utf8Encoder.encode(value));
    };

    const connection: Connection = {
      send,
      response: null as any
    };

    let setNextResponse: (value: string) => void;

    connection.response = new Promise<string>(resolve => {
      setNextResponse = resolve;
    });

    receiver.addEventListener("characteristicvaluechanged", event => {
      const binary = (event.target as any).value;
      setNextResponse(utf8Decoder.decode(binary));
      connection.response = new Promise(resolve => {
        setNextResponse = resolve;
      });
    });
    await receiver.startNotifications();

    return connection;
  }

  protected async call(command: string): Promise<string> {
    const { send, response } = await this.connected;
    await send(command);
    return await response;
  }

  public async deviceType(): Promise<string> {
    const response = await this.call("DeviceType;");
    const modelId = response.split(":")[0];
    return ({
      A: "Nora",
      C: "Nora",
      B: "Max",
      S: "Lush",
      Z: "Hush",
      W: "Domi",
      P: "Edge",
      O: "Osci"
    } as any)[modelId];
  }

  public async battery(): Promise<number> {
    const response = await this.call("Battery;");
    const level = Number(response.split(";")[0]);

    if (!(Number.isSafeInteger(level) && 0 <= level && level <= 100)) {
      throw new Error("Battery should be integer from 0-20.");
    }

    return level / 100.0;
  }

  public async vibrate(power: number): Promise<string> {
    const level = Math.round(power * 20.0);

    if (!(Number.isSafeInteger(level) && 0 <= level && level <= 20)) {
      throw new Error("Power must be integer from 0-20.");
    }

    return await this.call(`Vibrate:${level}`);
  }
}
