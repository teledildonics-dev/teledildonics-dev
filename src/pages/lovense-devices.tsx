import React, { FC } from "react";
import { DevicePanes } from "../components/devices";

export const LovenseDevicesPage: FC<{}> = () => {
  return (
    <main>
      <div
        style={{
          border: "1px solid black",
          color: "#000",
          background: "#FFF8F0",
          fontSize: "12px",
          fontFamily: "sans-serif",
          padding: "10px",
          borderRadius: "4px",
          display: "inline-block",
          margin: "4px",
          float: "right",
          lineHeight: "18px"
        }}
      >
        teledildonics.dev: my remote control playground. <br />
        Buggy, unstable, and unofficial.{" "}
        <a href="https://github.com/teledildonics-dev/teledildonics-dev">
          View source here
        </a>
        .
        <br />
        Open your developer console to see more.
        <br />
        Only supports some <a href="https://www.lovense.com/compare">Lovense</a> devices.
      </div>

      <DevicePanes />
    </main>
  );
};
