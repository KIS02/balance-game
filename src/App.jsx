import { useState, useEffect } from "react";
import "./assets/App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginButton from "./components/LoginButton";
import { useQuestions } from "./hooks/useQuestions";
import { getResultTextFontSizes } from "./utils/getResultTextFontSizes";
import { getChoiceTextFontSizes } from "./utils/getChoiceTextFontSizes";



function App() {
  const [clientID] = useState(
    "745579463736-40h2qsko1926ai7u3a8hgj646pkf7c6e.apps.googleusercontent.com"
  );

  const {
    currentQuestion,
    loading,
    nextQuestion,
    updateVote,
  } = useQuestions();

  const [animate, setAnimate] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultImg, setResultImg] = useState(null);

  const total = currentQuestion
    ? currentQuestion.aCount + currentQuestion.bCount
    : 0;

  const aPercent = total
    ? ((currentQuestion.aCount / total) * 100).toFixed(1)
    : 0;

  const bPercent = total
    ? ((currentQuestion.bCount / total) * 100).toFixed(1)
    : 0;

  const handleChoice = (type) => {
    if (!currentQuestion) return;

    if (type === "A") {
      setResultImg(currentQuestion.aImg);
    } else {
      setResultImg(currentQuestion.bImg);
    }

    updateVote(currentQuestion.id, type);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setAnimate(false);
    nextQuestion();
  };

  useEffect(() => {
    setAnimate(false);

    const timer = setTimeout(() => {
      setAnimate(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [currentQuestion?.id]);

  if (loading) {
    return <div>문제를 불러오는 중...</div>;
  }

  if (!currentQuestion) {
    return <div>더 이상 문제가 없습니다.</div>;
  }

  const { aFontSize, bFontSize } = currentQuestion
    ? getResultTextFontSizes(currentQuestion.aText, currentQuestion.bText)
    : { aFontSize: "10cqw", bFontSize: "10cqw" };

  const { aChoiceFontSize, bChoiceFontSize } = currentQuestion
    ? getChoiceTextFontSizes(currentQuestion.aText, currentQuestion.bText)
    : { aFontSize: "4cqw", bFontSize: "4cqw" };

  return (
    <div className="container">
      {/* 구글 로그인 기능 구현 관련 */}
      <GoogleOAuthProvider clientId={clientID}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 20 }}>
          <LoginButton />
        </div>
      </GoogleOAuthProvider>

      <h1 className="title">{currentQuestion.title}</h1>

      {/* 선택 카드 */}
      <div className="choices">
        <div
          className={`card left ${animate ? "show" : ""}`}
          onClick={() => handleChoice("A")}
        >
          <img src={currentQuestion.aImg} />
          <h1 
            className="overlay-text"
            style={{ fontSize: aChoiceFontSize }}>
              {currentQuestion.aText}
          </h1>
        </div>

        <div
          className={`card right ${animate ? "show" : ""}`}
          onClick={() => handleChoice("B")}
        >
          <img src={currentQuestion.bImg} />
            <h1 className="overlay-text"
            style={{ fontSize: bChoiceFontSize }}>
            {currentQuestion.bText}
          </h1>
        </div>
      </div>

      {/* 결과창 */}
      {showResult && (
        <div className="result-overlay">
          <div className="result-box">
            <div className="result-title">결과</div>

            <img className="result-image" src={resultImg} />

            <div className="result-answer">
              <div className="result-font">
                <p style={{fontSize: aFontSize }}>
                  {currentQuestion.aText}</p>
                <p>{aPercent}%</p>
              </div>

              <div className="result-font">
                <p>vs</p>
              </div>

              <div className="result-font">
                <p style={{fontSize: bFontSize }}>
                  {currentQuestion.bText}</p>
                <p>{bPercent}%</p>
              </div>
            </div>

            <button className="nextButton" onClick={handleNextQuestion}>
              다음 문제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;