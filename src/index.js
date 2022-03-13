import Ball from "./ball.js";
import Sound from "./sound.js";

let canvas, drawCtx, audioCtx, gainNode, balls;

var isPlaying;

let ballCount = 20;
let ballRadius = 5;
let speed = 0.0001;

let genCode = '200+4*i'

let centerX, centerY, borderLength;
let ballDistance;

let fromSound = 220, toSound = 440;

let soundType = 1;

function init() {
  canvas = document.getElementById("canvas");
  drawCtx = canvas.getContext("2d");
  balls = [];
  isPlaying = false;
  
  resizeCanvas();
  
  audioCtx = new window.AudioContext();
  gainNode = audioCtx.createGain();
  if (ballCount > 0) {
    gainNode.gain.value = 1 / ballCount / 2;
  }

  generateBalls();
  
  window.onresize = resizeCanvas;
  
  generateButtons();

  generateSoundVariations();

  step();
}

function generateBalls() {
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
        new Sound(audioCtx, gainNode, genSound(i))
      )
    );
  }
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

function genSound(i) {
  if (soundType == 1) {
    if (ballCount > 1 && fromSound > 0) {
      const mul = (toSound / fromSound) ** (1 / (ballCount-1));
      return fromSound * mul ** i;
    }
  }
  return fromSound;
}

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

function generateHeader(tbl, name) {
  let header = document.createElement("th");
  header.textContent = name;
  tbl.appendChild(header);
}

