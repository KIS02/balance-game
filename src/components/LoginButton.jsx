import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import "../assets/LoginButton.css";

function LoginButton({ user, onLogin, onLogout }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoggingIn(true);

        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Login Failed");
        }

        onLogin({
          user: data.result,
          accessToken: tokenResponse.access_token,
        });
      } catch (error) {
        console.log(error.message || "Login Failed");
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = () => {
    closeLogoutConfirm();
    onLogout?.();
  };

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLogoutConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogoutConfirm]);

  return (
    <>
      <button
        onClick={() => {
          if (user) {
            setShowLogoutConfirm(true);
            return;
          }

          login();
        }}
        disabled={isLoggingIn}
        title={user?.name || "Google 로그인"}
        style={{
          position: "fixed",
          zIndex: 9999,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          overflow: "hidden",
          padding: 0,
          background: "white",
          width: "5.25vw",
          aspectRatio: "1 / 1",
          maxWidth: "50px",
          minWidth: "30px",
        }}
      >
        <img
          src={user?.picture || "/public/images/img_user_default.png"}
          alt="profile"
          style={{ width: "100%", height: "100%" }}
        />
      </button>

      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={closeLogoutConfirm}
        >
          <div
            className="logout-confirm-box"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
          >
            <p id="logout-confirm-title" className="logout-confirm-message">
              로그아웃하시겠습니까?
            </p>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-button logout-confirm-cancel"
                onClick={closeLogoutConfirm}
              >
                취소
              </button>
              <button
                type="button"
                className="logout-confirm-button logout-confirm-submit"
                onClick={handleConfirmLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginButton;
