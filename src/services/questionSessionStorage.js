export const QUESTION_SESSION_KEYS = {
  QUESTION_IDS: "balanceGameQuestionIds",
  CURRENT_QUESTION_ID: "balanceGameCurrentQuestionId",
  CURRENT_INDEX: "balanceGameCurrentIndex",
};

export const clearQuestionSession = () => {
  sessionStorage.removeItem(QUESTION_SESSION_KEYS.QUESTION_IDS);
  sessionStorage.removeItem(QUESTION_SESSION_KEYS.CURRENT_QUESTION_ID);
  sessionStorage.removeItem(QUESTION_SESSION_KEYS.CURRENT_INDEX);
};

export const saveQuestionSession = (questions, currentIndex) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    clearQuestionSession();
    return;
  }

  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    questions.length - 1
  );
  const currentQuestion = questions[safeIndex];

  sessionStorage.setItem(
    QUESTION_SESSION_KEYS.QUESTION_IDS,
    JSON.stringify(questions.map((question) => question.id))
  );
  sessionStorage.setItem(
    QUESTION_SESSION_KEYS.CURRENT_INDEX,
    String(safeIndex)
  );

  if (currentQuestion?.id != null) {
    sessionStorage.setItem(
      QUESTION_SESSION_KEYS.CURRENT_QUESTION_ID,
      String(currentQuestion.id)
    );
  } else {
    sessionStorage.removeItem(QUESTION_SESSION_KEYS.CURRENT_QUESTION_ID);
  }
};

export const loadQuestionSession = () => {
  try {
    const idsRaw = sessionStorage.getItem(QUESTION_SESSION_KEYS.QUESTION_IDS);

    if (!idsRaw) {
      return null;
    }

    const questionIds = JSON.parse(idsRaw);

    if (
      !Array.isArray(questionIds) ||
      questionIds.length === 0 ||
      questionIds.some((id) => typeof id !== "number")
    ) {
      clearQuestionSession();
      return null;
    }

    const indexRaw = sessionStorage.getItem(QUESTION_SESSION_KEYS.CURRENT_INDEX);
    const questionIdRaw = sessionStorage.getItem(
      QUESTION_SESSION_KEYS.CURRENT_QUESTION_ID
    );

    const currentIndex =
      indexRaw != null && Number.isFinite(Number(indexRaw))
        ? Number(indexRaw)
        : 0;
    const currentQuestionId =
      questionIdRaw != null && Number.isFinite(Number(questionIdRaw))
        ? Number(questionIdRaw)
        : null;

    return {
      questionIds,
      currentIndex,
      currentQuestionId,
    };
  } catch {
    clearQuestionSession();
    return null;
  }
};

export const restoreQuestionOrder = (mappedQuestions, session) => {
  if (!session || mappedQuestions.length === 0) {
    return null;
  }

  const { questionIds, currentIndex, currentQuestionId } = session;

  if (questionIds.length !== mappedQuestions.length) {
    return null;
  }

  const apiQuestionMap = new Map(
    mappedQuestions.map((question) => [question.id, question])
  );
  const apiQuestionIds = new Set(apiQuestionMap.keys());
  const sessionQuestionIds = new Set(questionIds);

  if (sessionQuestionIds.size !== apiQuestionIds.size) {
    return null;
  }

  for (const id of sessionQuestionIds) {
    if (!apiQuestionIds.has(id)) {
      return null;
    }
  }

  const orderedQuestions = questionIds.map((id) => apiQuestionMap.get(id));

  if (orderedQuestions.some((question) => !question)) {
    return null;
  }

  let restoredIndex = currentIndex;

  if (currentQuestionId != null) {
    const indexById = orderedQuestions.findIndex(
      (question) => question.id === currentQuestionId
    );

    if (indexById >= 0) {
      restoredIndex = indexById;
    }
  }

  if (restoredIndex < 0 || restoredIndex >= orderedQuestions.length) {
    restoredIndex = 0;
  }

  return {
    questions: orderedQuestions,
    currentIndex: restoredIndex,
  };
};
