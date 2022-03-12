import Ball from "./ball.js";
import Sound from "./sound.js";

let canvas, drawCtx, audioCtx, balls;

var isPlaying;

let ballCount = 20;
let ballRadius = 5;
let speed = 0.0001;

let genCode = '200+4*i'

let centerX, centerY, borderLength;
let ballDistance;

function init() {
  canvas = document.getElementById("canvas");
  drawCtx = canvas.getContext("2d");
  balls = [];
  isPlaying = false;
  
  resizeCanvas()
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let gainNode = audioCtx.createGain();
  if (ballCount > 0) {
    gainNode.gain.value = 1 / ballCount / 2;
  }
  const mul = 2 ** (1 / 12);

  for (let i = 0; i < ballCount; i++) {
    balls.push(
      new Ball(
        drawCtx,
        centerX,
        centerY,
        50 + i * ballDistance,
        ballRadius,
        window.eval('let i=' + i + ';' + genCode),
        hslToHex((360 * i) / ballCount, 80, 50),
        new Sound(audioCtx, gainNode, 440 * mul ** i)
      )
    );
  }

  window.onresize = resizeCanvas;

  generateButtons();

  step();
}

function step() {
  draw()
  for (let ball of balls) {
    if (isPlaying) {
      ball.step(speed);
    }
  }

  if (isPlaying) {
    requestAnimationFrame(step);
  }
}

init();

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateButtons() {
  const tbl = document.getElementById("balls-speeds");
  var tblBody = document.createElement("tbody");

  for (let i = 0; i < ballCount; ++i) {
    var row = document.createElement("tr");

    var cell = document.createElement("td");
    var cellText = document.createTextNode("Шар " + i);
    cell.appendChild(cellText);
    row.appendChild(cell);

    cell = document.createElement("td");
    var cellInput = document.createElement("input");
    cellInput.type = "number";
    cellInput.min = "0";
    cellInput.value = balls[i].velocity;
    cellInput.style.width = "50px";
    cellInput.id = "ball-speed-" + i;
    cellInput.oninput = function () {
      let nv = this.value
      balls[i].velocity = nv;
    };
    cell.appendChild(cellInput);
    row.appendChild(cell);
	row.onmouseover = function() {
	  balls[i].selected = true;
	  balls[i].draw();
	}
	row.onmouseleave = function() {
	  balls[i].selected = false;
	  balls[i].draw();
	}
    tblBody.appendChild(row);
  }

  while (tbl.firstChild) {
    tbl.firstChild.remove();
  }
  tbl.appendChild(tblBody);
}

function draw() {
  drawCtx.clearRect(0, 0, canvas.width, canvas.height);
  drawLines();
  for (let ball of balls) {
    ball.draw();
  }
}

function drawLines() {
  drawCtx.beginPath();
  drawCtx.moveTo(centerX, centerY);
  drawCtx.lineTo(centerX - borderLength, centerY - borderLength);
  drawCtx.moveTo(centerX, centerY);
  drawCtx.lineTo(centerX + borderLength, centerY - borderLength);
  drawCtx.stroke();
  if (!balls.length) {
    return;
  }
  drawCtx.beginPath();
  balls[0].calcPosition()
  drawCtx.moveTo(balls[0].x, balls[0].y);
  for (let ball of balls.slice(1)) {
    ball.calcPosition();
    drawCtx.lineTo(ball.x, ball.y);
  }
  drawCtx.stroke();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = (canvas.height * 3) / 4;
  ballDistance = Math.min((centerY - 50) / ballCount, (centerX - 20) / ballCount, 15);
  borderLength = 50 + (ballCount * ballDistance) / Math.sqrt(2);
  for (let ball of balls) {
    ball.cx = centerX;
    ball.cy = centerY;
  }
  draw();
}

let startButton = document.getElementById("start-stop-button");
startButton.onclick = function () {
  isPlaying = !isPlaying;
  if (isPlaying) {
    startButton.innerText = "Стоп";
    step();
  } else {
    startButton.innerText = "Старт";
  }
  audioCtx.resume();
};

function reset() {
  startButton.innerText = "Старт";
  speedBar.value = 0;
  speedBar.oninput();
  isPlaying = false;
  
  resizeCanvas()
  for (let i in balls) {
    balls[i].angle = 0;
    balls[i].radius = 50 + i * ballDistance;
  }
  draw();
}

let resetButton = document.getElementById("reset-button");
resetButton.onclick = function () {
  reset()
};

let speedBar = document.getElementById("speed");
let speedValue = document.getElementById("speed-value");
speedBar.oninput = function () {
  speed = Math.exp(speedBar.value * 3.5) * 0.0001;
  speedValue.textContent = (speed / 0.0001).toFixed(2);
};

let countInput = document.getElementById("balls-count");
countInput.oninput = function () {
  ballCount = parseInt(countInput.value, 10);
  reset();
  init();
};

let collapsed = true;
let collapseBallsButton = document.getElementById("collapse-balls");
collapseBallsButton.onclick = function () {
  collapsed = !collapsed;
  if (collapsed) {
    collapseBallsButton.innerText = "Развернуть";
    document.getElementById("expand").style.display="none";
  } else {
    collapseBallsButton.innerText = "Свернуть";
    document.getElementById("expand").style.display="block";
  }
  audioCtx.resume();
};

let runButton = document.getElementById("run-code");
runButton.onclick = function() {
  let codeArea = document.getElementById("gen-code");
  console.log(codeArea.value)
  try {
    window.eval('let i=0;' + codeArea.value);
  } catch (e) {
    alert(e.message);
    return;
  }
  genCode = codeArea.value;
  for (let i in balls) {
    balls[i].velocity = window.eval('let i=' + i + ';' + genCode);
    document.getElementById("ball-speed-" + i).value = balls[i].velocity;
  }
}