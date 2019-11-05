import React, { useState, FC, CSSProperties } from "react";

const baseStyles: CSSProperties = {
  boxSizing: "border-box",
  border: "1px solid black",
  color: "#000",
  background: "#DDE",
  height: "40px",
  width: "150px",
  fontSize: "14px",
  fontFamily: "sans-serif",
  padding: "4px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "default",
  borderRadius: "4px",
  verticalAlign: "top"
};

export const BluetoothSelector: FC<{
  onChange: (event: { target: { value: BluetoothDevice } }) => void;
  options: RequestDeviceOptions;
  style?: CSSProperties;
}> = ({ onChange, options = { acceptAllDevices: true }, style = {} }) => {
  const [device, setDevice] = useState<BluetoothDevice>();
  const [requested, setRequested] = useState(false);

  if (!requested) {
    return (
      <button
        style={{ ...baseStyles, cursor: "pointer", ...style }}
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
        Select ᛒᚼ Device
      </button>
    );
  } else if (!device) {
    return (
      <button
        disabled={true}
        style={{ ...baseStyles, background: "#AAB", color: "#444", ...style }}
      >
        Selecting ᛒᚼ...
      </button>
    );
  } else {
    return (
      <span style={{ ...baseStyles, background: "#BDC", ...style }}>ᛒᚼ {device.name}</span>
    );
  }
};

export default BluetoothSelector;
