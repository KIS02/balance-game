// src/utils/getResultTextFontSizes.js

export const getResultTextFontSizes = (
  aText,
  bText,
  baseSize = 9.25,
  baseTotalLength = 8
) => {
  const aLength = aText.length;
  const bLength = bText.length;
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