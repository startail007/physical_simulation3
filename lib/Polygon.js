import { loopFor } from "../fun.js";
import { Vector } from "./Vector.js";
import { Line } from "./Line.js";
import { Float } from "./Float.js";

export class Polygon {
  static inPolygon(point, points) {
    function isLeft(x0, y0, x1, y1, x, y) {
      return (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0);
    }
    const x = point[0];
    const y = point[1];

    let wn = 0;

    for (let i = 0; i < points.length; i++) {
      const xi = points[i][0];
      const yi = points[i][1];

      const nextIndex = (i + 1) % points.length;
      const xj = points[nextIndex][0];
      const yj = points[nextIndex][1];
      const lt = [Math.min(xi, xj), Math.min(yi, yj)];
      const rb = [Math.max(xi, xj), Math.max(yi, yj)];
      //判斷是否在某個條線上
      if (x >= lt[0] && x <= rb[0] && y >= lt[1] && y <= rb[1]) {
        if (isLeft(xi, yi, xj, yj, x, y) == 0) {
          return false;
        }
      }
      if (yi <= y) {
        if (yj > y && isLeft(xi, yi, xj, yj, x, y) > 0) {
          wn++;
        }
      } else {
        if (yj <= y && isLeft(xi, yi, xj, yj, x, y) < 0) {
          wn--;
        }
      }
    }

    return wn !== 0;
  }
  static pointSegmentDistance(p, a, b) {
    const ab = Vector.sub(b, a);
    const ap = Vector.sub(p, a);

    const proj = Vector.dot(ap, ab);
    const abLenSq = Vector.dot(ab, ab);
    const d = proj / abLenSq;
    let cp = 0;
    if (d <= 0) {
      cp = a;
    } else if (d >= 1) {
      cp = b;
    } else {
      cp = Vector.add(a, Vector.scale(ab, d));
    }
    const v = Vector.sub(p, cp);
    const distSq = Vector.dot(v, v);
    return { distSq, cp };
  }
  static findPolygonsContactPoints(pointsA, pointsB) {
    let minDistSq = Number.POSITIVE_INFINITY;
    let contactList = [];

    pointsA.forEach((point) => {
      loopFor(pointsB, (p0, p1) => {
        const { distSq, cp } = Polygon.pointSegmentDistance(point, p0, p1);
        if (Float.nearlyEqual(distSq, minDistSq)) {
          if (!Vector.nearlyEqual(cp, contactList[0])) {
            minDistSq = distSq;
            contactList[1] = cp;
          }
        } else if (distSq < minDistSq) {
          minDistSq = distSq;
          contactList = [cp];
        }
      });
    });

    pointsB.forEach((point) => {
      loopFor(pointsA, (p0, p1) => {
        const { distSq, cp } = Polygon.pointSegmentDistance(point, p0, p1);
        if (Float.nearlyEqual(distSq, minDistSq)) {
          if (!Vector.nearlyEqual(cp, contactList[0])) {
            minDistSq = distSq;
            contactList[1] = cp;
          }
        } else if (distSq < minDistSq) {
          minDistSq = distSq;
          contactList = [cp];
        }
      });
    });
    return contactList;
  }
  static findCirclePolygonContactPoint(circleCenter, circleRadius, points) {
    let minDistSq = Number.POSITIVE_INFINITY;
    let contactList = [];
    loopFor(points, (p0, p1) => {
      const { distSq, cp } = Polygon.pointSegmentDistance(circleCenter, p0, p1);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        contactList[0] = cp;
      }
    });

