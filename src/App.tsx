import React, { useState, FC, useEffect } from "react";
import Lovense, { deviceProfile } from "./icy/lovense";
import BluetoothSelector from "./icy/bluetoothselector";

const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const lovense = useLovense(device);

  const [targetPower, setTargetPower] = useState(0.0);
  const throttledTargetPower = useThrottledChanges(250, targetPower);

  useEffect(() => {
    if (!lovense) {
      return;
    }

    lovense.vibrate(throttledTargetPower);
  }, [lovense, throttledTargetPower]);

  return (
    <>
      {" "}
      <span style={{ fontWeight: "bold" }}>{device.name}</span>{" "}
      {lovense ? (
        <input
          defaultValue="0"
          min="0"
          max="20"
          type="range"
          onChange={event => {
            const power = Number(event.target.value) / 20.0;
            setTargetPower(power);
          }}
        />
      ) : (
        "connecting..."
      )}
    </>
  );
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
        margin: "32px",
        fontFamily: "sans-serif"
      }}
    >
      <DevicePanes />
    </main>
  );
};

export default App;
