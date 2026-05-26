import { useState } from "react";
import "../assets/ResultCommentBox.css";

function ResultCommentBox({ onSubmitComment, disabled = false }) {
  const [commentText, setCommentText] = useState("");

  const handleSubmitComment = (e) => {
    e.preventDefault();

    if (disabled) return;

    const trimmedComment = commentText.trim();

    if (!trimmedComment) return;

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
        <textarea
          className="comment-input"
          placeholder={disabled ? "이미 댓글을 작성했습니다" : "댓글을 입력하세요"}
          value={commentText}
          maxLength={80}
          rows={1}
          disabled={disabled}
          onChange={(e) => setCommentText(e.target.value)}
          onInput={(e) => {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
        />

        <button
          className="comment-submit-button"
          type="submit"
          disabled={disabled || !commentText.trim()}
        >
          제출
        </button>
      </form>
    </div>
  );
}

export default ResultCommentBox;