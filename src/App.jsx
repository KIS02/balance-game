import { useState, useEffect, useRef } from "react";
import "./assets/App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginButton from "./components/LoginButton";
import { useQuestions } from "./hooks/useQuestions";
import { getResultTextFontSizes } from "./utils/getResultTextFontSizes";
import { getChoiceTextFontSizes } from "./utils/getChoiceTextFontSizes";
import FloatingComments from "./components/FloatingComments";
import ResultCommentBox from "./components/ResultCommentBox";
import { postComment } from "./services/commentService";
import {
  AUTH_EXPIRED_MESSAGE,
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "./services/authStorage";


const IMAGE_FALLBACK_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#6b7280" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="700">이미지 없음</text>
  </svg>
`)}`;


const initialAuthSession = loadAuthSession();

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
  const [loginUser, setLoginUser] = useState(initialAuthSession?.user ?? null);
  const [accessToken, setAccessToken] = useState(
    initialAuthSession?.accessToken ?? ""
  );
  const [voteMessage, setVoteMessage] = useState("");
  const [userVotesByQuestionId, setUserVotesByQuestionId] = useState({});
  const [hasMyComment, setHasMyComment] = useState(false); // 내가 댓글을 달았는지

  const floatingCommentsRef = useRef(null);
  const previousChoiceRef = useRef(null);

  const [showPreviousChoicePopover, setShowPreviousChoicePopover] = useState(false);

  const handleAuthExpired = () => {
    clearAuthSession();
    setLoginUser(null);
    setAccessToken("");
    setVoteMessage(AUTH_EXPIRED_MESSAGE);
  };

  const handleLogout = () => {
    clearAuthSession();
    setLoginUser(null);
    setAccessToken("");
    setVoteMessage("");
  };

  const handleSubmitComment = async (inputComment) => {
    if (hasMyComment || !accessToken || !currentQuestion) return;

    try {
      const createdComment = await postComment(
        currentQuestion.id,
        inputComment,
        accessToken
      );

      floatingCommentsRef.current?.addFloatingComment({
        id: createdComment.id,
        userId: createdComment.userId ?? loginUser?.id ?? null,
        name: createdComment.name || loginUser?.name || "익명",
        picture: createdComment.picture || loginUser?.picture || IMAGE_FALLBACK_SRC,
        content: createdComment.content,
      });

      setHasMyComment(true);
    } catch (error) {
      if (error.status === 401) {
        handleAuthExpired();
        return;
      }

      if (error.status === 409) {
        setHasMyComment(true);
        setVoteMessage(error.message || "이미 댓글을 작성한 질문입니다.");
        return;
      }

      setVoteMessage(error.message || "댓글 작성에 실패했습니다.");
    }
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

  const cardOrder = ["A", "B"];

  const saveUserVote = (questionId, optionId) => {
    if (questionId == null || optionId == null) return;

    setUserVotesByQuestionId((prev) => ({
      ...prev,
      [questionId]: Number(optionId),
    }));
  };

  const getPreviousChoiceOption = () => {
    if (!currentQuestion) return null;

    const optionId = userVotesByQuestionId[currentQuestion.id];
    if (optionId == null) return null;

    if (Number(optionId) === Number(currentQuestion.aOptionId)) {
      return {
        text: currentQuestion.aText,
        img: currentQuestion.aImg,
      };
    }

    if (Number(optionId) === Number(currentQuestion.bOptionId)) {
      return {
        text: currentQuestion.bText,
        img: currentQuestion.bImg,
      };
    }

    return null;
  };

  const isHoverFinePointer = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const handlePreviousChoiceMouseEnter = () => {
    if (isHoverFinePointer()) {
      setShowPreviousChoicePopover(true);
    }
  };

  const handlePreviousChoiceMouseLeave = () => {
    if (isHoverFinePointer()) {
      setShowPreviousChoicePopover(false);
    }
  };

  const handlePreviousChoiceClick = (event) => {
    event.stopPropagation();

    if (!isHoverFinePointer()) {
      setShowPreviousChoicePopover((prev) => !prev);
    }
  };

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

    const selectedImage =
      type === "A" ? currentQuestion.aImg : currentQuestion.bImg;

    setVoteMessage("");

    try {
      const voteResult = await updateVote(
        currentQuestion.id,
        selectedOptionId,
        accessToken
      );

      if (voteResult?.status === 401) {
        handleAuthExpired();
        return;
      }

      if (voteResult?.question) {
        const resultImage =
          type === "A" ? voteResult.question.aImg : voteResult.question.bImg;
        const savedOptionId =
          voteResult.mySelectedOptionId ?? selectedOptionId ?? null;

        saveUserVote(currentQuestion.id, savedOptionId);
        setShowPreviousChoicePopover(false);
        setResultImg(resultImage || selectedImage);
        setVoteMessage(
          voteResult.isDuplicate
            ? voteResult.message || "이미 투표한 질문입니다."
            : voteResult.message || ""
        );
        setShowResult(true);
        return;
      }

      setShowResult(false);
      setResultImg(null);
      setVoteMessage(
        voteResult?.message || "투표 결과를 표시할 수 없습니다."
      );
    } catch (err) {
      setShowResult(false);
      setResultImg(null);
      setVoteMessage(err.message || "투표 처리 중 오류가 발생했습니다.");
    }
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setShowPreviousChoicePopover(false);
    setAnimate(false);
    setVoteMessage("");
    setHasMyComment(false);
    nextQuestion();
  };

  const handleLogin = ({ user, accessToken: googleAccessToken }) => {
    saveAuthSession(user, googleAccessToken);
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

  useEffect(() => {
    if (!showPreviousChoicePopover) return;

    const handlePointerDown = (event) => {
      if (
        previousChoiceRef.current &&
        !previousChoiceRef.current.contains(event.target)
      ) {
        setShowPreviousChoicePopover(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showPreviousChoicePopover]);

  const previousChoiceOption = getPreviousChoiceOption();

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
          <LoginButton
            user={loginUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
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
            accessToken={accessToken}
            currentUserId={loginUser?.id ?? null}
            onMyCommentStateChange={setHasMyComment}
            onImageError={handleImageError}
            onAuthExpired={handleAuthExpired}
          />

          <div className="result-box">
            <div className="result-header">
              <div className="result-title">결과</div>

              {previousChoiceOption && (
                <div
                  ref={previousChoiceRef}
                  className="previous-choice-trigger"
                  onMouseEnter={handlePreviousChoiceMouseEnter}
                  onMouseLeave={handlePreviousChoiceMouseLeave}
                >
                  <button
                    type="button"
                    className="previous-choice-button"
                    onClick={handlePreviousChoiceClick}
                    aria-expanded={showPreviousChoicePopover}
                    aria-haspopup="dialog"
                  >
                    이전 선택
                  </button>

                  {showPreviousChoicePopover && (
                    <div
                      className="previous-choice-popover"
                      role="dialog"
                      aria-label="이전 선택 정보"
                    >
                      <p className="previous-choice-popover-label">
                        이전에 선택한 항목
                      </p>
                      <img
                        className="previous-choice-popover-image"
                        src={previousChoiceOption.img}
                        alt=""
                        onError={handleImageError}
                      />
                      <p className="previous-choice-popover-text">
                        {previousChoiceOption.text}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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