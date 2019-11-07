import React, { useState, FC, useEffect, useRef, useCallback } from "react";
import { useLovense } from "../hooks/lovense";
import { useThrottledChanges } from "../hooks/throttle";
import { LovenseDeviceInfo } from "../lovense/lovense";
import { PatternsControl } from "./patterns";

export const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const [targetVibrationLevel, setTargetVibrationLevel] = useState(0);
  const targetVibrationPower = targetVibrationLevel / 20.0;
  const throttledTargetVibrationPower = useThrottledChanges(125, targetVibrationPower);

  const rotationDirectionToggled = useRef(false);

  const [targetRotationLevel, setTargetRotationLevel] = useState(0);
  const targetRotationPower = targetRotationLevel / 20.0;
  const throttledTargetRotationPower = useThrottledChanges(125, targetRotationPower);

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

    if (throttledTargetRotationPower < 0 && !rotationDirectionToggled.current) {
      lovense.toggleRotationDirection();
      rotationDirectionToggled.current = true;
    } else if (throttledTargetRotationPower > 0 && rotationDirectionToggled.current) {
      lovense.toggleRotationDirection();
      rotationDirectionToggled.current = false;
    }

    lovense.rotate(Math.abs(throttledTargetRotationPower));
  }, [lovense, info, throttledTargetRotationPower]);

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
          </>
        )}
      </div>
    </>
  );
};