function generateButtons() {
  const tbl = document.getElementById("balls-speeds");
  var tblBody = document.createElement("tbody");
  generateHeader(tblBody, "№");
  generateHeader(tblBody, "Скорость");
  generateHeader(tblBody, "Нота");
  generateHeader(tblBody, "Частота, Гц");

  for (let i = 0; i < ballCount; ++i) {
    var row = document.createElement("tr");

    var cell = document.createElement("td");
    var cellText = document.createTextNode(i);
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
      updateBallSpeed(i, nv);
    };
    cell.appendChild(cellInput);
    row.appendChild(cell);

    cell = document.createElement("td");
    var cellSelect = document.createElement("select");
    generateSoundSelect(cellSelect, balls[i].sound.frequency);
    cellSelect.id = "ball-sound-select-" + i;
    cellSelect.onchange = function() {
      let nv = this.value;
      updateBallSound(i, nv);
    }
    cell.appendChild(cellSelect);
    row.appendChild(cell);

    cell = document.createElement("td");
    cellInput = document.createElement("input");
    cellInput.type = "number";
    cellInput.min = "0";
    cellInput.value = balls[i].sound.frequency.toFixed(2);
    cellInput.style.width = "70px";
    cellInput.id = "ball-sound-" + i;
    cellInput.step = "0.01";
    cellInput.oninput = function () {
      let nv = this.value
      updateBallSound(i, nv);
    };
    cell.appendChild(cellInput);
    row.appendChild(cell);

    row.onmouseenter = function() {
      balls[i].selected = true;
      balls[i].sound.play();
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

function generateSoundSelect(cellSelect, frequency) {
  let option = document.createElement("option");
  option.selected = true;
  option.style = "display: none";
  cellSelect.appendChild(option);
  const initial = 440;
  const step = 2 ** (1/12);

  for (let i = -48; i < 43; ++i) {
    let freq = initial * step ** i;
    option = document.createElement("option");
    option.value = freq;
    option.textContent = noteName(i);
    option.selected = (Math.abs(frequency - freq) < 0.01);
    cellSelect.appendChild(option);
  }
}

function setSoundSelect(cellSelect, frequency) {
  const initial = 440;
  const step = 2 ** (1/12);
  var array = Array.prototype.slice.call(cellSelect.childNodes, 1);

  for (let i = -48; i < 43; ++i) {
    let freq = initial * step ** i;
    array[i+48].selected = (Math.abs(frequency - freq) < 0.01);
  }
}

function noteName(i) {
  let notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
  return notes[(i % 12 + 12) % 12] + (~~((i-2) / 12) + 4);
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

function updateBallSpeed(i, newSpeed) {
  balls[i].velocity = newSpeed;
  document.getElementById("ball-speed-" + i).value = newSpeed;
}

function updateBallSound(i, newFrequency) {
  balls[i].sound.frequency = newFrequency;
  document.getElementById("ball-sound-" + i).value = parseFloat(newFrequency).toFixed(2);
  setSoundSelect(document.getElementById("ball-sound-select-" + i), newFrequency);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = (canvas.height * 5) / 6;
  ballDistance = Math.min((centerY - 100) / ballCount, (centerX - 40) / ballCount, 40);
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

function resetSoft() {
  startButton.innerText = "Старт";
  speedBar.value = 0;
  speedBar.oninput();
  isPlaying = false;

  for (let i in balls) {
    balls[i].angle = 0;
    balls[i].radius = 50 + i * ballDistance;
  }
  
  resizeCanvas();
  draw();
}

function resetHard() {
  balls = [];
  resetSoft();
  generateBalls();
  generateButtons();
  draw();
}

let resetButton = document.getElementById("reset-button");
resetButton.onclick = function () {
  resetSoft();
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
  resetHard();
};

let collapsed = true;
let collapseBallsButton = document.getElementById("collapse-balls");
collapseBallsButton.onclick = function () {
  collapsed = !collapsed;
  if (collapsed) {
    collapseBallsButton.innerText = "Развернуть";
    document.getElementById("table-balls").style.display="none";
  } else {
    collapseBallsButton.innerText = "Свернуть";
    document.getElementById("table-balls").style.display="block";
  }
};

let genSpeedCollapsed = true;
let collapseSpeedButton = document.getElementById("show-gen-speed");
collapseSpeedButton.onclick = function () {
  genSpeedCollapsed = !genSpeedCollapsed;
  if (genSpeedCollapsed) {
    document.getElementById("expand-speed").style.display="none";
  } else {
    document.getElementById("expand-speed").style.display="block";
  }
};

let genSoundCollapsed = true;
let collapseSoundButton = document.getElementById("show-gen-sound");
collapseSoundButton.onclick = function () {
  genSoundCollapsed = !genSoundCollapsed;
  if (genSoundCollapsed) {
    document.getElementById("expand-sound").style.display="none";
  } else {
    document.getElementById("expand-sound").style.display="block";
  }
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
    updateBallSpeed(i, window.eval('let i=' + i + ';' + genCode));
  }
}

let runSoundButton = document.getElementById("run-sound");
runSoundButton.onclick = function() {
  fromSound = parseFloat(document.getElementById("sound-from-input").value);
  toSound = parseFloat(document.getElementById("sound-to-input").value);
  for (let i in balls) {
    updateBallSound(i, genSound(i));
  }
}

function updateFromSound(newValue) {
  setSoundSelect(document.getElementById("sound-from-select"), newValue);
  document.getElementById("sound-from-input").value = parseFloat(newValue).toFixed(2);
}

function updateToSound(newValue) {
  setSoundSelect(document.getElementById("sound-to-select"), newValue);
  document.getElementById("sound-to-input").value = parseFloat(newValue).toFixed(2);
}

function generateSoundVariations() {
  generateSoundSelect(document.getElementById("sound-from-select"), fromSound);
  generateSoundSelect(document.getElementById("sound-to-select"), toSound);
  document.getElementById("sound-to-select").onchange = function() {
    updateToSound(this.value);
  }
  document.getElementById("sound-to-input").oninput = function() {
    updateToSound(this.value);
  }
  document.getElementById("sound-from-select").onchange = function() {
    updateFromSound(this.value);
  }
  document.getElementById("sound-from-input").oninput = function() {
    updateFromSound(this.value);
  }
}