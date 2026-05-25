import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { API_BASE_URL } from '../constants/api';

function LoginButton({ user, onLogin }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useGoogleLogin({
    flow: 'implicit', // 중요 (access_token 방식)
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoggingIn(true);

        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Login Failed');
        }

        onLogin({
          user: data.result,
          accessToken: tokenResponse.access_token,
        });
      } catch (error) {
        console.log(error.message || 'Login Failed');
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  return (
    <button
      onClick={() => login()}
      disabled={isLoggingIn}
      title={user?.name || 'Google 로그인'}
      style={{
        position: 'fixed',
        zIndex: 9999,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        padding: 0,
        background: 'white',
        width: '5.25vw',
        aspectRatio: '1 / 1',
        maxWidth:'50px',
        minWidth:'30px'
      }}
    >
      <img
        src={
          user?.picture ||
          "/public/images/img_user_default.png"
        }
        alt="profile"
        style={{ width: '100%', height: '100%' }}
      />
    </button>
  );
}

export default LoginButton;