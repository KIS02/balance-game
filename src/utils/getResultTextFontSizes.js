// src/utils/getResultTextFontSizes.js
const HALF_WIDTH_CHARS = [" ", ".", ",", "'", '"', "’", "‘", "“", "”", ":", ";", "!", "?", "|", "i", "l"];

const getTextLength = (text) => {
  return Array.from(text).reduce((sum, char) => {
    return sum + (HALF_WIDTH_CHARS.includes(char) ? 0.33 : 1);
  }, 0);
};

export const getResultTextFontSizes = (
  aText,
  bText,
  baseSize = 9.25,
  baseTotalLength = 9
) => {
  const aLength = getTextLength(aText);
  const bLength = getTextLength(bText);
  const totalLength = aLength + bLength;

  let aSize = baseSize;
  let bSize = baseSize;

  if (totalLength <= baseTotalLength) {
    return {
      aFontSize: `${aSize}cqw`,
      bFontSize: `${bSize}cqw`,
    };
  }

  const overLength = totalLength - baseTotalLength;

  if (aLength > bLength) {
    aSize = (baseSize * (aLength - overLength)) / aLength;
  } else if (bLength > aLength) {
    bSize = (baseSize * (bLength - overLength)) / bLength;
  } else {
    aSize = (baseSize * (aLength - overLength / 2)) / aLength;
    bSize = (baseSize * (bLength - overLength / 2)) / bLength;
  }

  return {
    aFontSize: `${aSize.toFixed(2)}cqw`,
    bFontSize: `${bSize.toFixed(2)}cqw`,
  };
};