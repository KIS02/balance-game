import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import "../assets/FloatingComments.css";
import {
  deleteMyComment,
  getCommentsByQuestionId,
} from "../services/commentService";

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#9ca3af" />
    <circle cx="50" cy="38" r="18" fill="white" />
    <path d="M20 88c4-20 20-32 30-32s26 12 30 32" fill="white" />
  </svg>
`)}`;

const COMMENT_SHOW_INTERVAL = 250;

const readCommentLayoutVars = () => {
  const styles = getComputedStyle(document.documentElement);

  const readPx = (name, fallback) => {
    const value = parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    modalGap: readPx("--comment-modal-gap", 20),
    edgeInset: readPx("--comment-edge-inset", 16),
    cardWidth: readPx("--comment-card-width", 220),
  };
};

const FloatingComments = forwardRef(function FloatingComments(
  {
    show,
    questionId,
    accessToken,
    currentUserId,
    onMyCommentStateChange,
    onImageError,
    onAuthExpired,
  },
  ref
) {
  const [comments, setComments] = useState([]);
  const [areaStyle, setAreaStyle] = useState({ left: null, right: null });
  const [detailComment, setDetailComment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizeComment = useCallback((comment, index) => {
    if (!comment || typeof comment !== "object") {
      return null;
    }

    const side =
      comment.side === "left" || comment.side === "right"
        ? comment.side
        : index % 2 === 0
          ? "left"
          : "right";

    return {
      uniqueId:
        comment.id ??
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
      content: comment.content || comment.text || "",
      side,
    };
  }, []);

  const sanitizeComments = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];

      return items
        .filter(Boolean)
        .map((comment, index) => {
          if (comment.uniqueId && (comment.side === "left" || comment.side === "right")) {
            return comment;
          }

          return normalizeComment(comment, index);
        })
        .filter(Boolean);
    },
    [normalizeComment]
  );

  const applyComments = useCallback(
    (backendComments, withAnimation) => {
      const normalized = sanitizeComments(backendComments ?? []);

      if (!withAnimation) {
        setComments(normalized);
        return;
      }

      setComments([]);
      let index = 0;

      const intervalId = setInterval(() => {
        if (index >= normalized.length) {
          clearInterval(intervalId);
          return;
        }

        const nextComment = normalized[index];
        index += 1;

        if (!nextComment) return;

        setComments((prev) => sanitizeComments([...prev, nextComment]));
      }, COMMENT_SHOW_INTERVAL);

      return intervalId;
    },
    [sanitizeComments]
  );

  const loadComments = useCallback(
    async ({ withAnimation = true, isCancelled = () => false } = {}) => {
      if (!questionId) return null;

      try {
        const result = await getCommentsByQuestionId(questionId, accessToken);

        if (isCancelled()) return null;

        onMyCommentStateChange?.(Boolean(result?.hasMyComment));

        return applyComments(result?.comments ?? [], withAnimation);
      } catch (error) {
        console.error("댓글을 불러오지 못했습니다.", error);

        if (error.status === 401) {
          onAuthExpired?.();
        }

        if (!isCancelled()) {
          setComments([]);
          onMyCommentStateChange?.(false);
        }

        return null;
      }
    },
    [questionId, accessToken, onMyCommentStateChange, applyComments, onAuthExpired]
  );

  const addFloatingComment = useCallback(
    (comment) => {
      setComments((prevComments) => {
        const safePrev = sanitizeComments(prevComments);
        const normalizedComment = normalizeComment(comment, safePrev.length);

        if (!normalizedComment) return safePrev;

        const exists = safePrev.some(
          (item) => item.uniqueId === normalizedComment.uniqueId
        );

        if (exists) return safePrev;

        return [...safePrev, normalizedComment];
      });
    },
    [normalizeComment, sanitizeComments]
  );

  const handleDeleteComment = async () => {
    if (!detailComment || !accessToken || !questionId || isDeleting) return;

    const isMyComment =
      currentUserId != null &&
      detailComment.userId != null &&
      String(detailComment.userId) === String(currentUserId);

    if (!isMyComment) return;

    try {
      setIsDeleting(true);
      await deleteMyComment(questionId, accessToken);
      setDetailComment(null);
      await loadComments({ withAnimation: false });
    } catch (error) {
      console.error("댓글 삭제에 실패했습니다.", error);

      if (error.status === 401) {
        onAuthExpired?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
      const { modalGap, edgeInset, cardWidth } = readCommentLayoutVars();

      const leftWidth = Math.max(0, rect.left - modalGap - edgeInset);
      const rightStart = rect.right + modalGap;
      const rightWidth = Math.max(0, screenWidth - edgeInset - rightStart);

      setAreaStyle({
        left: {
          position: "fixed",
          left: `${edgeInset}px`,
          top: `${rect.top}px`,
          width: `${leftWidth}px`,
          height: `${rect.height}px`,
          "--lane-card-width": `${Math.min(cardWidth, leftWidth)}px`,
        },
        right: {
          position: "fixed",
          left: `${rightStart}px`,
          top: `${rect.top}px`,
          width: `${rightWidth}px`,
          height: `${rect.height}px`,
          "--lane-card-width": `${Math.min(cardWidth, rightWidth)}px`,
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
      setDetailComment(null);
      onMyCommentStateChange?.(false);
      return;
    }

    let intervalId = null;
    let isCancelled = false;

    const run = async () => {
      setDetailComment(null);
      intervalId = await loadComments({
        withAnimation: true,
        isCancelled: () => isCancelled,
      });
    };

    run();

    return () => {
      isCancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [show, questionId, accessToken, loadComments, onMyCommentStateChange]);

  if (!show || !areaStyle.left || !areaStyle.right) return null;

  const safeComments = sanitizeComments(comments);

  const detailIsMine =
    detailComment &&
    currentUserId != null &&
    detailComment.userId != null &&
    String(detailComment.userId) === String(currentUserId);

  return (
    <>
      <CommentLane
        side="left"
        style={areaStyle.left}
        comments={safeComments.filter((comment) => comment.side === "left")}
        onImageError={onImageError}
        onOpenDetail={setDetailComment}
      />

      <CommentLane
        side="right"
        style={areaStyle.right}
        comments={safeComments.filter((comment) => comment.side === "right")}
        onImageError={onImageError}
        onOpenDetail={setDetailComment}
      />

      {detailComment && (
        <div
          className="comment-detail-overlay"
          onClick={() => setDetailComment(null)}
        >
          <div
            className="comment-detail-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="comment-detail-header">
              <img
                className="comment-detail-avatar"
                src={detailComment.picture}
                onError={onImageError}
                alt=""
              />
              <span className="comment-detail-name">{detailComment.name}</span>
              <button
                className="comment-detail-close"
                type="button"
                onClick={() => setDetailComment(null)}
              >
                닫기
              </button>
            </div>

            <p className="comment-detail-content">{detailComment.content}</p>

            {detailIsMine && (
              <button
                className="comment-detail-delete"
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteComment}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
});

function CommentLane({ side, style, comments, onImageError, onOpenDetail }) {
  const cutName = (text) => {
    if (!text) return "";
    return text.length > 8 ? `${text.slice(0, 8)}...` : text;
  };

  return (
    <div className={`comment-lane comment-lane-${side}`} style={style}>
      {comments.map((comment) => (
        <div className="floating-comment-wrapper" key={comment.uniqueId}>
          <div
            className="floating-comment-box"
            onClick={() => onOpenDetail(comment)}
          >
            <img
              className="floating-comment-img"
              src={comment.picture}
              onError={onImageError}
              alt=""
            />

            <div className="floating-comment-content">
              <div className="floating-comment-id">{cutName(comment.name)}</div>
              <div className="floating-comment-text">{comment.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FloatingComments;
