
"use strict";

const P = 17;
const G = { x: 1, y: 5 };
const ORDER = 9;

const $ = id => document.getElementById(id);

function mod(n) {
  return ((n % P) + P) % P;
}

function inverse(n) {
  n = mod(n);

  for (let i = 1; i < P; i++) {
    if (mod(n * i) === 1) return i;
  }

  throw new Error("Modular inverse does not exist");
}

function pointAdd(a, b) {
  if (a === null) return b;
  if (b === null) return a;

  if (a.x === b.x && mod(a.y + b.y) === 0) {
    return null;
  }

  let slope;

  if (a.x === b.x && a.y === b.y) {
    slope = mod(
      3 * a.x * a.x * inverse(2 * a.y)
    );
  } else {
    slope = mod(
      (b.y - a.y) * inverse(b.x - a.x)
    );
  }

  const x = mod(slope * slope - a.x - b.x);
  const y = mod(slope * (a.x - x) - a.y);

  return { x, y };
}

function multiply(k) {
  let result = null;

  for (let i = 0; i < k; i++) {
    result = pointAdd(result, G);
  }

  return result;
}

function pointText(point) {
  return point === null
    ? "O"
    : `(${point.x}, ${point.y})`;
}

function getCurvePoints() {
  const result = [];

  for (let x = 0; x < P; x++) {
    for (let y = 0; y < P; y++) {
      if (mod(y * y) === mod(x ** 3 + 7)) {
        result.push({ x, y });
      }
    }
  }

  return result;
}

const curvePoints = getCurvePoints();

const multiples = Array.from(
  { length: ORDER - 1 },
  (_, index) => ({
    k: index + 1,
    point: multiply(index + 1)
  })
);

const xs = multiples.map(item => item.point.x);
const ys = multiples.map(item => item.point.y);

// Coordinate plots
function coordinateGraph(k, showAll) {
  const width = 650;
  const height = 550;
  const left = 55;
  const top = 30;
  const right = 30;
  const bottom = 55;

  const pw = width - left - right;
  const ph = height - top - bottom;

  const sx = x => left + x / 16 * pw;
  const sy = y => top + ph - y / 16 * ph;

  let svg = `
    <svg viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         aria-label="Elliptic curve coordinate graph">
  `;

  for (let n = 0; n <= 16; n += 2) {
    svg += `
      <line x1="${sx(n)}" y1="${top}"
        x2="${sx(n)}" y2="${top + ph}"
        stroke="#26334b"/>
      <line x1="${left}" y1="${sy(n)}"
        x2="${left + pw}" y2="${sy(n)}"
        stroke="#26334b"/>
      <text x="${sx(n)}" y="${height - 25}"
        fill="#9baac2" font-size="11"
        text-anchor="middle">${n}</text>
      <text x="${left - 12}" y="${sy(n) + 4}"
        fill="#9baac2" font-size="11"
        text-anchor="end">${n}</text>
    `;
  }

  svg += `
    <text x="${left + pw / 2}" y="${height - 5}"
      fill="#c3cde0" font-size="12"
      text-anchor="middle">x coordinate</text>
    <text x="15" y="${top + ph / 2}"
      transform="rotate(-90 15 ${top + ph / 2})"
      fill="#c3cde0" font-size="12"
      text-anchor="middle">y coordinate</text>
  `;

  if (showAll) {
    curvePoints.forEach(point => {
      svg += `
        <circle cx="${sx(point.x)}"
          cy="${sy(point.y)}" r="4"
          fill="#8293b1">
          <title>${pointText(point)}</title>
        </circle>
      `;
    });
  }

  multiples.forEach(({ k: n, point }) => {
    const selected = n === k;
    const color = selected ? "#ffbd7a" : "#6de3e6";

    svg += `
      <circle cx="${sx(point.x)}"
        cy="${sy(point.y)}"
        r="${selected ? 8 : 5.5}"
        fill="${color}" stroke="#0b1221"
        stroke-width="1.5">
        <title>${n}G = ${pointText(point)}</title>
      </circle>
      <text x="${sx(point.x) + 9}"
        y="${sy(point.y) - 9}"
        fill="${color}" font-size="11"
        font-family="monospace">${n}G</text>
    `;
  });

  return svg + "</svg>";
}

function frequency(values) {
  const counts = new Map();

  values.forEach(value => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({ value, count }));
}

// Frequency bar charts
function drawBarChart(id, values, color) {
  const data = frequency(values);
  const width = 520;
  const height = 270;
  const left = 40;
  const top = 25;
  const bottom = 45;
  const right = 15;

  const pw = width - left - right;
  const ph = height - top - bottom;
  const maxCount = Math.max(...data.map(d => d.count));
  const slot = pw / data.length;
  const barWidth = Math.min(38, slot * 0.6);

  let svg = `
    <svg viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg">
  `;

  for (let i = 0; i <= maxCount; i++) {
    const y = top + ph - i / maxCount * ph;

    svg += `
      <line x1="${left}" y1="${y}"
        x2="${width - right}" y2="${y}"
        stroke="#26334b"/>
      <text x="${left - 10}" y="${y + 4}"
        fill="#9baac2" font-size="11"
        text-anchor="end">${i}</text>
    `;
  }

  data.forEach((d, index) => {
    const x = left + index * slot +
      (slot - barWidth) / 2;

    const barHeight = d.count / maxCount * ph;
    const y = top + ph - barHeight;

    svg += `
      <rect x="${x}" y="${y}"
        width="${barWidth}" height="${barHeight}"
        rx="3" fill="${color}">
        <title>Value ${d.value}: ${d.count}</title>
      </rect>
      <text x="${x + barWidth / 2}" y="${y - 7}"
        fill="#edf2ff" font-size="11"
        text-anchor="middle">${d.count}</text>
      <text x="${x + barWidth / 2}" y="${height - 20}"
        fill="#9baac2" font-size="11"
        text-anchor="middle">${d.value}</text>
    `;
  });

  svg += "</svg>";
  $(id).innerHTML = svg;
}

