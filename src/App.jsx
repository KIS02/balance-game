import { useState, useEffect, useMemo, useRef } from "react";
import "./assets/App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginButton from "./components/LoginButton";
import { useQuestions } from "./hooks/useQuestions";
import { getResultTextFontSizes } from "./utils/getResultTextFontSizes";
import { getChoiceTextFontSizes } from "./utils/getChoiceTextFontSizes";
import "./services/commentService";
import FloatingComments from "./components/FloatingComments";
import ResultCommentBox from "./components/ResultCommentBox";


const IMAGE_FALLBACK_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#6b7280" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">이미지 없음</text>
  </svg>
`)}`;


function App() {
  const [clientID] = useState(
    "745579463736-40h2qsko1926ai7u3a8hgj646pkf7c6e.apps.googleusercontent.com"
  );

  const {
    currentQuestion,
    loading,
    voting,
    error,
    nextQuestion,
    updateVote,
  } = useQuestions();

  const [animate, setAnimate] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultImg, setResultImg] = useState(null);
  const [loginUser, setLoginUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [voteMessage, setVoteMessage] = useState("");
  const [hasMyComment, setHasMyComment] = useState(false); // 내가 댓글을 달았는지

  const floatingCommentsRef = useRef(null);

  const handleSubmitComment = (inputComment) => {
    if (hasMyComment) return;

    const newComment = {
      uniqueId: Date.now(),
      userId: loginUser?.id ?? loginUser?.sub ?? loginUser?.googleSub ?? null,
      name: loginUser?.name || "익명",
      picture: loginUser?.picture || IMAGE_FALLBACK_SRC,
      content: inputComment,
    };

    floatingCommentsRef.current?.addFloatingComment(newComment);

    setHasMyComment(true);
  };


  const total = currentQuestion
    ? currentQuestion.aCount + currentQuestion.bCount
    : 0;

  const aPercent = total
    ? ((currentQuestion.aCount / total) * 100).toFixed(1)
    : 0;

  const bPercent = total
    ? ((currentQuestion.bCount / total) * 100).toFixed(1)
    : 0;

  const { aFontSize, bFontSize } = currentQuestion
    ? getResultTextFontSizes(currentQuestion.aText, currentQuestion.bText)
    : { aFontSize: "10cqw", bFontSize: "10cqw" };

  const { aChoiceFontSize, bChoiceFontSize } = currentQuestion
    ? getChoiceTextFontSizes(currentQuestion.aText, currentQuestion.bText)
    : { aFontSize: "4cqw", bFontSize: "4cqw" };

  const cardOrder = useMemo(() => {
    return Math.random() < 0.5 ? ["A", "B"] : ["B", "A"];
  }, [currentQuestion?.id]);

  const getCardData = (type) => {
    if (!currentQuestion) return null;

    if (type === "A") {
      return {
        type: "A",
        img: currentQuestion.aImg,
        text: currentQuestion.aText,
        fontSize: aChoiceFontSize,
      };
    }

    return {
      type: "B",
      img: currentQuestion.bImg,
      text: currentQuestion.bText,
      fontSize: bChoiceFontSize,
    };
  };

  const handleChoice = async (type) => {
    if (!currentQuestion || showResult || voting) return;

    if (!accessToken) {
      setVoteMessage("로그인 후 투표할 수 있습니다.");
      return;
    }

    const selectedOptionId =
      type === "A" ? currentQuestion.aOptionId : currentQuestion.bOptionId;

    if (!selectedOptionId) return;



    setVoteMessage("");
    const voteResult = await updateVote(
      currentQuestion.id,
      selectedOptionId,
      accessToken
    );

    if ( aPercent > bPercent ) {
      setResultImg(currentQuestion.aImg);
    } else {
      setResultImg(currentQuestion.bImg);
    }

    if (voteResult?.question) {
      setVoteMessage(voteResult.message);
      setShowResult(true);
    }
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setAnimate(false);
    setVoteMessage("");
    nextQuestion();
  };

  const handleLogin = ({ user, accessToken: googleAccessToken }) => {
    setLoginUser(user);
    setAccessToken(googleAccessToken);
    setVoteMessage("");
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = IMAGE_FALLBACK_SRC;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentQuestion?.id]);

  if (loading) {
    return <div>문제를 불러오는 중...</div>;
  }

  if (error && !currentQuestion) {
    return <div>{error}</div>;
  }

  if (!currentQuestion) {
    return <div>더 이상 문제가 없습니다.</div>;
  }


    

  return (
    <div className="container">
      {/* 구글 로그인 기능 구현 관련 */}
      <GoogleOAuthProvider clientId={clientID}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 20 }}>
          <LoginButton user={loginUser} onLogin={handleLogin} />
        </div>
      </GoogleOAuthProvider>

      <h1 className="title">{currentQuestion.title}</h1>
      {error && <div className="api-error">{error}</div>}
      {voteMessage && <div className="api-status">{voteMessage}</div>}
      {voting && <div className="api-status">투표 처리 중...</div>}

      {/* 선택 카드 */}
        <div className="choices">
          {cardOrder.map((type, index) => {
            const card = getCardData(type);
            if (!card) return null;

            const sideClass = index === 0 ? "left" : "right";

            return (
              <div
                key={card.type}
                className={`card ${sideClass} ${animate ? "show" : ""}`}
                onClick={() => handleChoice(card.type)}
              >
                <img src={card.img} onError={handleImageError} />

                <h1
                  className="overlay-text"
                  style={{ fontSize: card.fontSize }}
                >
                  {card.text}
                </h1>
              </div>
            );
          })}
        </div>

      {/* 결과창 */}
      {showResult && (
        <div className="result-overlay">
          {/* 댓글 */}
          <FloatingComments
            ref={floatingCommentsRef}
            show={showResult}
            questionId={currentQuestion.id}
            currentUserId={loginUser?.id ?? loginUser?.sub ?? loginUser?.googleSub ?? null}
            onMyCommentStateChange={setHasMyComment}
            onImageError={handleImageError}
          />

          <div className="result-box">
            <div className="result-title">결과</div>

            <img
              className="result-image"
              src={resultImg}
              onError={handleImageError}
            />

            <div className="result-answer">
              <div className="result-font">
                <p style={{ fontSize: aFontSize }}>{currentQuestion.aText}</p>
                <p>{aPercent}%</p>
              </div>

              <div className="result-font">
                <p>vs</p>
              </div>

              <div className="result-font">
                <p style={{ fontSize: bFontSize }}>{currentQuestion.bText}</p>
                <p>{bPercent}%</p>
              </div>
            </div>

            <button className="nextButton" onClick={handleNextQuestion}>
              다음 문제
            </button>
          </div>
          
          <ResultCommentBox
            onSubmitComment={handleSubmitComment}
            disabled={hasMyComment}
          />
        </div>
      )}
    </div>
  );
}

export default App;