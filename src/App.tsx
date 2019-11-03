import React, { useState } from "react";
import Lovense from "./icy/lovense";
import "./App.css";

const useLovense = (): [boolean, void | Error, () => void, void | Lovense] => {
  const [requested, setRequested] = useState<boolean>(false);
  const [lovense, setLovense] = useState<void | Lovense>();
  const [error, setError] = useState<Error>();

  const request = async () => {
    if (requested) {
      return;
    }
    setRequested(true);
    try {
      const lovense = new Lovense();
      lovense.connected.catch(setError);
      setLovense(lovense);
    } catch (error) {
      setError(error);
    }
  };

  return [!lovense, error, request, lovense];
};

const App: React.FC = () => {
  const [loading, error, request, lovense] = useLovense();

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
        <button onClick={request}>Connect</button>
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
      <div>Got {String(lovense)}.</div>
    </div>
  );
};

export default App;
