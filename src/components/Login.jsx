import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const success = (credentialResponse) => {
    console.log("로그인 성공", credentialResponse);
  };

  const error = () => {
    console.log("로그인 실패");
  };

  return (
    <div>
      <GoogleLogin
        onSuccess={success}
        onError={error}
      />
    </div>
  );
}

export default Login;