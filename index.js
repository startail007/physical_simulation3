import { Polygon } from "./lib/Polygon.js";
import { Vector, VectorE } from "./lib/Vector.js";
const canvas = document.getElementById("cvs");
const ctx = canvas.getContext("2d");

const gravity = [0, 0.5];
const damping = 0.96;

const applyPointTargetSpring = (p, t, k) => {
  VectorE.add(p, Vector.scale(Vector.sub(t, p), k));
};

/*const spring = (a, b, restLength, k) => {
    const d = Vector.sub(b, a);

    const dist = Vector.length(d);
    if (dist === 0) return;

    const n = Vector.scale(d, 1 / dist);

    const stretch = dist - restLength;

    const force = -k * stretch;

    const f = Vector.scale(n, force);

    a.fx += fx;
    a.fy += fy;

    b.fx -= fx;
    b.fy -= fy;
  };*/

const getCentroid = (items) => {
  const sum = items.reduce(
    (acc, p) => {
      VectorE.add(acc, p);
      return acc;
    },
    [0, 0],
  );
  return Vector.scale(sum, 1 / items.length);
};

const rotatePoints = (items, angle, center = [0, 0]) => {
  return items.map((p) => Vector.add(center, Vector.rotate(Vector.sub(p, center), angle)));
};

const angleBetween = (v1, v2) => {
  const dot = Vector.dot(v1, v2);
  const det = Vector.det(v1, v2);
  return Math.atan2(det, dot);
};

const getPointAngleDegrees = (center, originalPoints, dynamicPoints) => {
  return originalPoints.map((orig, i) => {
    const vOrig = Vector.sub(orig, center);
    const vDyn = Vector.sub(dynamicPoints[i], center);
    return angleBetween(vOrig, vDyn);
  });
};

const averageDegreesCircular = (degArray) => {
  let sinSum = 0;
  let cosSum = 0;
  degArray.forEach((rad) => {
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  });
  return Math.atan2(sinSum, cosSum);
};

class SoftPoint {
  constructor(pos) {
    this.pos = pos;
    this.force = Vector.zero();
    this.linearVel = Vector.zero();
  }
  update() {
    VectorE.add(this.linearVel, this.force);
    VectorE.add(this.pos, this.linearVel);
    VectorE.scale(this.linearVel, damping);
    this.force = Vector.zero();
  }
  addForce(amount) {
    VectorE.add(this.force, amount);
  }
}

class SoftPolygon {
  locked = -1;
  constructor(points) {
    this.softPoints = points.map((el) => new SoftPoint(el));
    const center = this.center;
    this.oPoints = points.map((el) => Vector.sub(el, center));
  }
  get center() {
    return getCentroid(this.softPoints.map((el) => el.pos));
  }
  update() {
    const center = this.center;
    let transformedOriginal = this.oPoints.map((p) => Vector.add(p, center));
    const angleDegrees = getPointAngleDegrees(
      this.center,
      transformedOriginal,
      this.softPoints.map((el) => el.pos),
    );
    const angleAvg = averageDegreesCircular(angleDegrees);
    transformedOriginal = rotatePoints(transformedOriginal, angleAvg, this.center);
    this.debugPoints(transformedOriginal);
    this.softPoints.forEach((p, i) => {
      const pos = Vector.add(p.pos, Vector.scale(Vector.sub(transformedOriginal[i], p.pos), 0.06));
      p.addForce(Vector.sub(pos, p.pos));
      VectorE.set(p.pos, pos);
    });
    this.softPoints.forEach((p, i) => {
      p.update();
      if (p.pos[1] < 0) {
        p.pos[1] = 0;
        p.linearVel[1] *= -0.85;
      }
      if (p.pos[1] > canvas.height) {
        p.pos[1] = canvas.height;
        p.linearVel[1] *= -0.85;
      }
      if (p.pos[0] < 0) {
        p.pos[0] = 0;
        p.linearVel[0] *= -0.85;
      }
      if (p.pos[0] > canvas.width) {
        p.pos[0] = canvas.width;
        p.linearVel[0] *= -0.85;
      }
    });
  }
  debugPoints(points) {
    ctx.strokeStyle = "rgb(255,0,0)";
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(...points[i]);
    }
    ctx.closePath();
    ctx.stroke();
  }
  drawShape() {
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.beginPath();
    ctx.moveTo(...this.softPoints[0].pos);
    for (let i = 1; i < this.softPoints.length; i++) {
      ctx.lineTo(...this.softPoints[i].pos);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(0,150,255,0.3)";
    ctx.fill();
    ctx.stroke();
    this.softPoints.forEach((el, i) => {
      ctx.beginPath();
      ctx.arc(...el.pos, 8, 0, Math.PI * 2);
      ctx.fillStyle = this.locked === i ? "orange" : "red";
      ctx.fill();
    });
  }
  findLock(m) {
    for (let i = 0; i < this.softPoints.length; i++) {
      const p = this.softPoints[i].pos;
      const d = Vector.length(Vector.sub(m, p));
      if (d < 8) {
        return i;
      }
    }
    return -1;
  }
  addForce(amount) {
    this.softPoints.forEach((p, i) => {
      p.addForce(amount);
    });
  }
  addLockedForce(v) {
    if (this.locked === -1) return;
    this.softPoints.forEach((softPoint) => {
      const len = Vector.length(Vector.sub(softPoint.pos, this.softPoints[this.locked].pos));
      const rate = (100 - Math.min(len, 100)) / 100;
      softPoint.addForce(Vector.scale(v, 0.5 + 0.5 * rate * rate));
    });
  }
}

