import { API_BASE_URL } from "../constants/api";

const getAuthHeaders = (accessToken, withJson = false) => {
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (withJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const parseResponse = async (response) => {
  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.message || "API 요청에 실패했습니다.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getCommentsByQuestionId = async (questionId, accessToken) => {
  const response = await fetch(
    `${API_BASE_URL}/api/questions/${questionId}/comments`,
    {
      headers: getAuthHeaders(accessToken),
    }
  );

  const data = await parseResponse(response);
  return data.result;
};

export const postComment = async (questionId, content, accessToken) => {
  const response = await fetch(
    `${API_BASE_URL}/api/questions/${questionId}/comments`,
    {
      method: "POST",
      headers: getAuthHeaders(accessToken, true),
      body: JSON.stringify({ content }),
    }
  );

  const data = await parseResponse(response);
  return data.result;
};

export const deleteMyComment = async (questionId, accessToken) => {
  const response = await fetch(
    `${API_BASE_URL}/api/questions/${questionId}/comments/me`,
    {
      method: "DELETE",
      headers: getAuthHeaders(accessToken),
    }
  );

  return parseResponse(response);
};
