class Game {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.canvas.height = innerHeight;
    this.ctx = this.canvas.getContext("2d");
    this.points = 0;
    this.startedAt = new Date();
    this.road = new Image();
    this.road.src = "images/road.png";
    // We need to render the rode 3 times to simulte it moving
    this.roadYs = [0, -this.canvas.height, -this.canvas.height * 2];
    // Each green side size
    this.grassSize = 35;
    this.roadSize = this.canvas.width - this.grassSize * 2;
    this.car = {
      img: new Image(),
      w: 50,
      speed: this.canvas.width * 0.01
    };
    this.car.img.src = "images/car.png";
    this.car.img.onload = () => {
      this.car.initialX = this.canvas.width / 2 - this.car.w / 2;
      this.car.x = this.car.initialX;
      // Use original proportions to calculate height based on desired width
      this.car.h =
        (this.car.w * this.car.img.naturalHeight) / this.car.img.naturalWidth;
      this.car.initialY = this.canvas.height - this.car.h - 10;
      this.car.y = this.car.initialY;
    };
    this.offset = this.car.w * 3; // Min. free space for the car to pass
    this.keysDown = {};
    this.obstacles = [];
    this.obstacleH = 30;
    this.obstacleMinW = 50;
    this.obstacleMaxW = this.roadSize - this.offset;
    this.obstacleMaxX = this.canvas.width - this.grassSize;
    this.obstacleMinX = this.grassSize;
    this.obstacleSpeed = this.canvas.width * 0.005;
    this.obstacleFrequencyMs = 1000;
  }
  start() {
    this.setEventListeners();
    this.animationId = requestAnimationFrame(this.drawAll);
  }
  end() {
    removeEventListener("keydown", this.keyDownListener);
    // removeEventListener("keyup", this.keyUpListener);
    cancelAnimationFrame(this.animationId);
    this.ended = true;
  }
  restart() {
    this.keysDown = {};
    this.obstacles = [];
    this.startedAt = new Date();
    this.points = 0;
    this.setEventListeners();
    this.animationId = requestAnimationFrame(this.drawAll);
  }
  keyDownListener = event => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        this.keysDown[event.key] = true; // this.car.x += this.car.speed;
        break;
      }
    }
  };
  keyUpListener = event => {
    if (this.keysDown[event.key]) {
      this.keysDown[event.key] = false;
    }

    switch (event.key) {
      case "p": {
        if (!this.paused) {
          this.paused = true;
          cancelAnimationFrame(this.animationId);
        }
        break;
      }
      case "r": {
        if (this.paused) {
          this.paused = false;
          this.animationId = requestAnimationFrame(this.drawAll);
        }
        break;
      }
      case "Enter": {
        if (this.ended) {
          this.ended = false;
          this.restart();
        }
      }
    }
  };
  setEventListeners() {
    addEventListener("keydown", this.keyDownListener);
    addEventListener("keyup", this.keyUpListener);
  }
  clearAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  drawAll = now => {
    this.clearAll();
    this.updateRoad();
    this.drawRoad();
    this.updateObstacles(now);
    this.drawObstacles();
    this.drawScore();
    this.drawCar();
    const hasCollided = this.checkColisions();
    if (hasCollided) {
      this.end();
      requestAnimationFrame(this.drawGameOver);
      return;
    }
    this.animationId = requestAnimationFrame(this.drawAll);
  };
  drawRoad() {
    this.ctx.drawImage(
      this.road,
      0,
      this.roadYs[0],
      this.canvas.width,
      this.canvas.height
    );
    this.ctx.drawImage(
      this.road,
      0,
      this.roadYs[1],
      this.canvas.width,
      this.canvas.height
    );
    this.ctx.drawImage(
      this.road,
      0,
      this.roadYs[2],
      this.canvas.width,
      this.canvas.height
    );
  }
  updateRoad() {
    const roadSpeed = this.obstacleSpeed;
    this.roadYs = this.roadYs.map(y => y + roadSpeed);
    // If first road image if not visible anymore we move it back on top
    if (this.roadYs[0] > this.canvas.height) {
      this.roadYs.push(this.roadYs[2] - this.canvas.height);
      this.roadYs.shift();
    }
  }
  drawCar() {
    if (this.keysDown["ArrowLeft"]) {
      this.car.x -= this.car.speed;
    }
    if (this.keysDown["ArrowRight"]) {
      this.car.x += this.car.speed;
    }
    this.ctx.drawImage(
      this.car.img,
      this.car.x,
      this.car.y,
      this.car.w,
      this.car.h
    );
  }
  drawObstacles() {
    this.ctx.lineWidth = this.obstacleH;
    this.ctx.strokeStyle = "brown";
    this.obstacles.forEach(obs => {
      this.ctx.beginPath();
      this.ctx.moveTo(obs.x, obs.y);
      this.ctx.lineTo(obs.x + obs.w, obs.y);
      this.ctx.stroke();
      this.ctx.closePath();
    });
  }
  createObstacle(now) {
    let w = Math.floor(Math.random() * this.obstacleMaxW);
    w = w < this.obstacleMinW ? this.obstacleMinW : w;
    const maxX = this.canvas.width - this.grassSize - w;
    let x = Math.floor(Math.random() * maxX);
    x = x < this.obstacleMinX ? this.obstacleMinX : x;
    const obstacle = {
      x,
      y: -30,
      w,
      createdAt: now
    };
    return obstacle;
  }
  updateObstacles(now) {
    this.obstacles.forEach(obs => {
      obs.y = obs.y + this.obstacleSpeed;
    });

    if (this.obstacles.length) {
      // Only add new obstacle after X frequency
      const lastObstacle = this.obstacles[this.obstacles.length - 1];
      const millisSinceLastObstacle = now - lastObstacle.createdAt;
      if (millisSinceLastObstacle < this.obstacleFrequencyMs) {
        return;
      }
    }
    const obstacle = this.createObstacle(now);
    // Rotate obstacles so memory is not overloaded
    if (this.obstacles.length === 10) {
      this.obstacles.shift();
    }
    this.obstacles.push(obstacle);
  }
  drawScore() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.fillText(
      `Score: ${Math.round((Date.now() - this.startedAt.getTime()) / 1000)}`,
      70,
      30
    );
  }
  checkColisions() {
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      const { x: carX, w: carW, y: carY, h: carH } = this.car;
      // Match X
      if (
        // Car left side collision
        (carX >= obs.x && carX <= obs.x + obs.w) ||
        // Car right side collision
        (carX + carW >= obs.x && carX + carW <= obs.x + obs.w) ||
        // Obstacle smaller and fits inside car
        (carX < obs.x && carX + carW > obs.x + obs.w)
      ) {
        // Match Y
        if (
          // Top collision
          (carY > obs.y && carY < obs.y + this.obstacleH) ||
          // Botton collision (going sideway)
          (carY + carH > obs.y && carY + carH < obs.y + this.obstacleH) ||
          // Obstacle inside
          (obs.y > carY && obs.y + this.obstacleH < carY + carH)
        ) {
          return true;
        }
      }
    }
    return false;
  }
  drawGameOver = () => {
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "red";
    this.ctx.font = "50px Arial";
    this.ctx.fillText(
      `Game Over`,
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.fillText(
      `Press ENTER to try again`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  };
}
