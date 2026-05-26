const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#9ca3af" />
    <circle cx="50" cy="38" r="18" fill="white" />
    <path d="M20 88c4-20 20-32 30-32s26 12 30 32" fill="white" />
  </svg>
`)}`;

const commentsByQuestionId = {
  1: [
    {
      userId: 1,
      name: "민수",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "나는 이거 고름",
    },
    {
      userId: 2,
      name: "지훈",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "반대가 더 나은듯",
    },
    {
      userId: 3,
      name: "수빈",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "이건 고민된다",
    },
    {
      userId: 4,
      name: "예린",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "생각보다 어렵네",
    },
    {
      userId: 5,
      name: "도윤",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "난 바로 골랐음",
    },
    {
      userId: 6,
      name: "하준",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "이건 취향차이",
    },
  ],

  2: [
    {
      userId: 7,
      name: "영희",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "무조건 A",
    },
    {
      userId: 8,
      name: "철수",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "B가 더 좋음",
    },
    {
      userId: 9,
      name: "서연",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "난 B 선택",
    },
    {
      userId: 10,
      name: "지우",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "A가 더 익숙함",
    },
    {
      userId: 11,
      name: "현우",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "둘 다 괜찮은데",
    },
  ],

  3: [
    {
      userId: 12,
      name: "준서",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "이건 고민 안 함",
    },
    {
      userId: 13,
      name: "채원",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "난 왼쪽 느낌",
    },
    {
      userId: 14,
      name: "시우",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "오른쪽이 더 나음",
    },
    {
      userId: 15,
      name: "유진",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "결과 궁금하다",
    },
    {
      userId: 16,
      name: "민재",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "생각보다 박빙",
    },
    {
      userId: 17,
      name: "나은",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "나는 소수파네",
    },
  ],

  default: [
    {
      userId: 99,
      name: "익명",
      picture: DEFAULT_PROFILE_IMAGE,
      content: "재밌다",
    },
  ],
};

export const getCommentsByQuestionId = async (questionId) => {
  // !Important! 나중에 실제 백엔드 연결 시 fetch로 교체하면 됨
  await new Promise((resolve) => setTimeout(resolve, 200));

  return commentsByQuestionId[questionId] ?? commentsByQuestionId.default;
};