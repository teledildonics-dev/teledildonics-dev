import { FC } from "react";
import React from "react";
import { unwrap, assert } from "../common/safety";

const outerHeight = 300;
const innerHeight = 2.0;
const outerWidth = 900;
const innerWidth = 90.0;
const xScale = outerWidth / innerWidth;
const yOffset = 0.5 + outerHeight / 2;
const yScale = outerHeight / innerHeight;

export const PatternDisplay: FC<{
  pattern: (x: number) => number;
  x: number;
  height?: number;
}> = ({ pattern, x, height = 100 }) => {
  const y = pattern(x);

  const xOffset = 0.5 - Math.max(0, x * xScale - 25 * Math.log(x) - outerWidth / 4 + 100);

  const canvas = document.createElement("canvas");
  canvas.width = outerWidth;
  canvas.height = outerHeight;
  const g2d = unwrap(canvas.getContext("2d") || undefined);

  g2d.lineJoin = "round";

  // minor y ticks every 25% power
  g2d.beginPath();
  g2d.strokeStyle = "#EEE";
  g2d.lineWidth = 3;
  for (let dy = -yOffset; dy <= outerHeight; dy += 0.25 * yScale) {
    g2d.moveTo(0, outerHeight - (yOffset + dy));
    g2d.lineTo(outerWidth, outerHeight - (yOffset + dy));
  }
  g2d.stroke();
  // minor x ticks every 2 seconds
  g2d.beginPath();
  g2d.strokeStyle = "#EEE";
  g2d.lineWidth = 3;
  for (let dx = 0; dx <= outerWidth * 8; dx += 1.0 * xScale) {
    g2d.moveTo(xOffset + dx, outerHeight);
    g2d.lineTo(xOffset + dx, outerHeight - outerHeight);
  }
  g2d.stroke();

  // major y ticks every 100% power
  g2d.beginPath();
  g2d.strokeStyle = "#AAA";
  g2d.lineWidth = 7;
  for (let dy = -yOffset; dy <= outerHeight; dy += 1.0 * yScale) {
    g2d.moveTo(0, outerHeight - (yOffset + dy));
    g2d.lineTo(outerWidth, outerHeight - (yOffset + dy));
  }
  g2d.stroke();

  // major x ticks every 10 seconds
  g2d.beginPath();
  g2d.strokeStyle = "#AAA";
  g2d.lineWidth = 7;
  for (let dx = 0; dx <= outerWidth * 8; dx += 10 * xScale) {
    g2d.moveTo(xOffset + dx, 0);
    g2d.lineTo(xOffset + dx, outerHeight);
  }
  g2d.stroke();

  // draw a crosshair pointing at the current coordinate
  g2d.beginPath();
  g2d.strokeStyle = "#F88";
  g2d.lineWidth = 5;
  g2d.moveTo(xOffset + x * xScale, outerHeight);
  g2d.lineTo(xOffset + x * xScale, 0);
  g2d.moveTo(0 * xScale, outerHeight - (yOffset + y * yScale));
  g2d.lineTo(outerWidth, outerHeight - (yOffset + y * yScale));
  g2d.stroke();

  // graph entire thing
  g2d.beginPath();
  g2d.strokeStyle = "#000";
  g2d.lineWidth = 3;
  g2d.moveTo(xOffset, yOffset);
  for (let x = 0; x <= outerWidth * 8; x++) {
    const y = pattern(x / xScale) * yScale;
    g2d.lineTo(xOffset + x, outerHeight - (yOffset + y));
  }
  g2d.stroke();

  // circle current value
  g2d.beginPath();
  g2d.strokeStyle = "#B00";
  g2d.lineWidth = 9;
  g2d.arc(xOffset + x * xScale, outerHeight - (yOffset + y * yScale), 20, 0, 2 * Math.PI);
  g2d.stroke();

  const url = canvas.toDataURL();
  return <img alt="pattern graph" src={url} height={height} />;
};

export const clamp = (x: number, min: number = 0.0, max: number = 1.0) => {
  assert(min < max);
  return Math.min(max, Math.max(min, x));
};

export const sinny = (x: number, period: number = 1.0, magnitude: number = 1.0) => {
  return magnitude * (0.5 + 0.5 * Math.sin((x / period) * 2 * Math.PI - Math.PI / 2));
};

export const compound = (a: number, b: number) => {
  return 1.0 - (1.0 - clamp(a)) * (1.0 - clamp(b));
};

export const compress = (a: number, b: number) => {
  return clamp(a) * clamp(b);
};

export const blend = (...numbers: Array<number>) => {
  let sum = 0;
  for (const n of numbers) {
    sum += n;
  }
  return sum / numbers.length;
};

export const thor = (x: number) => {
  x = x / 3;
  const xAccelerating = Math.pow(x - sinny(x, 10), 1.5);
  const baseline = blend(sinny(x, 10), sinny(x, 3));
  const longStrongRamp = Math.pow(clamp(x / 120), 2);
  const initialClamp = clamp(x / 15);
  return compound(
    longStrongRamp,
    compress(
      Math.pow(0.25 + 0.75 * sinny(x, 4), 0.5),
      compress(initialClamp, blend(baseline, sinny(xAccelerating, 10)))
    )
  );
};
