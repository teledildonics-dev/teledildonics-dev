import React, { useState, FC, useEffect } from "react";
import { useLovense } from "../hooks/lovense";
import { useThrottledChanges } from "../hooks/throttle";
import { LovenseDeviceInfo } from "../lovense/lovense";
import { PatternsControl } from "./patterns";

export const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const lovense = useLovense(device);

  const [targetLevel, setTargetLevel] = useState(0);
  const targetPower = targetLevel / 20.0;
  const throttledTargetPower = useThrottledChanges(125, targetPower);

  const [info, setInfo] = useState<LovenseDeviceInfo>();
  const [batch, setBatch] = useState<number>();
  const [battery, setBattery] = useState<number>();
  const [patterns, setPatterns] = useState<Array<Array<number>>>();

  /// Fetch device info once it's available.
  useEffect(() => {
    if (!lovense) {
      return;
    }

    const info = lovense.info();
    info.then(info => {
      if (!lovense) {
        return;
      }

      setInfo(info);
      if (["Lush", "Domi"].includes(info.name)) {
        lovense.patterns().then(setPatterns);
      }
    });
    lovense.batch().then(setBatch);
    lovense.battery().then(setBattery);

    let batteryPollInterval = setInterval(() => {
      if (!lovense) {
        return;
      }

      lovense.battery().then(setBattery);
    }, 60 * 1000);

    return () => {
      clearInterval(batteryPollInterval);
    };
  }, [lovense]);

  /// Set device vibration power when it changes.
  useEffect(() => {
    if (!lovense) {
      return;
    }

    lovense.vibrate(throttledTargetPower);
  }, [lovense, throttledTargetPower]);

  if (!lovense) {
    return (
      <>
        {" "}
        <div
          style={{
            boxSizing: "border-box",
            border: "1px solid black",
            color: "#000",
            background: "#F8D8C8",
            minHeight: "40px",
            width: "128px",
            fontSize: "14px",
            fontFamily: "sans-serif",
            padding: "4px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            cursor: "default",
            borderRadius: "4px",
            borderTopLeftRadius: 0,
            verticalAlign: "top"
          }}
        >
          connecting...
        </div>
      </>
    );
  }

  return (
    <>
      {" "}
      <div
        style={{
          display: "inline-flex",
          boxSizing: "border-box",
          border: "1px solid black",
          color: "#000",
          background: "#F8F8F8",
          minHeight: "40px",
          width: "350px",
          fontSize: "14px",
          fontFamily: "sans-serif",
          padding: "4px",
          alignItems: "center",
          justifyContent: "start",
          flexDirection: "column",
          cursor: "default",
          borderRadius: "4px",
          verticalAlign: "top"
        }}
      >
        <div
          style={{
            marginBottom: "8px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
            alignItems: "center"
          }}
        >
          <span
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              fontFamily: "Trebuchet MS"
            }}
          >
            {info ? info.name : device.name}
          </span>
          {info && batch && (
            <div
              style={{
                margin: "0 12px",
                textAlign: "center",
                display: "inline-block",
                fontSize: "12px",
                fontWeight: "normal",
                lineHeight: "10px"
              }}
            >
              {batch}
              {info.serial} <br />
              running firmware {info.firmware}
            </div>
          )}
          {battery != null && (
            <div>
              {Math.floor(battery * 100)}%
              <span role="img" aria-label="Battery">
                🔋
              </span>
            </div>
          )}
        </div>
        {lovense && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "start",
                flexDirection: "row"
              }}
            >
              <span
                role="img"
                aria-label="Stop"
                style={{
                  fontSize: "3em",
                  cursor: "pointer"
                }}
                onClick={() => {
                  lovense.vibrate(0);
                  lovense.stopPattern();
                  setTargetLevel(0);
                }}
              >
                🛑
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "start",
                  flexDirection: "column"
                }}
              ></div>
              <code
                style={{
                  verticalAlign: "top",
                  margin: "4px",
                  fontSize: "16px",
                  whiteSpace: "pre",
                  fontFamily: "consolas, monospace"
                }}
              >
                {Math.floor(targetPower * 100)
                  .toString()
                  .padStart(3)}
                %
              </code>

              <input
                value={targetLevel}
                min="0"
                max="20"
                type="range"
                onChange={event => {
                  const level = Number(event.target.value);
                  setTargetLevel(level);
                }}
                style={{
                  width: "225px",
                  transform: "scaleY(2.0)"
                }}
              />
            </div>
            {patterns && info && (
              <PatternsControl
                lovense={lovense}
                patterns={info.name === "Domi" ? patterns : patterns.slice(0, 3)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};
