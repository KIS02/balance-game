import { useEffect, useState } from "react";

const mockQuestions = [
  {
    id: 1,
    title: "네이버 vs 카카오",
    aText: "네이버",
    bText: "카카오",
    aImg: "https://res-console.cloudinary.com/dnbwcl1cf/thumbnails/transform/v1/image/upload/Y19maWxsLGhfMjAwLHdfMjAw/v1/aW1nX3AxX2FfbGRyN2c3/template_primary",
    bImg: "https://res-console.cloudinary.com/dnbwcl1cf/thumbnails/transform/v1/image/upload/Y19maWxsLGhfMjAwLHdfMjAw/v1/aW1nX3AxX2JfazBtN3Vm/template_primary",
    aCount: 10,
    bCount: 5,
  },
  {
    id: 2,
    title: "구글 vs 마이크로소프트",
    aText: "구글",
    bText: "마이크로소프트",
    aImg: "https://res-console.cloudinary.com/dnbwcl1cf/thumbnails/transform/v1/image/upload/Y19maWxsLGhfMjAwLHdfMjAw/v1/aW1nX3AyX2Ffa29kdjZq/template_primary",
    bImg: "https://res-console.cloudinary.com/dnbwcl1cf/thumbnails/transform/v1/image/upload/Y19maWxsLGhfMjAwLHdfMjAw/v1/aW1nX3AyX2JfeWUwd2x4/template_primary",
    aCount: 20,
    bCount: 30,
  },
  {
    id: 3,
    title: "강아지 vs 고양이",
    aText: "강아지",
    bText: "고양이",
    aImg: "/Img_5.png",
    bImg: "/Img_6.png",
    aCount: 15,
    bCount: 25,
  },
];

export function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    // 나중에는 여기서 서버 fetch로 바꾸면 됨
    setQuestions(mockQuestions);
    setLoading(false);
  }, []);

    const nextQuestion = () => {
    if (questions.length === 0) return;

    setCurrentIndex((prev) => (prev + 1) % questions.length);
    };

  const updateVote = (questionId, type) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) => {
        if (question.id !== questionId) return question;

        if (type === "A") {
          return {
            ...question,
            aCount: question.aCount + 1,
          };
        }

        return {
          ...question,
          bCount: question.bCount + 1,
        };
      })
    );
  };

  return {
    questions,
    currentQuestion,
    currentIndex,
    loading,
    nextQuestion,
    updateVote,
  };
}