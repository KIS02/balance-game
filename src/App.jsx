import { useState } from "react";

function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  const [voted, setVoted] = useState(false);

  const total = a + b;
  const aPercent = total ? ((a / total) * 100).toFixed(1) : 0;
  const bPercent = total ? ((b / total) * 100).toFixed(1) : 0;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🍗 치킨 vs 🍕 피자</h1>

    <button
      onClick={() => {
        setA(a + 1);
        setVoted(true);
      }}
      disabled={voted}
    >
        치킨 선택
      </button>

    <button
      onClick={() => {
        setB(b + 1);
        setVoted(true);
      }}
      disabled={voted}
    >
        피자 선택
      </button>

      <h2>치킨: {a} ({aPercent}%)</h2>
      <h2>피자: {b} ({bPercent}%)</h2>
    </div>
  );
}

export default App;