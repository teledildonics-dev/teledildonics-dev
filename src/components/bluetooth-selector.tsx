import React, { useState, FC, CSSProperties } from "react";
import { BluetoothLogo } from "./bluetooth-logo";

export const buttonStyles: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  border: "1px solid black",
  color: "#000",
  background: "#DDE",
  height: "40px",
  width: "150px",
  fontSize: "14px",
  fontFamily: "sans-serif",
  padding: "4px",
  cursor: "default",
  borderRadius: "4px",
  verticalAlign: "top",
  position: "relative",
  overflow: "hidden"
};

export const BluetoothSelector: FC<{
  onChange: (event: { target: { value: BluetoothDevice | undefined } }) => void;
  options: RequestDeviceOptions;
  style?: CSSProperties;
}> = ({ onChange, options = { acceptAllDevices: true }, style = {} }) => {
  const [device, setDevice] = useState<BluetoothDevice>();
  const [requested, setRequested] = useState(false);

  if (!requested) {
    return (
      <button
        style={{ ...buttonStyles, cursor: "pointer", ...style }}
        onClick={async () => {
          const request = navigator.bluetooth.requestDevice(options);
          setRequested(true);

          try {
            const device = await request;
            setDevice(device);
            onChange({ target: { value: device } });
          } catch (error) {
            console.error(error);
            setRequested(false);
          }
        }}
      >
        <BluetoothLogo /> &nbsp; Select Device
      </button>
    );
  } else if (!device) {
    return (
      <button
        disabled={true}
        style={{ ...buttonStyles, background: "#AAB", color: "#444", ...style }}
      >
        <BluetoothLogo /> &nbsp; Selecting...
      </button>
    );
  } else {
    return (
      <span style={{ ...buttonStyles, background: "#BDC", ...style }}>
        <span
          style={{
            background: "#DBB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontWeight: "bold",
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "32px",
            textAlign: "center",
            borderRight: "1px solid black",
            fontSize: "2em"
          }}
          onClick={() => {
            setDevice(undefined);
            setRequested(false);
            onChange({ target: { value: undefined } });
          }}
        >
          ×
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            left: "32px",
            textAlign: "center"
          }}
        >
          <BluetoothLogo /> &nbsp; {device.name}
        </span>
      </span>
    );
  }
};

export default BluetoothSelector;
