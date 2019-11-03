import React, { useEffect, useState } from "react";
import "./App.css";

const useBluetoothDevice = (
  filters: BluetoothRequestDeviceFilter[] = [{ services: ["battery_service"] }]
): [boolean, void | Error, () => void, void | BluetoothDevice] => {
  const [requested, setRequested] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();
  const [device, setDevice] = useState<void | BluetoothDevice>();

  const requestLoad = async () => {
    if (requested) {
      return;
    }
    setRequested(true);
    try {
      const device = await navigator.bluetooth.requestDevice({ filters });
      setLoading(false);
      setDevice(device);
    } catch (error) {
      setError(error);
    }
  };

  return [loading, error, requestLoad, device];
};

const useBatteryLevel = (device: void | BluetoothDevice) => {
  const [batteryLevel, setBatteryLevel] = useState<void | number>();
  useEffect(() => {
    if (!device) {
      return;
    }

    const abort = new AbortController();

    (async () => {
      const gatt = device.gatt;
      if (!gatt) {
        throw new Error("device should support GATT");
      }
      const server = await gatt.connect();
      const batteryService = await server.getPrimaryService("battery_service");

      const onBatteryLevelChange = (event: {
        target: BluetoothRemoteGATTCharacteristic;
      }) => {
        setBatteryLevel(event.target.value!.getUint8(0));
      };

      const batteryLevelCharacteristic = await batteryService.getCharacteristic(
        "battery_level"
      );
      const batteryLevelBinary = await batteryLevelCharacteristic.readValue();
      batteryLevelCharacteristic.addEventListener(
        "characteristicvaluechanged",
        onBatteryLevelChange as any
      );
      abort.signal.addEventListener("abort", () => {
        batteryLevelCharacteristic.removeEventListener(
          "characteristicvaluechanged",
          onBatteryLevelChange as any
        );
      });

      const batteryLevel = batteryLevelBinary.getUint8(0);
      setBatteryLevel(batteryLevel);

      await new Promise(resolve => setTimeout(resolve, 4000));
    })();

    return () => abort.abort();
  }, [device]);

  return batteryLevel;
};

const App: React.FC = () => {
  const [loading, error, requestLoad, device] = useBluetoothDevice();
  const batteryLevel = useBatteryLevel(device);

  if (error) {
    return <p>{String(error)}</p>;
  }
  if (loading) {
    return <button onClick={requestLoad}>Connect</button>;
  }

  return (
    <div className="App">
      <header className="App-header">
        Got permission to access {String(device)}. Battery level is:{" "}
        {batteryLevel}.
      </header>
    </div>
  );
};

export default App;
