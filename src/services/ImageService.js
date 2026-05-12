const DEFAULT_IMAGE = "/default.png";

// Firebase 아직 없으니까 mock
const fetchFromFirebase = async (path) => {
  // 나중에 Firebase 붙일 자리
  return null; // 일부러 실패
};

// public 폴더 확인
const checkPublicImage = async (path) => {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Not found");
    return path;
  } catch {
    return null;
  }
};

export const getImage = async (path) => {
  // 1️⃣ Firebase 시도
  const firebaseUrl = await fetchFromFirebase(path);
  if (firebaseUrl) return firebaseUrl;

  // 2️⃣ public 폴더 확인
  const publicUrl = await checkPublicImage(path);
  if (publicUrl) return publicUrl;

  // 3️⃣ default
  return DEFAULT_IMAGE;
};

// Not Used Now.