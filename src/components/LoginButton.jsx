import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

function LoginButton() {
  const [user, setUser] = useState(null);

  const login = useGoogleLogin({
    flow: 'implicit', // 중요 (access_token 방식)
    onSuccess: async (tokenResponse) => {
      // access_token으로 사용자 정보 가져오기
      const res = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );

      const userInfo = await res.json();
      console.log(userInfo);

      setUser(userInfo);
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  return (
    <button
      onClick={() => login()}
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