// Descriptive statistics
function mean(values) {
  return values.reduce((a, b) => a + b, 0) /
    values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;

  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(values) {
  const avg = mean(values);

  return Math.sqrt(
    values.reduce(
      (sum, value) => sum + (value - avg) ** 2,
      0
    ) / values.length
  );
}

function correlation(x, y) {
  const mx = mean(x);
  const my = mean(y);

  let numerator = 0;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;

    numerator += dx * dy;
    sumX += dx ** 2;
    sumY += dy ** 2;
  }

  const denominator = Math.sqrt(sumX * sumY);
  return denominator / 1 === 0
    ? NaN
    : numerator / denominator;
}

function renderStatistics() {
  const rows = [
    ["Mean", mean(xs), mean(ys)],
    ["Median", median(xs), median(ys)],
    ["Minimum", Math.min(...xs), Math.min(...ys)],
    ["Maximum", Math.max(...xs), Math.max(...ys)],
    [
      "Standard deviation",
      standardDeviation(xs),
      standardDeviation(ys)
    ]
  ];

  $("summaryTable").innerHTML = rows.map(row => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1].toFixed(2)}</td>
      <td>${row[2].toFixed(2)}</td>
    </tr>
  `).join("");

  const r = correlation(xs, ys);

  $("summaryExplanation").textContent =
    `For these eight points, the mean x-coordinate ` +
    `is ${mean(xs).toFixed(2)} and the mean ` +
    `y-coordinate is ${mean(ys).toFixed(2)}. ` +
    `The population standard deviations are ` +
    `${standardDeviation(xs).toFixed(2)} for x ` +
    `and ${standardDeviation(ys).toFixed(2)} for y.`;

  $("correlationExplanation").textContent =
    `The Pearson correlation coefficient is ` +
    `${r.toFixed(3)}. This describes the linear ` +
    `association between the x and y values in ` +
    `this dataset. Because the points come from ` +
    `modular arithmetic, the coefficient should ` +
    `not be interpreted as a measure of ` +
    `cryptographic security.`;
}

function renderFrequencyExplanation() {
  const repeatedX = frequency(xs)
    .filter(d => d.count > 1)
    .map(d => d.value);

  const repeatedY = frequency(ys)
    .filter(d => d.count > 1)
    .map(d => d.value);

  $("frequencyExplanation").textContent =
    `Among the eight multiples of G, the ` +
    `x-coordinate values ${repeatedX.join(", ")} ` +
    `occur more than once. ` +
    (repeatedY.length
      ? `The repeated y-values are ${repeatedY.join(", ")}.`
      : `All eight y-coordinates are distinct.`);
}

function renderTable(k) {
  $("multiplesTable").innerHTML = multiples
    .map(({ k: n, point }) => `
      <tr class="${n === k ? "selected-row" : ""}">
        <td>${n}G</td>
        <td>${point.x}</td>
        <td>${point.y}</td>
        <td>${pointText(point)}</td>
        <td>${n === k ? "Yes" : "—"}</td>
      </tr>
    `).join("");
}

function update() {
  const raw = $("privateKey").value;
  const k = Number(raw);

  if (
    raw.trim() === "" ||
    !Number.isInteger(k) ||
    k < 1 ||
    k > 8
  ) {
    $("errorMessage").textContent =
      "Please enter a whole number from 1 to 8.";
    return;
  }

  $("errorMessage").textContent = "";

  const Q = multiply(k);

  $("privateResult").textContent = `k = ${k}`;
  $("publicResult").textContent = `Q = ${pointText(Q)}`;
  $("publicNote").textContent = `Q = ${k}G`;

  $("steps").innerHTML = multiples
    .filter(item => item.k <= k)
    .map(({ k: n, point }) => `
      <div class="step ${n === k ? "active" : ""}">
        <span>${n}G</span>
        <strong>${pointText(point)}</strong>
      </div>
    `).join("");

  $("curvePlot").innerHTML = coordinateGraph(k, true);
  $("scatterPlot").innerHTML = coordinateGraph(k, false);

  renderTable(k);
}

function initialize() {
  if (curvePoints.length !== 17 || multiply(9) !== null) {
    throw new Error("Curve validation failed.");
  }

  drawBarChart("xChart", xs, "#a99bff");
  drawBarChart("yChart", ys, "#6de3e6");

  renderStatistics();
  renderFrequencyExplanation();
  update();

  $("generateBtn").addEventListener("click", update);

  $("privateKey").addEventListener("keydown", event => {
    if (event.key === "Enter") update();
  });
}

document.addEventListener("DOMContentLoaded", initialize);

