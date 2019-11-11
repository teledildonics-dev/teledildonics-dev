import React, { FC, useState, useEffect } from "react";

import { deviceProfile } from "../lovense/lovense";

import BluetoothSelector, { buttonStyles } from "../components/bluetooth-selector";

import { Lovense, LovenseDeviceInfo } from "./lovense-abstract";
import { LovenseDevice } from "./lovense-device";
import { LovenseFake } from "./lovense-fake";

export const LovenseSelector: FC<{
  onChange: (lovense: Lovense | undefined) => void;
}> = ({ onChange }) => {
  const [lovense, setLovense] = useState<Lovense>();
  const [info, setInfo] = useState<LovenseDeviceInfo>();

  useEffect(() => {
    if (!lovense) {
      return lovense;
    }

    let abortion = new AbortController();

    lovense.info().then(info => {
      if (abortion.signal.aborted) {
        return;
      }

      setInfo(info);
    });

    return () => {
      abortion.abort();
    };
  }, [lovense]);

  if (!lovense) {
    return (
      <div>
        <br />
        <br />
        <BluetoothSelector
          options={deviceProfile}
          onChange={event => {
            setInfo(undefined);
            const device = event.target.value;
            if (device) {
              const lovense = new LovenseDevice(device);
              setLovense(lovense);
              onChange(lovense);
            } else {
              setLovense(undefined);
              onChange(lovense);
            }
          }}
        />{" "}
        <button
          style={{
            ...buttonStyles,
            background: "#FEB",
            cursor: "pointer",
            flexDirection: "column"
          }}
          onClick={_event => {
            setInfo(undefined);
            const lovense = new LovenseFake();
            setLovense(lovense);
            onChange(lovense);
          }}
        >
          Simulate Device
          <br />
          <span style={{ fontSize: ".75em" }}>(for interface testing)</span>
        </button>
      </div>
    );
  } else {
    let description = info ? JSON.stringify(info) : lovense.toString();
    return <div>selected {description}</div>;
  }
};
