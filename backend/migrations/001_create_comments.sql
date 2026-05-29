-- comments 테이블: 질문별 사용자 댓글 (사용자당 질문 1개)
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  content VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_question_user (question_id, user_id),
  CONSTRAINT comments_ibfk_question FOREIGN KEY (question_id) REFERENCES questions (id),
  CONSTRAINT comments_ibfk_user FOREIGN KEY (user_id) REFERENCES users (id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
