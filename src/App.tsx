import React, { useState, FC, useEffect } from "react";
import Lovense, { deviceProfile } from "./icy/lovense";
import BluetoothSelector from "./icy/bluetoothselector";

const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const lovense = useLovense(device);

  const parts = [];
  parts.push(<section style={{}}>this is your {device.name}</section>);

  if (lovense) {
    parts.push(
      <>
        <button onClick={() => lovense.vibrate(1.0)}>Start</button>
        <button onClick={() => lovense.vibrate(0.0)}>Stop</button>
      </>
    );
  }

  return <>{parts}</>;
};

const useLovense = (device: BluetoothDevice): Lovense | null => {
  const [lovense, setLovense] = useState();

  useEffect(() => {
    const lovense = Lovense.connect(device);
    lovense.then(setLovense);

    return () => {
      console.debug("dismounted");
      // lovense.then(lovense => lovense.destroy());
    };
  }, [device]);

  return lovense;
};

const DevicePanes: FC = () => {
  const [device, setDevice] = useState<BluetoothDevice>();

  return (
    <>
      <section
        style={{
          margin: "16px"
        }}
      >
        <BluetoothSelector
          options={deviceProfile}
          onChange={event => setDevice(event.target.value)}
        ></BluetoothSelector>
        {device && <DeviceControl device={device}></DeviceControl>}
      </section>

      {device && <DevicePanes />}
    </>
  );
};

const App: FC = () => {
  return (
    <main
      style={{
        margin: "32px"
      }}
    >
      <DevicePanes />
    </main>
  );
};

export default App;
