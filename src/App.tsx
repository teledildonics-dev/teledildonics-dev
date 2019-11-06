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
    <ol start={0}>
      <li>
        <span key="stop" onClick={() => lovense.stopPattern()}>
          Stop
        </span>
      </li>
      {patterns.map((pattern, index) => (
        <li
          key={index.toString()}
          style={{
            cursor: "pointer",
            margin: "4px"
          }}
          onClick={() => lovense.startPattern(index + 1)}
        >
          <code
            style={{
              fontSize: "0.5em",
              cursor: "pointer",
              wordWrap: "break-word",
              width: "192px",
              display: "inline-block",
              verticalAlign: "top"
            }}
          >
            {pattern.map((value, index) => (
              <span
                key={index.toString()}
                style={{
                  opacity: 0.125 + (1 - 0.125) * value,
                  background: "rgba(0, 0, 0, 0.25)"
                }}
              >
                {Math.round(value * 9)}
              </span>
            ))}
          </code>
        </li>
      ))}
    </ol>
  );
};

const DeviceControl: FC<{ device: BluetoothDevice }> = ({ device }) => {
  const lovense = useLovense(device);

  const [targetPower, setTargetPower] = useState(0.0);
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

  return (
    <>
      {" "}
      <div
        style={{
          boxSizing: "border-box",
          border: "1px solid black",
          color: "#000",
          background: "#F8F8F8",
          minHeight: "40px",
          width: "350px",
          fontSize: "14px",
          fontFamily: "sans-serif",
          padding: "4px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          cursor: "default",
          borderRadius: "4px",
          verticalAlign: "top"
        }}
      >
        <div
          style={{
            marginBottom: "8px"
          }}
        >
          <span
            style={{
              verticalAlign: "middle",
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
                verticalAlign: "middle",
                margin: "4px 12px",
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
            <div style={{ display: "inline-block", verticalAlign: "middle" }}>
              {Math.floor(battery * 100)}%🔋
            </div>
          )}
        </div>
        <form>
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
            defaultValue="0"
            min="0"
            max="20"
            type="range"
            onChange={event => {
              const power = Number(event.target.value) / 20.0;
              setTargetPower(power);
            }}
            style={{
              width: "225px"
            }}
          />
        </form>
        {lovense && patterns && <PatternsControl lovense={lovense} patterns={patterns} />}
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
      <DevicePanes />
    </main>
  );
};

export default App;
