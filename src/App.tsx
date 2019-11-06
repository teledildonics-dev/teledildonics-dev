import React, { useState, FC, useEffect } from "react";
import Lovense, { deviceProfile, LovenseDeviceInfo } from "./icy/lovense";
import BluetoothSelector from "./icy/bluetoothselector";
import { useThrottledChanges } from "./icy/generichooks";
import { sleep, addTimeout } from "./icy/async";

const PatternsControl: FC<{ lovense: Lovense; patterns: Array<Array<number>> }> = ({
  lovense,
  patterns
}) => {
  return (
    <div style={{}}>
      {patterns.map((pattern, index) => (
        <div
          key={index.toString()}
          style={{
            cursor: "pointer",
            margin: "8px",
            background: "#FFF",
            border: "1px solid #000",
            color: "black",
            textAlign: "center",
            fontSize: "0.75em",
            wordWrap: "break-word",
            width: "325px",
            fontFamily: "monospace"
          }}
          onClick={() => lovense.startPattern(index + 1)}
        >
          {pattern.map((value, index) => (
            <span
              key={index.toString()}
              style={{
                opacity: 0.125 + (1 - 0.125) * value,
                color: "#000",
                background: "#888"
              }}
            >
              {Math.round(value * 9)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
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
      setInfo(info);
      if (["Lush", "Domi"].includes(info.name)) {
        lovense.patterns().then(setPatterns);
      }
    });
    lovense.batch().then(setBatch);
    lovense.battery().then(setBattery);

    let batteryPollInterval = setInterval(() => {
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
            <form
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
            </form>
            {patterns && info && (
              <PatternsControl
                lovense={lovense}
                patterns={info.name == "Domi" ? patterns : patterns.slice(0, 3)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

const useLovense = (device: BluetoothDevice): Lovense | null => {
  const [lovense, setLovense] = useState();

  useEffect(() => {
    const lovense = (async () => {
      while (true) {
        try {
          return await addTimeout(Lovense.connect(device), 4000);
        } catch (error) {
          console.error("Failed to connect Lovense:", error);
          await sleep(4000);
          console.info("Re-attempting to connect Lovense...");
        }
      }
    })();

    lovense.then(setLovense);

    return () => {
      lovense.then(lovense => lovense.destroy());
    };
  }, [device]);

  return lovense;
};

const DevicePanes: FC = () => {
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
        teledildonics.dev: my control panel of pleasure. <br />
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

export default App;
