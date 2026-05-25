export const rotationArray = (ary, n) => {
  if (n === 0) return ary;
  return [...ary.slice(-n), ...ary.slice(0, (n >= 0 ? ary.length : 0) - n)];
};
export const loopForMap = (points, fun) => {
  const list = [];
  for (let i = 0; i < points.length; i++) {
    const i0 = i;
    const i1 = (i + 1) % points.length;
    const p0 = points[i0];
    const p1 = points[i1];
    list.push(fun(p0, p1, i0, i1));
  }
  return list;
};

export const loopFor = (points, fun) => {
  for (let i = 0; i < points.length; i++) {
    const i0 = i;
    const i1 = (i + 1) % points.length;
    const p0 = points[i0];
    const p1 = points[i1];
    fun(p0, p1, i0, i1);
  }
};
