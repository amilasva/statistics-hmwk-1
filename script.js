
"use strict";

const P = 17;
const G = { x: 1, y: 5 };

function mod(n, m = P) {
    return ((n % m) + m) % m;
}

function inverse(a, m = P) {
    a = mod(a, m);

    for (let i = 1; i < m; i++) {
        if (mod(a * i, m) === 1) return i;
    }

    throw new Error("Modular inverse does not exist.");
}

function pointAdd(A, B) {
    // null represents the point at infinity, O.
    if (A === null) return B;
    if (B === null) return A;

    let slope;

    if (A.x === B.x && mod(A.y + B.y) === 0) {
        return null;
    }

    if (A.x === B.x && A.y === B.y) {
        if (A.y === 0) return null;

        slope = mod(
            3 * A.x * A.x * inverse(2 * A.y)
        );
    } else {
        slope = mod(
            (B.y - A.y) * inverse(B.x - A.x)
        );
    }

    const x = mod(slope * slope - A.x - B.x);
    const y = mod(slope * (A.x - x) - A.y);

    return { x, y };
}

function scalarMultiply(k, point) {
    let result = null;
    let current = point;
    let n = k;

    while (n > 0) {
        if (n % 2 === 1) {
            result = pointAdd(result, current);
        }

        current = pointAdd(current, current);
        n = Math.floor(n / 2);
    }

    return result;
}

function pointText(point) {
    return point === null
        ? "Point at infinity (O)"
        : `(${point.x}, ${point.y})`;
}

function isOnCurve(point) {
    if (point === null) return true;

    return mod(point.y * point.y) ===
        mod(point.x * point.x * point.x + 7);
}

function showGenerator() {
    const input = document.getElementById("privateKey");
    const k = Number(input.value);
    const result = document.getElementById("result");
    const steps = document.getElementById("steps");

    if (!Number.isSafeInteger(k) || k < 1 || k > 100) {
        result.textContent =
            "Please enter a whole-number private key from 1 to 100.";
        steps.innerHTML = "";
        return;
    }

    if (!isOnCurve(G)) {
        result.textContent = "The base point is not on the curve.";
        return;
    }

    steps.innerHTML = "";

    let current = null;

    for (let i = 1; i <= k; i++) {
        current = pointAdd(current, G);

        const row = document.createElement("tr");
        const stepCell = document.createElement("td");
        const pointCell = document.createElement("td");

        stepCell.textContent = `${i}G`;
        pointCell.textContent = pointText(current);

        row.append(stepCell, pointCell);
        steps.appendChild(row);
    }

    const publicKey = scalarMultiply(k, G);

    result.replaceChildren();

    const heading = document.createElement("p");
    heading.textContent = "TOY PUBLIC KEY";

    const key = document.createElement("strong");
    key.textContent = pointText(publicKey);

    const explanation = document.createElement("p");
    explanation.textContent =
        `Private key k = ${k}; public key Q = ${k}G.`;

    result.append(heading, key, explanation);
}

function renderChart(elementId, values) {
    const chart = document.getElementById(elementId);
    chart.innerHTML = "";

    const counts = {};

    values.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(counts));

    Object.keys(counts)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(value => {
            const row = document.createElement("div");
            row.className = "bar-row";

            const label = document.createElement("span");
            label.textContent = value;

            const track = document.createElement("div");
            track.className = "bar-track";

            const fill = document.createElement("div");
            fill.className = "bar-fill";
            fill.style.width = `${counts[value] / maxCount * 100}%`;

            track.appendChild(fill);

            const count = document.createElement("span");
            count.textContent = counts[value];

            row.append(label, track, count);
            chart.appendChild(row);
        });
}

function runStatistics() {
    const points = [];

    for (let k = 1; k <= 8; k++) {
        const Q = scalarMultiply(k, G);

        if (Q !== null) {
            points.push({ k, ...Q });
        }
    }

    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);

    const uniqueX = new Set(xs).size;
    const uniqueY = new Set(ys).size;

    const stats = document.getElementById("statistics");
    stats.innerHTML = "";

    const cards = [
        ["Private keys tested", points.length],
        ["Distinct x-values", uniqueX],
        ["Distinct y-values", uniqueY],
        ["Base point order", 9]
    ];

    cards.forEach(([label, value]) => {
        const card = document.createElement("div");
        card.className = "stat-card";

        const title = document.createElement("span");
        title.textContent = label;

        const number = document.createElement("strong");
        number.textContent = value;

        card.append(title, number);
        stats.appendChild(card);
    });

    const table = document.getElementById("dataTable");
    table.innerHTML = "";

    points.forEach(point => {
        const row = document.createElement("tr");

        [point.k, `(${point.x}, ${point.y})`,
            point.x, point.y].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        table.appendChild(row);
    });

    renderChart("xChart", xs);
    renderChart("yChart", ys);
}

document.getElementById("generateBtn")
    .addEventListener("click", showGenerator);

document.getElementById("privateKey")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") showGenerator();
    });

showGenerator();
runStatistics();
