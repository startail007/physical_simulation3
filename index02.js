import { Polygon } from "./lib/Polygon.js";
import { Vector, VectorE } from "./lib/Vector.js";

const drawShape = (ctx, points, color, lineDash = [], fillColor = null) => {
  if (!points || points.length === 0) return;
  ctx.setLineDash(lineDash);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(...points[i]);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
};

const points01 = [
  [-30, -30],
  [30, -30],
  [30, 30],
  [-30, 30],
].map((point) => Vector.add(Vector.rotate(point, Math.PI / 4), [320, 80]));
const points02 = [
  [-50, -50],
  [50, -50],
  [50, 50],
  [-50, 50],
].map((point) => Vector.add(Vector.rotate(point, 0 ), [350, 150]));

// Sutherland-Hodgman 多邊形裁剪演算法
const clipPolygons = (subjectPoly, clipPoly) => {
  const isInside = (p, a, b) => {
    // 判斷點是否在邊的右側 (假設頂點為順時針排序)
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
  };

  const getIntersection = (a, b, c, d) => {
    const x1 = a[0],
      y1 = a[1],
      x2 = b[0],
      y2 = b[1];
    const x3 = c[0],
      y3 = c[1],
      x4 = d[0],
      y4 = d[1];
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  };

  let outputList = subjectPoly;
  let cp1 = clipPoly[clipPoly.length - 1];

  for (const cp2 of clipPoly) {
    const inputList = outputList;
    outputList = [];
    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];
    for (const e of inputList) {
      if (isInside(e, cp1, cp2)) {
        if (!isInside(s, cp1, cp2)) {
          outputList.push(getIntersection(s, e, cp1, cp2));
        }
        outputList.push(e);
      } else if (isInside(s, cp1, cp2)) {
        outputList.push(getIntersection(s, e, cp1, cp2));
      }
      s = e;
    }
    cp1 = cp2;
  }
  return outputList;
};

const canvas = document.getElementById("cvs");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#c0c0c0";
ctx.fillRect(0, 0, canvas.width, canvas.height);

drawShape(ctx, points01, "#ff0000");
drawShape(ctx, points02, "#00ff00");

// 計算重疊部分
const intersectionPoints = clipPolygons(points01, points02);

// 繪製重疊部分 (藍色半透明)
drawShape(ctx, intersectionPoints, "#0000ff", [], "rgba(0, 0, 255, 0.5)");

// 4. 計算重心並繪製連線
if (intersectionPoints.length > 0) {
  const center01 = Vector.average(points01);
  const center02 = Vector.average(points02);
  const centerIntersect = Vector.average(intersectionPoints);

  // 繪製從交集中心到兩個多邊形中心的連線 (黑色虛線)
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(...centerIntersect);
  ctx.lineTo(...center01);
  ctx.moveTo(...centerIntersect);
  ctx.lineTo(...center02);
  ctx.stroke();
  ctx.setLineDash([]); // 還原實線設定

  // 在三個中心點畫上小圓點
  [center01, center02, centerIntersect].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
  });
}

// 5. 算出 A 到 C 與 B 到 C 之間的分隔線 (垂直於 AB 連心線並通過 C)
if (intersectionPoints.length > 0) {
  const center01 = Vector.average(points01);
  const center02 = Vector.average(points02);
  const centerIntersect = Vector.average(intersectionPoints);

  // 計算 A 到 B 的方向向量，並取其法向量作為分隔線方向
  const abVec = Vector.sub(center02, center01);
  const sepDir = Vector.normalize(Vector.normal(abVec));

  // 設定線段長度並繪製分隔線 (藍色粗線)
  const lineLen = 100;
  const p1 = Vector.add(centerIntersect, Vector.scale(sepDir, lineLen));
  const p2 = Vector.sub(centerIntersect, Vector.scale(sepDir, lineLen));

  ctx.setLineDash([]); // 實線
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(...p1);
  ctx.lineTo(...p2);
  ctx.stroke();
  ctx.lineWidth = 1; // 還原寬度
}

// 6. 標記超過分隔線的點
if (intersectionPoints.length > 0) {
  const center01 = Vector.average(points01);
  const center02 = Vector.average(points02);
  const centerIntersect = Vector.average(intersectionPoints);
  const abVec = Vector.sub(center02, center01); // 這是碰撞的主軸 (法線方向)
  const n = Vector.normalize(abVec);

  const markOverPoints = (points, sign) => {
    points.forEach((p, i) => {
      const v = Vector.sub(p, centerIntersect);
      // 計算點在法線方向上的投影長度 (穿透深度)
      const dist = Vector.dot(v, n);

      // 使用點積判斷點是否在分隔線的另一側
      if (dist * sign > 0) {
        // 1. 計算退回到線上的位置
        // P_projected = P - (dist * n)
        const projectedPoint = Vector.sub(p, Vector.scale(n, dist));

        // 2. 繪製原始點到退回點的連線 (代表位移量)
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(...p);
        ctx.lineTo(...projectedPoint);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. 標記退回後的點 (紫色小圓)
        ctx.beginPath();
        ctx.arc(projectedPoint[0], projectedPoint[1], 4, 0, Math.PI * 2);
        ctx.fillStyle = "magenta";
        ctx.fill();

        // 4. 標記原本越界的點 (黃色圈)
        ctx.beginPath();
        ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.stroke();

        // 在控制台打印相對位置資訊 (可選)
        // console.log(`Point ${i} depth: ${dist.toFixed(2)}`);
      }
    });
  };

  markOverPoints(points01, 1);  // 多邊形 A：往 B 方向 (正向) 超過
  markOverPoints(points02, -1); // 多邊形 B：往 A 方向 (負向) 超過

  // 8. 繪製變形後的多邊形輪廓 (將所有點退回到分隔線後的結果)
  const getDeformedPoints = (points, sign) => {
    return points.map((p) => {
      const v = Vector.sub(p, centerIntersect);
      const dist = Vector.dot(v, n);
      // 如果點超過了線，返回投影點；否則返回原點
      if (dist * sign > 0) {
        return Vector.sub(p, Vector.scale(n, dist));
      }
      return [p[0], p[1]]; // 返回副本
    });
  };

  // 使用虛線繪製變形後的形狀
  drawShape(ctx, getDeformedPoints(points01, 1), "#ff0000", [6, 4]);
  drawShape(ctx, getDeformedPoints(points02, -1), "#00ff00", [6, 4]);
}

// 7. 標記越界點的鄰近點 (隔壁點)
/*if (intersectionPoints.length > 0) {
  const center01 = Vector.average(points01);
  const center02 = Vector.average(points02);
  const centerIntersect = Vector.average(intersectionPoints);
  const abVec = Vector.sub(center02, center01);

  const markNeighbors = (points, sign, color) => {
    // 先找出所有越界點的索引
    const overIndices = points
      .map((p, i) => (Vector.dot(Vector.sub(p, centerIntersect), abVec) * sign > 0 ? i : -1))
      .filter((idx) => idx !== -1);

    const neighborSet = new Set();
    overIndices.forEach((idx) => {
      const prev = (idx - 1 + points.length) % points.length;
      const next = (idx + 1) % points.length;
      // 如果隔壁點本身不在越界清單中，就將其加入標記清單
      if (!overIndices.includes(prev)) neighborSet.add(prev);
      if (!overIndices.includes(next)) neighborSet.add(next);
    });

    neighborSet.forEach((idx) => {
      const p = points[idx];
      ctx.beginPath();
      ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  markNeighbors(points01, 1, "cyan");
  markNeighbors(points02, -1, "cyan");
}*/
