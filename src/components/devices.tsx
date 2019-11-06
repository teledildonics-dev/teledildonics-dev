import React, { useState, FC } from "react";
import BluetoothSelector from "./bluetooth-selector";
import { DeviceControl } from "./lovense-control";
import { deviceProfile } from "../lovense/lovense";
export const DevicePanes: FC = () => {
  const [device, setDevice] = useState<BluetoothDevice>();

  return (
    <>
      <section
        style={{
          margin: "4px"
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
