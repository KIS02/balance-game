-- 짜장면 vs 짬뽕, 강아지 vs 고양이 질문/선택지 추가
-- 기존 questions/options/responses/comments 데이터는 변경하지 않음
-- id는 AUTO_INCREMENT + LAST_INSERT_ID()로 부여

START TRANSACTION;

-- 1. 짜장면 vs 짬뽕
INSERT INTO questions (title, description, category, is_active)
VALUES (
  '짜장면 vs 짬뽕',
  '더 선호하는 중식을 선택하세요.',
  'Food',
  1
);

SET @question_jjajang_id = LAST_INSERT_ID();

INSERT INTO options (question_id, content, image_url, option_order) VALUES
  (@question_jjajang_id, '짜장면', '/images/jjajangmyeon.jpg', 1),
  (@question_jjajang_id, '짬뽕', '/images/jjamppong.jpg', 2);

-- 2. 강아지 vs 고양이
INSERT INTO questions (title, description, category, is_active)
VALUES (
  '강아지 vs 고양이',
  '더 선호하는 반려동물을 선택하세요.',
  'Animal',
  1
);

SET @question_pet_id = LAST_INSERT_ID();

INSERT INTO options (question_id, content, image_url, option_order) VALUES
  (@question_pet_id, '강아지', '/images/dog.jpg', 1),
  (@question_pet_id, '고양이', '/images/cat.jpg', 2);

COMMIT;
