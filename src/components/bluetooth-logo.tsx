import { FC } from "react";
import React from "react";

export const BluetoothLogo: FC<{ width?: number; height?: number }> = ({
  width = 16,
  height
}) => {
  return (
    <svg
      viewBox="0 0 640 976"
      width={width}
      height={height}
      role="img"
      aria-label="Bluetooth"
    >
      <rect ry="291" height="976" width="640" fill="#0a3d91" />
      <path
        d="m157,330,305,307-147,178v-636l147,170-305,299"
        stroke="#FFF"
        strokeWidth="53"
        fill="none"
      />
    </svg>
  );
};
