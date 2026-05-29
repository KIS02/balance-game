import { useState } from "react";
import "../assets/ResultCommentBox.css";
import { COMMENT_MAX_LENGTH } from "../constants/comments";

function ResultCommentBox({ onSubmitComment, disabled = false }) {
  const [commentText, setCommentText] = useState("");

  const trimmedComment = commentText.trim();
  const isOverLimit = commentText.length > COMMENT_MAX_LENGTH;
  const canSubmit = trimmedComment && !isOverLimit && !disabled;

  const handleSubmitComment = (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    if (typeof onSubmitComment !== "function") {
      console.error("onSubmitComment가 함수로 전달되지 않았습니다.");
      return;
    }

    onSubmitComment(trimmedComment);
    setCommentText("");
  };

  return (
    <div className="result-comment-section">
      <form className="comment-write-box" onSubmit={handleSubmitComment}>
        <div className="comment-input-wrap">
          <textarea
            className="comment-input"
            placeholder={disabled ? "이미 댓글을 작성했습니다" : "댓글을 입력하세요"}
            value={commentText}
            maxLength={COMMENT_MAX_LENGTH}
            rows={1}
            disabled={disabled}
            onChange={(e) => setCommentText(e.target.value)}
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
          />
          {!disabled && (
            <div
              className={`comment-char-count${isOverLimit ? " comment-char-count-over" : ""}`}
            >
              {commentText.length}/{COMMENT_MAX_LENGTH}
            </div>
          )}
        </div>

        <button
          className="comment-submit-button"
          type="submit"
          disabled={!canSubmit}
        >
          제출
        </button>
      </form>
      {isOverLimit && (
        <p className="comment-limit-message">
          댓글은 {COMMENT_MAX_LENGTH}자 이하로 작성해주세요.
        </p>
      )}
    </div>
  );
}

export default ResultCommentBox;