const polygons = [
  new SoftPolygon([
    [300, 100],
    [400, 100],
    [400, 200],
    [300, 200],
  ]),
  // new SoftPolygon([
  //   [300, 100],
  //   [400, 100],
  //   [400, 200],
  // ]),
  // new SoftPolygon([
  //   [400, 100],
  //   [500, 100],
  //   [500, 200],
  //   [400, 200],
  // ]),
  new SoftPolygon([
    [500, 100],
    [600, 100],
    [600, 200],
    [500, 200],
  ]),
];

let dragging = null;
const mouse = [0, 0];
const oldMouse = [0, 0];

const mousemove = (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  VectorE.set(mouse, [e.clientX - rect.left, e.clientY - rect.top]);
};
const mouseup = () => {
  if (!dragging) return;
  const v = Vector.sub(mouse, oldMouse);
  dragging.addLockedForce(v);
  dragging.locked = -1;
  dragging = null;
  window.removeEventListener("mousemove", mousemove);
  window.removeEventListener("mouseup", mouseup);
};
const mousedown = (e) => {
  const rect = canvas.getBoundingClientRect();
  const m = [e.clientX - rect.left, e.clientY - rect.top];
  VectorE.set(mouse, m);
  VectorE.set(oldMouse, m);

  for (const polygon of polygons) {
    const i = polygon.findLock(m);
    if (i !== -1) {
      dragging = polygon;
      dragging.locked = i;
      break;
    }
  }
  window.addEventListener("mousemove", mousemove);
  window.addEventListener("mouseup", mouseup);
};
canvas.addEventListener("mousedown", mousedown);

/**
 * 处理两个多边形之间的碰撞推挤
 */
const resolvePolygons = (polyA, polyB) => {
  const hit = Polygon.intersectPolygons(
    polyA.softPoints.map((el) => el.pos),
    polyB.softPoints.map((el) => el.pos),
  );
  if (!hit) return;

  const { normal, depth } = hit;
  const separation = Vector.scale(normal, depth * 0.5);

  // 位置分離：A 往反方向移動，B 往正方向移動
  polyA.softPoints.forEach((p) => VectorE.sub(p.pos, separation));
  polyB.softPoints.forEach((p) => VectorE.add(p.pos, separation));

  // 速度阻尼：沿法線方向減少接近速度
  polyA.softPoints.forEach((p) => {
    const relVel = Vector.dot(p.linearVel, normal);
    if (relVel > 0) {
      VectorE.sub(p.linearVel, Vector.scale(normal, relVel * 0.5));
    }
  });
  polyB.softPoints.forEach((p) => {
    const relVel = Vector.dot(p.linearVel, normal);
    if (relVel < 0) {
      VectorE.sub(p.linearVel, Vector.scale(normal, relVel * 0.5));
    }
  });
};

function animate(dt) {
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const polygon of polygons) {
    polygon.addForce(gravity);
    polygon.update();
  }

  // 检测并解决所有多边形对之间的碰撞
  for (let i = 0; i < polygons.length; i++) {
    for (let j = i + 1; j < polygons.length; j++) {
      resolvePolygons(polygons[i], polygons[j]);
    }
  }

  for (const polygon of polygons) {
    polygon.drawShape();
  }

  if (dragging) {
    const softPoint = dragging.softPoints[dragging.locked];
    if (Vector.length(Vector.sub(mouse, softPoint.pos)) > 0) {
      VectorE.set(softPoint.pos, mouse);
      VectorE.set(softPoint.linearVel, Vector.zero());
      VectorE.set(softPoint.force, Vector.zero());
      VectorE.add(oldMouse, Vector.scale(Vector.sub(mouse, oldMouse), 0.1));
    }
  }
  requestAnimationFrame(animate);
}

animate();
