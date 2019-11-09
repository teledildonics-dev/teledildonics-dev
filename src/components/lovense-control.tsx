import React, { useState, FC, useEffect, useCallback } from "react";
import { useLovense } from "../hooks/lovense";
import { useThrottledChanges } from "../hooks/throttle";
import { LovenseDeviceInfo } from "../lovense/lovense";
import { PatternsControl } from "./patterns";
import { PatternDisplay, thor } from "../lovense/patterns";
import { useLovenseDebug } from "../hooks/lovense-debug";

export const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const [targetVibrationLevel, setTargetVibrationLevel] = useState(0);
  const targetVibrationPower = targetVibrationLevel / 20.0;
  const throttledTargetVibrationPower = useThrottledChanges(500, targetVibrationPower);

  const [targetRotationLevel, setTargetRotationLevel] = useState(0);
  const targetRotationPower = targetRotationLevel / 20.0;
  const throttledTargetRotationPower = useThrottledChanges(500, targetRotationPower);

  const [info, setInfo] = useState<LovenseDeviceInfo>();
  const [batch, setBatch] = useState<number>();
  const [battery, setBattery] = useState<number>();
  const [patterns, setPatterns] = useState<Array<Array<number>>>();

  const lovense = useLovense(
    device,
    undefined,
    useCallback(() => {
      // If we disconnect, set everything to zero to make sure we are in a consistent
      // state with the toy when it reconnects.
      setTargetVibrationLevel(0);
      setTargetRotationLevel(0);
    }, [])
  );

  useLovenseDebug(lovense);

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

      if (info.capabilities.patterns) {
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
    if (!(lovense && info)) {
      return;
    }

    if (!info.capabilities.vibration) {
      return;
    }

    lovense.vibrate(throttledTargetVibrationPower);
  }, [lovense, info, throttledTargetVibrationPower]);

  /// Set device rotation power and direction when it changes.
  useEffect(() => {
    if (!(lovense && info)) {
      return;
    }

    if (!info.capabilities.rotation) {
      return;
    }

    lovense.rotate(throttledTargetRotationPower);
  }, [lovense, info, throttledTargetRotationPower]);

  const [pattern] = useState(() => thor);
  const [patternEnabled, setPatternEnabled] = useState();
  const [t, setT] = useState(0.0);
  useEffect(() => {
    if (!(info && patternEnabled)) {
      return;
    }

    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const t = (Date.now() - startTime) / 1000;
      setT(t);
      const x = pattern(t);
      setTargetVibrationLevel(x * 20);
      setTargetRotationLevel(x * 20);
    }, 1000 / 60);

    return () => {
      clearInterval(intervalId);
    };
  }, [info, pattern, patternEnabled]);

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
            {info ? info.model : device.name}
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
            <div
              onClick={() => lovense.battery().then(setBattery)}
              style={{ cursor: "pointer" }}
            >
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
                width: "100%",
                justifyContent: "flex-end",
                flexDirection: "row",
                height: "56px"
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
                  setTargetRotationLevel(0);
                  setTargetVibrationLevel(0);
                  lovense.stop();
                }}
              >
                🛑
              </span>

              <code
                style={{
                  verticalAlign: "top",
                  margin: "4px",
                  fontSize: "16px",
                  whiteSpace: "pre",
                  fontFamily: "consolas, monospace"
                }}
              >
                {Math.floor(targetVibrationPower * 100)
                  .toString()
                  .padStart(3)}
                %
              </code>

              <input
                value={targetVibrationLevel}
                min="0"
                max="20"
                type="range"
                onChange={event => {
                  const level = Number(event.target.value);
                  setTargetVibrationLevel(level);
                }}
                style={{
                  cursor: "pointer",
                  width: "225px",
                  transform: "scaleY(2.0)"
                }}
              />
            </div>
            {info && info.capabilities.rotation && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "flex-end",
                  flexDirection: "row",
                  height: "56px"
                }}
              >
                <span>rotation:</span>
                <code
                  style={{
                    verticalAlign: "top",
                    margin: "4px",
                    fontSize: "16px",
                    whiteSpace: "pre",
                    fontFamily: "consolas, monospace"
                  }}
                >
                  {Math.floor(targetRotationPower * 100)
                    .toString()
                    .padStart(3)}
                  %
                </code>

                <input
                  value={targetRotationLevel}
                  min="-20"
                  max="20"
                  type="range"
                  onChange={event => {
                    const level = Number(event.target.value);
                    setTargetRotationLevel(level);
                  }}
                  style={{
                    cursor: "pointer",
                    width: "225px",
                    transform: "scaleY(2.0)"
                  }}
                />
              </div>
            )}
            {info && info.capabilities.patterns && patterns && (
              <PatternsControl
                lovense={lovense}
                patterns={patterns.slice(0, info.capabilities.patterns)}
              />
            )}
            {info && pattern && (
              <>
                <PatternDisplay pattern={pattern} x={t} height={100} />
                <button onClick={() => setPatternEnabled(!patternEnabled)}>run</button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
