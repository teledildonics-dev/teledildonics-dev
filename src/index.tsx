import React, { FC } from "react";
import ReactDOM from "react-dom";
import { DevicePanes } from "./components/devices";

const App: FC = () => {
  return (
    <main
      style={{
        margin: "32px",
        fontFamily: "sans-serif"
      }}
    >
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
        Buggy and unstable.{" "}
        <a href="https://github.com/teledildonics-dev/teledildonics-dev">
          View source here
        </a>
        .<br />
        Only supports some <a href="https://www.lovense.com/compare">Lovense</a> devices.
      </div>
      <DevicePanes />
    </main>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
