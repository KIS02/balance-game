import { useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import {
  clearQuestionSession,
  loadQuestionSession,
  restoreQuestionOrder,
  saveQuestionSession,
} from "../services/questionSessionStorage";

const createPlaceholderImage = (label, color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="${color}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="64" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const shuffleQuestions = (questions) => {
  const array = [...questions];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

const shuffleQuestionsAvoidingFirst = (questions, avoidQuestionId) => {
  const array = shuffleQuestions(questions);

  if (
    avoidQuestionId == null ||
    array.length <= 1 ||
    array[0].id !== avoidQuestionId
  ) {
    return array;
  }

  const swapIndex = array.findIndex(
    (question, index) => index > 0 && question.id !== avoidQuestionId
  );
  const targetIndex = swapIndex > 0 ? swapIndex : 1;

  [array[0], array[targetIndex]] = [array[targetIndex], array[0]];

  return array;
};

const mapQuestionFromApi = (question) => {
  if (!question || typeof question !== "object") {
    throw new Error("유효하지 않은 질문 데이터입니다.");
  }

  const sortedOptions = [...(question.options ?? [])].sort(
    (a, b) => a.id - b.id
  );
  const [firstOption, secondOption] = sortedOptions;

  return {
    id: question.id,
    title: question.title,
    aOptionId: firstOption?.id,
    bOptionId: secondOption?.id,
    aText: firstOption?.text ?? "",
    bText: secondOption?.text ?? "",
    aImg:
      firstOption?.imageUrl ||
      createPlaceholderImage(firstOption?.text ?? "A", "#4f46e5"),
    bImg:
      secondOption?.imageUrl ||
      createPlaceholderImage(secondOption?.text ?? "B", "#ec4899"),
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

        const mappedQuestions = data.result.map(mapQuestionFromApi);
        const session = loadQuestionSession();
        const restored = restoreQuestionOrder(mappedQuestions, session);

        if (restored) {
          setQuestions(restored.questions);
          setCurrentIndex(restored.currentIndex);
          saveQuestionSession(restored.questions, restored.currentIndex);
        } else {
          clearQuestionSession();
          const shuffledQuestions = shuffleQuestions(mappedQuestions);

          setQuestions(shuffledQuestions);
          setCurrentIndex(0);
          saveQuestionSession(shuffledQuestions, 0);
        }
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

    if (currentIndex + 1 < questions.length) {
      const nextIndex = currentIndex + 1;

      setCurrentIndex(nextIndex);
      saveQuestionSession(questions, nextIndex);
      return;
    }

    const lastQuestionId = questions[currentIndex]?.id;

    setQuestions((prevQuestions) => {
      const shuffledQuestions = shuffleQuestionsAvoidingFirst(
        prevQuestions,
        lastQuestionId
      );

      saveQuestionSession(shuffledQuestions, 0);
      return shuffledQuestions;
    });
    setCurrentIndex(0);
  };

  const updateVote = async (questionId, optionId, accessToken) => {
    if (!accessToken) {
      setError("로그인 후 투표할 수 있습니다.");
      return null;
    }

    try {
      setVoting(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("서버 응답을 해석하지 못했습니다.");
      }

      if (data?.result && Array.isArray(data.result.options)) {
        const updatedQuestion = mapQuestionFromApi(data.result);

        setQuestions((prevQuestions) =>
          prevQuestions.map((question) =>
            question.id === updatedQuestion.id ? updatedQuestion : question
          )
        );

        return {
          question: updatedQuestion,
          message: data.message || "",
          success: Boolean(data.success),
          status: response.status,
          mySelectedOptionId: data.mySelectedOptionId ?? null,
          mySelectedOptionText: data.mySelectedOptionText ?? null,
        };
      }

      if (!response.ok || !data?.success) {
        const message = data?.message || "투표에 실패했습니다.";
        setError(message);
        return {
          question: null,
          message,
          success: false,
          status: response.status,
        };
      }

      return null;
    } catch (err) {
      const message = err.message || "API 요청 중 오류가 발생했습니다.";
      setError(message);
      return {
        question: null,
        message,
        success: false,
        status: null,
      };
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