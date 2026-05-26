import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import "../assets/FloatingComments.css";
import { getCommentsByQuestionId } from "../services/commentService";

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#9ca3af" />
    <circle cx="50" cy="38" r="18" fill="white" />
    <path d="M20 88c4-20 20-32 30-32s26 12 30 32" fill="white" />
  </svg>
`)}`;

const COMMENT_SHOW_INTERVAL = 250;

const FloatingComments = forwardRef(function FloatingComments(
  { show, questionId, currentUserId, onMyCommentStateChange, onImageError },
  ref
) {
  const [comments, setComments] = useState([]);
  const [areaStyle, setAreaStyle] = useState({left: null, right: null,});
  const [selectedCommentId, setSelectedCommentId] = useState(null);


    // ! Important ! 댓글삭제부분
  const deleteFloatingComment = (uniqueId) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.uniqueId !== uniqueId)
    );

    setSelectedCommentId(null);
  };

  useEffect(() => {
    if (!currentUserId) {
      onMyCommentStateChange?.(false);
      return;
    }

    const hasMyComment = comments.some(
      (comment) =>
        comment.userId != null &&
        String(comment.userId) === String(currentUserId)
    );

    onMyCommentStateChange?.(hasMyComment);
  }, [comments, currentUserId, onMyCommentStateChange]);


  
  const cutText = (text, maxLength) => {
    if (!text) return "";

    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }

    return text;
  };


  const normalizeComment = useCallback((comment, index) => {
    return {
      uniqueId:
        comment.uniqueId ??
        `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,

      userId: comment.userId ?? null,

      name:
        comment.name ||
        comment.userName ||
        (typeof comment.userId === "string" ? comment.userId : "익명"),

      picture:
        comment.picture ||
        comment.userImage ||
        comment.image ||
        DEFAULT_PROFILE_IMAGE,

      content:
        comment.content ||
        comment.text ||
        "",

      side: index % 2 === 0 ? "left" : "right",
    };
  }, []);

  // 외부에서 댓글 하나 추가할 때 사용하는 함수
  const addFloatingComment = useCallback((comment) => {
    setComments((prevComments) => {
      const nextIndex = prevComments.length;

      const normalizedComment = {
        uniqueId:
          comment.uniqueId ??
          `${Date.now()}-${nextIndex}-${Math.random().toString(36).slice(2)}`,

        userId: comment.userId ?? null,
        name: comment.name || "익명",
        picture: comment.picture || DEFAULT_PROFILE_IMAGE,
        content: comment.content || "",

        side: nextIndex % 2 === 0 ? "left" : "right",
      };

      return [...prevComments, normalizedComment];
    });
  }, []);

  // App.jsx에서 ref로 addFloatingComment를 호출할 수 있게 열어줌
  useImperativeHandle(ref, () => ({
    addFloatingComment,
  }));

  useLayoutEffect(() => {
    if (!show) {
      setAreaStyle({
        left: null,
        right: null,
      });
      return;
    }

    const updateCommentArea = () => {
      const resultBox = document.querySelector(".result-box");
      if (!resultBox) return;

      const rect = resultBox.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const gap = 16;

      setAreaStyle({
        left: {
          position: "fixed",
          left: `${gap}px`,
          top: `${rect.top}px`,
          width: `${Math.max(0, rect.left - gap * 2)}px`,
          height: `${rect.height}px`,
        },
        right: {
          position: "fixed",
          left: `${rect.right + gap}px`,
          top: `${rect.top}px`,
          width: `${Math.max(0, screenWidth - rect.right - gap * 2)}px`,
          height: `${rect.height}px`,
        },
      });
    };

    updateCommentArea();

    const animationTimer = setTimeout(updateCommentArea, 550);

    window.addEventListener("resize", updateCommentArea);

    return () => {
      clearTimeout(animationTimer);
      window.removeEventListener("resize", updateCommentArea);
    };
  }, [show, questionId]);

  useEffect(() => {
    if (!show || !questionId) {
      setComments([]);
      return;
    }

    let intervalId = null;
    let isCancelled = false;
    const handleSubmitComment = (e) => {
    e.preventDefault();

    const trimmedComment = commentText.trim();

    if (!trimmedComment) return;

    onSubmitComment(trimmedComment);

    setCommentText("");
  };

    const loadComments = async () => {
      setComments([]);

      try {
        const backendComments = await getCommentsByQuestionId(questionId);

        if (isCancelled) return;

        let index = 0;

        intervalId = setInterval(() => {
          if (index >= backendComments.length) {
            clearInterval(intervalId);
            return;
          }

          addFloatingComment(backendComments[index]);
          index += 1;
        }, 250);
      } catch (error) {
        console.error("댓글을 불러오지 못했습니다.", error);
        setComments([]);
      }
    };

    loadComments();

    return () => {
      isCancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [show, questionId, addFloatingComment]);

  if (!show || !areaStyle.left || !areaStyle.right) return null;

  return (
    <>
      <CommentLane
        side="left"
        style={areaStyle.left}
        comments={comments.filter((comment) => comment.side === "left")}
        currentUserId={currentUserId}
        selectedCommentId={selectedCommentId}
        setSelectedCommentId={setSelectedCommentId}
        deleteFloatingComment={deleteFloatingComment}
        onImageError={onImageError}
        cutText={cutText}
      />

      <CommentLane
        side="right"
        style={areaStyle.right}
        comments={comments.filter((comment) => comment.side === "right")}
        currentUserId={currentUserId}
        selectedCommentId={selectedCommentId}
        setSelectedCommentId={setSelectedCommentId}
        deleteFloatingComment={deleteFloatingComment}
        onImageError={onImageError}
        cutText={cutText}
      />
    </>
  );
});

function CommentLane({
  side,
  style,
  comments,
  currentUserId,
  selectedCommentId,
  setSelectedCommentId,
  deleteFloatingComment,
  onImageError,
  cutText,
}) {
  return (
    <div className={`comment-lane comment-lane-${side}`} style={style}>
      {comments.map((comment) => {
        const isMyComment =
          currentUserId != null &&
          comment.userId != null &&
          String(comment.userId) === String(currentUserId);

        const isSelected = selectedCommentId === comment.uniqueId;

        return (
          <div className="floating-comment-wrapper" key={comment.uniqueId}>
            <div
              className="floating-comment-box"
              onClick={() => {
                if (!isMyComment) return;

                setSelectedCommentId((prevId) =>
                  prevId === comment.uniqueId ? null : comment.uniqueId
                );
              }}
            >
              <img
                className="floating-comment-img"
                src={comment.picture}
                onError={onImageError}
                alt=""
              />

              <div className="floating-comment-content">
                <div className="floating-comment-id">
                  {cutText(comment.name, 8)}
                </div>

                <div className="floating-comment-text">
                  {cutText(comment.content, 12)}
                </div>
              </div>
            </div>

            {isMyComment && isSelected && (
              <button
                className="floating-comment-delete-button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFloatingComment(comment.uniqueId);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FloatingComments;