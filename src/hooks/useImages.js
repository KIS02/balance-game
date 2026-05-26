import { useEffect, useState } from "react";
import { getImage } from "../services/imageService";

// hooks/useImage.js
export const useImage = (path) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const load = async () => {
      const result = await getImage(`/images/${path}.png`);
      setImage(result);
    };
    load();
  }, [path]);

  return image;
};

// Not Used Now.