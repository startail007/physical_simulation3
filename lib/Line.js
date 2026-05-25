import { Vector } from "./Vector.js";

export class Line {
  static findIntersection(p0, p1, p2, p3) {
    const v1 = Vector.sub(p1, p0);
    const v2 = Vector.sub(p3, p2);

    const det = Vector.cross(v1, v2);
    // console.log(det);
    if (det === 0) {
      return null;
    } else {
      const v3 = Vector.sub(p2, p0);
      const t = Vector.cross(v3, v2) / det;
      const t0 = Vector.cross(v3, v1) / det;
      if (t >= 0 && t <= 1 && t0 >= 0 && t0 <= 1) {
        const intersection = Vector.add(p0, Vector.scale(v1, t));
        // const intersection0 = Vector.add(p2, Vector.scale(v2, t0));
        // console.log(intersection, intersection0);
        return intersection;
      } else {
        return null;
      }
    }
  }

  static doLineSegmentsIntersect(p0, p1, p2, p3) {
    function orientation(p, q, r) {
      var val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
      if (val === 0) return 0; // 共線
      return val > 0 ? 1 : 2; // 順時針或逆時針
    }

    function onSegment(p, q, r) {
      return (
        q[0] <= Math.max(p[0], r[0]) &&
        q[0] >= Math.min(p[0], r[0]) &&
        q[1] <= Math.max(p[1], r[1]) &&
        q[1] >= Math.min(p[1], r[1])
      );
    }

    var o1 = orientation(p0, p1, p2);
    var o2 = orientation(p0, p1, p3);
    var o3 = orientation(p2, p3, p0);
    var o4 = orientation(p2, p3, p1);
    if (o1 !== o2 && o3 !== o4) {
      return true;
    }
    if (o1 === 0 && onSegment(p0, p2, p1)) return true;
    if (o2 === 0 && onSegment(p0, p3, p1)) return true;
    if (o3 === 0 && onSegment(p2, p0, p3)) return true;
    if (o4 === 0 && onSegment(p2, p1, p3)) return true;

    return false;
  }
  static getLineABC(point0, point1) {
    const v = Vector.sub(point1, point0);
    const a = v[1];
    const b = -v[0];
    const c = -point0[0] * v[1] + v[0] * point0[1];
    return { a, b, c };
  }
  static getLine(point0, point1) {
    return { pos: point0, dir: Vector.sub(point1, point0) };
  }
  static toLineDistance(point, point0, point1, pn = false) {
    // const v = Vector.sub(point1, point0);
    // const a = v[1];
    // const b = -v[0];
    // const c = -point0[0] * v[1] + v[0] * point0[1];
    // const ans = (point[0] * a + point[1] * b + c) / Vector.length(v);
    // return pn ? ans : Math.abs(ans);
    const v = Vector.sub(point1, point0);
    const v0 = Vector.sub(point, point0);
    const dist = Vector.cross(v0, v) / Vector.length(v);
    return pn ? dist : Math.abs(dist);
  }
  static shortestDistancePointToLine(point, point0, point1) {
    const { a, b, c } = Line.getLineABC(point0, point1);
    const x = (b * (b * point[0] - a * point[1]) - a * c) / (a ** 2 + b ** 2);
    const y = (a * (-b * point[0] + a * point[1]) - b * c) / (a ** 2 + b ** 2);
    return [x, y];
  }
}
