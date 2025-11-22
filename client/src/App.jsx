import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [health, setHealth] = useState("—");
  const [version, setVersion] = useState("—");
  const [error, setError] = useState("");

  // Prefer env base URL if present (e.g., local dev), otherwise use '/api' for CloudFront routing in prod
  const apiBase = import.meta.env?.VITE_API_BASE_URL || "/api";

  useEffect(() => {
    // auto-check health once on load
    fetch(`${apiBase}/health`)
      .then((r) => r.text())
      .then((txt) => {
        console.log("Health check:", txt);
        setHealth(txt);
      })
      .catch((e) => {
        console.error("Health error:", e);
        setError(String(e));
      });

    // also grab version (optional)
    fetch(`${apiBase}/version`)
      .then((r) => r.json())
      .then((data) => {
        console.log("Version:", data);
        setVersion(JSON.stringify(data));
      })
      .catch((e) => {
        console.error("Version error:", e);
        setError((prev) => prev || String(e));
      });
  }, [apiBase]);

  const checkAgain = async () => {
    setError("");
    try {
      const h = await fetch(`${apiBase}/health`).then((r) => r.text());
      setHealth(h);
      const v = await fetch(`${apiBase}/version`).then((r) => r.json());
      setVersion(JSON.stringify(v));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <hr />

      <div className="card">
        <h2>API Connectivity</h2>
        <p>
          <strong>apiBase:</strong> <code>{apiBase}</code>
        </p>
        <p>
          <strong>/health:</strong> <code>{health}</code>
        </p>
        <p>
          <strong>/version:</strong> <code>{version}</code>
        </p>
        {error && (
          <p style={{ color: "tomato" }}>
            <strong>Error:</strong> {error}
          </p>
        )}
        <button onClick={checkAgain}>Check API again</button>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
