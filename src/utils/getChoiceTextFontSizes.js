// src/utils/getChoiceTextFontSizes.js

export const getChoiceTextFontSizes = (
  aText,
  bText,
  baseSize = 6.5,
  baseTotalLength = 8
) => {
  const aLength = aText.length;
  const bLength = bText.length;
  const totalLength = aLength + bLength;

  let aSize = baseSize;
  let bSize = baseSize;

  if (totalLength > baseTotalLength) {
    const overLength = totalLength - baseTotalLength;

    if (aLength > bLength) {
      aSize = baseSize * ((aLength - overLength) / aLength);
    } else if (bLength > aLength) {
      bSize = baseSize * ((bLength - overLength) / bLength);
    } else {
      aSize = baseSize * ((aLength - overLength / 2) / aLength);
      bSize = baseSize * ((bLength - overLength / 2) / bLength);
    }
  }

  return {
    aChoiceFontSize: `${aSize.toFixed(2)}cqw`,
    bChoiceFontSize: `${bSize.toFixed(2)}cqw`,
  };
};