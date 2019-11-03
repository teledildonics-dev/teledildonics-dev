import React, { useState } from "react";
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

const App: React.FC = () => {
  const { loading, error, request, lovense, name, battery } = useLovense();

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

  console.log(lovense);
  (window as any)["lovense"] = lovense;

  return (
    <div className="App">
      <div>
        Connected to a {name} with {battery && Math.floor(battery * 100)}% battery.
      </div>
      <div>
        <input
          defaultValue="0"
          min="0"
          max="20"
          type="range"
          onChange={event => {
            const power = Number(event.target.value) / 20.0;
            lovense.vibrate(power).catch(error => {
              console.info("ignoring", error);
            });
          }}
        />
      </div>
    </div>
  );
};

export default App;
