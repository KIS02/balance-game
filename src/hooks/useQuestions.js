import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3001";

const createPlaceholderImage = (label, color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="${color}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="64" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const mapQuestionFromApi = (question) => {
  const [firstOption, secondOption] = question.options ?? [];

  return {
    id: question.id,
    title: question.title,
    aOptionId: firstOption?.id,
    bOptionId: secondOption?.id,
    aText: firstOption?.text ?? "",
    bText: secondOption?.text ?? "",
    aImg: createPlaceholderImage(firstOption?.text ?? "A", "#4f46e5"),
    bImg: createPlaceholderImage(secondOption?.text ?? "B", "#ec4899"),
    aCount: firstOption?.voteCount ?? 0,
    bCount: secondOption?.voteCount ?? 0,
  };
};

export function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const controller = new AbortController();

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/questions`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("질문 목록을 불러오지 못했습니다.");
        }

        setQuestions(data.result.map(mapQuestionFromApi));
        setCurrentIndex(0);
      } catch (err) {
        if (err.name === "AbortError") return;

        setError(err.message || "API 요청 중 오류가 발생했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => controller.abort();
  }, []);

  const nextQuestion = () => {
    if (questions.length === 0) return;

    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const updateVote = async (questionId, optionId) => {
    try {
      setVoting(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("투표에 실패했습니다.");
      }

      const updatedQuestion = mapQuestionFromApi(data.result);

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.id === updatedQuestion.id ? updatedQuestion : question
        )
      );

      return updatedQuestion;
    } catch (err) {
      setError(err.message || "API 요청 중 오류가 발생했습니다.");
      return null;
    } finally {
      setVoting(false);
    }
  };

  return {
    questions,
    currentQuestion,
    currentIndex,
    loading,
    voting,
    error,
    nextQuestion,
    updateVote,
  };
}