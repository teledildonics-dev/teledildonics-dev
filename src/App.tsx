import React, { useState, FC } from "react";
import { deviceProfile } from "./icy/lovense";
import BluetoothSelector from "./icy/bluetoothselector";

const App: FC = () => {
  const [device, setDevice] = useState<BluetoothDevice>();

  return (
    <>
      <p>
        <BluetoothSelector
          options={deviceProfile}
          onChange={event => setDevice(event.target.value)}
        ></BluetoothSelector>
      </p>
      {device && (
        <>
          <p>Selected: {device.name}</p>
          <App></App>
        </>
      )}
    </>
  );
};

export default App;
