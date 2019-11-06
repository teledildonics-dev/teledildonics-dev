import { FC } from "react";
import React from "react";
import Lovense from "../lovense/lovense";

export const PatternsControl: FC<{ lovense: Lovense; patterns: Array<Array<number>> }> = ({
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
