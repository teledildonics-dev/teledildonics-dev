import { FC, useState } from "react";
import React from "react";
import { LovenseSelector } from "./lovense-selector";
import { useLovense } from "./use-lovense";
import { Lovense, VibrationLevel, RotationLevel } from "./lovense-abstract";

export const ScrapPage: FC = () => {
  const [lovenseInternal, setLovense] = useState<Lovense>();
  const lovense = useLovense(lovenseInternal);

  let controls;
  if (lovense) {
    controls = (
      <form>
        <label>
          Vibration
          <input
            type="range"
            defaultValue="0"
            min="0"
            max="20"
            onChange={event => {
              lovense.setVibration(Number(event.target.value) as VibrationLevel);
            }}
          />
        </label>
        <label>
          Rotation
          <input
            type="range"
            defaultValue="0"
            min="-20"
            max="20"
            onChange={event => {
              lovense.setRotation(Number(event.target.value) as RotationLevel);
            }}
          />
        </label>
      </form>
    );
  } else {
    controls = null;
  }

  return (
    <main>
      <LovenseSelector onChange={setLovense} />

      {controls}
    </main>
  );
};
