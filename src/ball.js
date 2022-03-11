export default class Ball {
  constructor(ctx, cx, cy, radius, ballRadius, velocity, color, sound) {
    this.cx = cx;
    this.cy = cy;

    this.langle = (3 * Math.PI) / 4;
    this.rangle = Math.PI / 4;
    this.angle = 0;
    this.velocity = velocity;
    this.radius = radius;
    this.prAngle = 0;

    this.ballRadius = ballRadius;
    this.color = color;
	this.selected = false;

    this.sound = sound;

    this.ctx = ctx;
  }

  draw() {
    this.calcPosition();
    this.ctx.fillStyle = this.selected ? "#FF0000" : this.color;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2, true);
    this.ctx.stroke();
    this.ctx.fill();
  }

  calcPosition() {
    const delta = Math.abs(this.rangle - this.langle) * 2;
    let angle = (this.angle % delta) - delta / 2;
    if (angle * this.prAngle < 0) {
      this.sound.play();
    }

    this.prAngle = angle;
    angle = Math.abs(angle) + this.rangle;

    this.x = this.cx + Math.cos(angle) * this.radius;
    this.y = this.cy - Math.sin(angle) * this.radius;
  }

  step(speed) {
    this.angle += speed * this.velocity;
  }
}
