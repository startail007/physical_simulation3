export class Float {
  static verySmallAmount = 0.0005;
  static mix(val0, val1, rate) {
    return val0 * (1 - rate) + val1 * rate;
  }
  static nearlyEqual(a, b) {
    return Math.abs(a - b) < Float.verySmallAmount;
  }
}
