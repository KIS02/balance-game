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
    console.log(`showResult : ${showResult}`);
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
  };

  return (

    
    <div className="container">
      <h1 className="title">네이버 vs 카카오</h1>

      {/* 선택 카드 */}
      <div className="choices">

        <div
          className={`card left ${animate ? "show" : ""}`}
          onClick={() => handleChoice("A")}
        >
          <h1 className="overlay-text">네이버</h1>
        </div>

        <div
          className={`card right ${animate ? "show" : ""}`}
          onClick={() => handleChoice("B")}
        >
          <h1 className="overlay-text">카카오</h1>
        </div>
      </div>


      {/* 결과창 */}
      {showResult && (
        <div className="result-overlay">
          <div className="result-box">
            <div className="result-title">결과</div>

            <div className="result-image"/>
            <div className="result-answer">
              <div className="result-font">
                <p>네이버</p>
                <p>{aPercent}%</p>
              </div>
              <div className="result-font">
                <p>vs</p>
              </div>
              <div className="result-font">
                <p>카카오</p>
                <p>{bPercent}%</p>
              </div>
            </div>
            <button className="nextButton" onClick={nextQuestion}>
              다음 문제
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;