    return contactList;
  }
  static findCirclesContactPoint(centerA, radiusA, centerB, radiusB) {
    const ab = Vector.sub(centerB, centerA);
    const dir = Vector.normalize(ab);
    let contactList = [];
    contactList[0] = Vector.add(centerA, Vector.scale(dir, radiusA));

    return contactList;
  }
  static intersectPolygons(pointsA, pointsB) {
    let normal = Vector.zero();
    let depth = Number.POSITIVE_INFINITY;
    const axesA = Polygon.getNormals(pointsA);
    const axesB = Polygon.getNormals(pointsB);
    const axes = [...axesA, ...axesB];
    let bool = false;
    for (const axis of axes) {
      const projection1 = Polygon.projectPoints(pointsA, axis);
      const projection2 = Polygon.projectPoints(pointsB, axis);

      if (projection1.min >= projection2.max || projection2.min >= projection1.max) {
        return;
      }
      const axisDepth = Math.min(projection2.max - projection1.min, projection1.max - projection2.min);
      if (axisDepth < depth) {
        depth = axisDepth;
        normal = axis;
        bool = projection1.max > projection2.max;
      }
    }
    if (bool) {
      normal = Vector.negate(normal);
    }

    return { normal, depth };
  }

  static intersectCirclePolygon(circleCenter, circleRadius, points) {
    let normal = Vector.zero();
    let depth = Number.POSITIVE_INFINITY;
    const axes = Polygon.getNormals(points);
    let bool = false;
    for (const axis of axes) {
      const projection1 = Polygon.projectPoints(points, axis);
      const projection2 = Polygon.projectCircle(circleCenter, circleRadius, axis);
      if (projection1.min >= projection2.max || projection2.min >= projection1.max) {
        return;
      }
      const axisDepth = Math.min(projection2.max - projection1.min, projection1.max - projection2.min);
      if (axisDepth < depth) {
        depth = axisDepth;
        normal = axis;
        bool = projection1.max > projection2.max;
      }
    }
    const cpIndex = Polygon.findClosestPointOnPolygon(circleCenter, points);
    const cp = points[cpIndex];

    const axis = Vector.normalize(Vector.sub(cp, circleCenter));
    const projection1 = Polygon.projectPoints(points, axis);
    const projection2 = Polygon.projectCircle(circleCenter, circleRadius, axis);
    if (projection1.min >= projection2.max || projection2.min >= projection1.max) {
      return;
    }
    const axisDepth = Math.min(projection2.max - projection1.min, projection1.max - projection2.min);

    if (axisDepth < depth) {
      depth = axisDepth;
      normal = axis;
      bool = projection1.max > projection2.max;
    }

    if (bool) {
      normal = Vector.negate(normal);
    }

    return { normal, depth };
  }
  static intersectCircles(centerA, radiusA, centerB, radiusB) {
    let normal = Vector.zero();
    let depth = 0;

    const distance = Vector.distance(centerA, centerB);
    const radii = radiusA + radiusB;

    if (distance >= radii) {
      return;
    }

    normal = Vector.normalize(Vector.sub(centerB, centerA));
    depth = radii - distance;

    return { normal, depth };
  }
  static findClosestPointOnPolygon(circleCenter, points) {
    let result = -1;
    let minDistance = Number.MAX_VALUE;

    for (let i = 0; i < points.length; i++) {
      const v = points[i];
      const distance = Vector.distance(v, circleCenter);

      if (distance < minDistance) {
        minDistance = distance;
        result = i;
      }
    }

    return result;
  }

  static projectPoints(points, axis) {
    let min = Infinity;
    let max = -Infinity;

    points.forEach((point) => {
      const projected = Vector.dot(point, axis);
      min = Math.min(min, projected);
      max = Math.max(max, projected);
    });

    return { min, max };
  }
  static projectCircle(center, radius, axis) {
    const direction = Vector.normalize(axis);
    const directionAndRadius = Vector.scale(direction, radius);

    const p1 = Vector.add(center, directionAndRadius);
    const p2 = Vector.sub(center, directionAndRadius);

    let min = Vector.dot(p1, axis);
    let max = Vector.dot(p2, axis);

    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }

    return { min, max };
  }
  static getNormals(points) {
    const normals = [];

    for (let i = 0; i < points.length; i++) {
      const edge = Vector.sub(points[(i + 1) % points.length], points[i]);
      // const edge = [
      //   points[(i + 1) % points.length][0] - points[i][0],
      //   points[(i + 1) % points.length][1] - points[i][1],
      // ];

      normals.push(Vector.normalize(Vector.normal(edge)));
    }

    return normals;
  }
  static collision_sat(pointsA, pointsB) {
    const axes = [...Polygon.getNormals(pointsA), ...Polygon.getNormals(pointsB)];

    for (const axis of axes) {
      const projection1 = Polygon.projectPoints(pointsA, axis);
      const projection2 = Polygon.projectPoints(pointsB, axis);
      if (projection1.min >= projection2.max || projection2.min >= projection1.max) {
        return false;
      }
    }

    return true;
  }
}
