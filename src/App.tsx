import React, { useState, useEffect } from "react";
import Lovense from "./icy/lovense";
import "./App.css";
import { unsafe } from "./icy/safety";

const useLovense = () => {
  const [requested, setRequested] = useState<boolean>(false);
  const [lovense, setLovense] = useState<Lovense>();
  const [error, setError] = useState<Error>();
  const [name, setName] = useState<string>();
  const [battery, setBattery] = useState<number>();

  const request = async () => {
    if (requested) {
      return;
    }
    setRequested(true);
    try {
      const lovense = await Lovense.request();
      setLovense(lovense);

      console.debug("window.lovense =", lovense);
      (window as any)["lovense"] = lovense;

      const type = await lovense.deviceType();
      setName(type);
      const battery = await lovense.battery();
      setBattery(battery);
    } catch (error) {
      setError(error);
    }
  };

  return { loading: !lovense, error, request, lovense, name, battery };
};

// TODO: put this state somewhere
const Hack = {
  targetPower: 0.0,
  lastSetPower: 0.0
};

const App: React.FC = () => {
  const { loading, error, request, lovense, name, battery } = useLovense();

  const [targetPower, setTargetPower] = useState(0.0);
  Hack.targetPower = targetPower;

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!lovense) {
        return;
      }

      if (Hack.targetPower !== Hack.lastSetPower) {
        const target = Hack.targetPower;
        await lovense.vibrate(Hack.targetPower);
        Hack.lastSetPower = target;
      }
    }, 125);
    return () => clearInterval(interval);
  }, [lovense]);

  const [patterns, setPatterns] = useState<Array<Array<number>>>([]);

  useEffect(() => {
    if (!lovense) {
      return;
    }

    lovense.getPatterns().then(setPatterns);
  }, [lovense]);

  if (error) {
    return (
      <div className="App">
        <p>{String(error)}</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="App">
        <button onClick={request as unsafe}>Connect</button>
      </div>
    );
  }

  if (!lovense) {
    throw new Error();
  }

  return (
    <div className="App">
      <div>
        Connected to a Lovense {name || "toy"} with {battery && Math.round(battery * 100)}%
        battery.
      </div>
      <div
        style={{
          transform: "scale(2)",
          padding: "20px",
          fontFamily: "monospace",
          verticalAlign: "middle"
        }}
      >
        <code>
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
        />
      </div>
      <div>Patterns</div>
      <ol>
        {patterns.map((pattern, index) => (
          <li key={index.toString()}>
            <code>
              {pattern.map((value, index) => (
                <span
                  key={index.toString()}
                  style={{
                    opacity: 0.125 + (1 - 0.125) * value,
                    background: "rgba(255, 255, 255, 0.5)"
                  }}
                >
                  {Math.round(value * 9)}
                </span>
              ))}
            </code>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default App;
