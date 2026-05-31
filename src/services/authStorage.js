export const AUTH_STORAGE_KEYS = {
  USER: "balanceGameUser",
  ACCESS_TOKEN: "balanceGameAccessToken",
};

export const AUTH_EXPIRED_MESSAGE =
  "로그인이 만료되었습니다. 다시 로그인해주세요.";

export const saveAuthSession = (user, accessToken) => {
  if (!user || !accessToken) return;

  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
};

export const loadAuthSession = () => {
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  const userRaw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

  if (!accessToken || !userRaw) {
    clearAuthSession();
    return null;
  }

  try {
    const user = JSON.parse(userRaw);

    if (!user || typeof user !== "object") {
      clearAuthSession();
      return null;
    }

    return { user, accessToken };
  } catch {
    clearAuthSession();
    return null;
  }
};
