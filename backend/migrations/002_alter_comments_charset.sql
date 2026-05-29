-- 이미 생성된 comments 테이블의 한글 깨짐(??? ) 수정용
-- 기존에 잘못 저장된 댓글 row는 복구 불가 → DELETE 후 다시 작성해서 검증하세요.

ALTER TABLE comments
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE comments
  MODIFY content VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
