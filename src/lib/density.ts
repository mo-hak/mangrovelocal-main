export function floatToFixed96x32(floatValue: number) {
  // Define the scale factor for the 32-bit fractional part
  const scaleFactor = Math.pow(2, 32);

  // Multiply the float by the scale factor to convert to fixed point
  const fixedPointValue = Math.round(floatValue * scaleFactor);

  // Convert the fixed-point value to a 128-bit BigInt for the 96.32 format
  const fixedPointBigInt = BigInt(fixedPointValue);

  // Ensure the result fits in the 96.32 format (i.e., 128 bits)
  // The max value for 96.32 is 2^127 - 1 (positive range for 128-bit integer)
  const maxFixedPointValue = (BigInt(1) << BigInt(127)) - BigInt(1);
  const minFixedPointValue = -maxFixedPointValue;

  if (
    fixedPointBigInt > maxFixedPointValue ||
    fixedPointBigInt < minFixedPointValue
  ) {
    throw new RangeError(
      "The converted fixed-point value is out of range for 96.32 format."
    );
  }

  return fixedPointBigInt;
}
