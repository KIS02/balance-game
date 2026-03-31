import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [a, setA] = useState(10);
  const [b, setB] = useState(5);

  const [animate, setAnimate] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const total = a + b;
  const aPercent = total ? ((a / total) * 100).toFixed(1) : 0;
  const bPercent = total ? ((b / total) * 100).toFixed(1) : 0;

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const handleChoice = (type) => {
    if (type === "A") setA(a + 1);
    else setB(b + 1);

    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
  };

  return (
    <div className="container">
      <h1 className="title">네이버 vs 카카오</h1>

      {/* 선택 카드 */}
      {!showResult && (
        <div className="choices">

          <div
            className={`card left ${animate ? "show" : ""}`}
            onClick={() => handleChoice("A")}
          >
            <div className="overlay-text">네이버</div>
          </div>

          <div
            className={`card right ${animate ? "show" : ""}`}
            onClick={() => handleChoice("B")}
          >
            <div className="overlay-text">카카오</div>
          </div>
        </div>
      )}

      {/* 결과 바텀시트 */}
      {showResult && (
        <div className="overlay">
          <div className="bottom-sheet">
            <h2>결과</h2>

            <p>네이버: {aPercent}%</p>
            <p>카카오: {bPercent}%</p>

            <button onClick={nextQuestion}>
              다음 문제 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;