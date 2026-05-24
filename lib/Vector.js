import { Float } from "./Float.js";

export class Vector {
  static zero() {
    return [0, 0];
  }
  static clone(vector) {
    return [...vector];
  }
  static rotate(vector, angle) {
    let cos0 = Math.cos(angle);
    let sin0 = Math.sin(angle);
    return [vector[0] * cos0 - vector[1] * sin0, vector[0] * sin0 + vector[1] * cos0];
  }
  static rotateFrom(vector, angle, center) {
    return Vector.add(Vector.rotate(Vector.sub(vector, center), angle), center);
  }
  static dot(vector0, vector1) {
    return vector0[0] * vector1[0] + vector0[1] * vector1[1];
  }
  static det(vector0, vector1) {
    return vector0[0] * vector1[1] - vector0[1] * vector1[0];
  }
  static cross(vector0, vector1) {
    return vector0[0] * vector1[1] - vector0[1] * vector1[0];
  }
  static add(vector0, vector1) {
    return [vector0[0] + vector1[0], vector0[1] + vector1[1]];
  }
  static sub(vector0, vector1) {
    return [vector0[0] - vector1[0], vector0[1] - vector1[1]];
  }
  static mul(vector0, vector1) {
    return [vector0[0] * vector1[0], vector0[1] * vector1[1]];
  }
  static div(vector0, vector1) {
    return [vector0[0] / vector1[0], vector0[1] / vector1[1]];
  }
  static distance(vector0, vector1) {
    return Vector.length(Vector.sub(vector0, vector1));
  }
  static projection(vector0, vector1) {
    var rate = Vector.dot(vector0, vector1) / Vector.dot(vector1, vector1);
    return [vector1[0] * rate, vector1[1] * rate];
  }
  static length(vector) {
    return Math.sqrt(Vector.dot(vector, vector));
  }
  static scale(vector, scale) {
    return [vector[0] * scale, vector[1] * scale];
  }
  static collisionCalc(vector1, vector2, mass1, mass2) {
    return Vector.scale(
      Vector.add(Vector.scale(vector1, mass1 - mass2), Vector.scale(vector2, 2 * mass2)),
      1 / (mass1 + mass2),
    );
  }
  static normalize(vector) {
    const len = Vector.length(vector);
    if (len) return Vector.scale(vector, 1 / len);
    return Vector.clone(vector);
  }
  static normal(vector) {
    return [-vector[1], vector[0]];
  }
  static negate(vector) {
    return [-vector[0], -vector[1]];
  }

  static mix(vector0, vector1, rate) {
    return Vector.add(Vector.scale(vector0, 1 - rate), Vector.scale(vector1, rate));
  }
  static rebound(vel, wall) {
    const projection = Vector.projection(vel, wall);
    const force = Vector.sub(vel, projection);

    return Vector.add(Vector.negate(force), projection);
  }
  static average(vectors) {
    if (vectors.length == 1) return Vector.clone(vectors[0]);
    const sum = [0, 0];
    if (vectors.length) {
      vectors.forEach((pos) => {
        VectorE.add(sum, pos);
      });
      VectorE.scale(sum, 1 / vectors.length);
    }
    return sum;
  }
  static nearlyEqual(vector0, vector1) {
    const v = Vector.sub(vector0, vector1);
    return Vector.dot(v, v) < Float.verySmallAmount * Float.verySmallAmount;
  }
}
export class VectorE {
  static set(vector0, vector1) {
    vector0[0] = vector1[0];
    vector0[1] = vector1[1];
    return vector0;
  }
  static add(vector0, vector1) {
    vector0[0] += vector1[0];
    vector0[1] += vector1[1];
    return vector0;
  }
  static sub(vector0, vector1) {
    vector0[0] -= vector1[0];
    vector0[1] -= vector1[1];
    return vector0;
  }
  static scale(vector, scale) {
    vector[0] *= scale;
    vector[1] *= scale;
    return vector;
  }
}
