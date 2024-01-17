class InGamePosition {
  constructor(setting, level) {
    this.setting = setting;
    this.level = level;
    this.object = null;
    this.spaceship = null;
    this.bullets = [];
    this.lastBulletTime = null;
    this.ufos = [];
    this.bombs = [];
  }


  entry(play) {
    this.spaceship_image = new Image(); // spaceship image
    this.ufo_image = new Image(); // ufo image
    this.upSec = this.setting.updateSeconds;
    this.direction = 1;
    this.horizontalMoving = 1;
    this.verticalMoving = 0;
    this.ufosAreSinking = false;
    this.ufoPresentSinkingValue = 0;

    let presentLevel = this.level;
    // 1. UFO speed
    this.ufoSpeed = this.setting.ufoSpeed + (presentLevel * 7); //Level1: 35 + (1*7) = 42, Level2: 42 + (2*7) = 49, ...
    // 2. Bomb falling speed 
    this.bombSpeed = this.setting.bombSpeed + (presentLevel * 10); //Level1: 75 + (1*10) = 85, Level2: 75 + (2*10) = 95, ...
    // 3. Bomb dropping frequency 
    this.bombFrequency = this.setting.bombFrequency + (presentLevel * 0.05); //Level1: 0.05 + (1*0.05) = 0.1, Level2: 0.05 + (2*0.05) = 0.15 ...


    this.spaceshipSpeed = this.setting.spaceshipSpeed;

    this.object = new Objects();
    this.spaceship = this.object.spaceship((play.width / 2), play.playBoundaries.bottom, this.spaceship_image);

    const rows = this.setting.ufoRows;
    const columns = this.setting.ufoColumns;
    const ufosInitial = [];

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        this.object = new Objects();
        let x = (play.width / 2) - ((columns - 1) * 25) + (column * 50);
        let y = (play.playBoundaries.top + 30) + (row * 30);
        ufosInitial.push(this.object.ufo(x, y, row, column, this.ufo_image, this.level));
      }
    }
    this.ufos = ufosInitial;
  }

  draw(play) {
    ctx.clearRect(0, 0, play.width, play.height);

    ctx.drawImage(this.spaceship_image, this.spaceship.x - (this.spaceship.width / 2), this.spaceship.y - (this.spaceship.height / 2));

    // Draw Bullets 
    ctx.fillStyle = '#ff0000';
    for (let i = 0; i < this.bullets.length; i++) {
      let bullet = this.bullets[i];
      ctx.fillRect(bullet.x - 1, bullet.y - 6, 2, 6);
    }

    for (let i = 0; i < this.ufos.length; i++) {
      let ufo = this.ufos[i];
      ctx.drawImage(this.ufo_image, ufo.x - (ufo.width / 2), ufo.y - (ufo.height / 2));
    }
    // Draw Bombs
    ctx.fillStyle = '#FE2EF7'; // Set fill style for bombs
    for (let i = 0; i < this.bombs.length; i++) {
      let bomb = this.bombs[i];
      ctx.fillRect(bomb.x - 2, bomb.y, 4, 6);
    }
  }

  update(play) {
    const spaceship = this.spaceship;
    const spaceshipSpeed = this.spaceshipSpeed;
    const upSec = this.setting.updateSeconds;
    const bullets = this.bullets;
    // UFOS bombing 
    // Frontline UFOs - which are at the bottom of each column
    const frontLineUFOs = [];

    // Keyboard events
    if (play.pressedKeys['ArrowLeft']) {
      spaceship.x -= spaceshipSpeed * upSec;
    }
    if (play.pressedKeys['ArrowRight']) {
      spaceship.x += spaceshipSpeed * upSec;
    }
    if (play.pressedKeys['Space']) {
      this.shoot();
    }

    // Keep spaceship in playing area
    if (spaceship.x < play.playBoundaries.left) {
      spaceship.x = play.playBoundaries.left;
    }
    if (spaceship.x > play.playBoundaries.right) {
      spaceship.x = play.playBoundaries.right;
    }

    //  Moving bullets
    for (let i = 0; i < bullets.length; i++) {
      let bullet = bullets[i];
      bullet.y -= upSec * this.setting.bulletSpeed;
      // If our bullet flies out from the canvas, it will be cleared
      if (bullet.y < 0) {
        bullets.splice(i--, 1);
      }
    }

    let reachedSide = false;

    for (let i = 0; i < this.ufos.length; i++) {
      let ufo = this.ufos[i];
      let newX = ufo.x + this.ufoSpeed * upSec * this.direction * this.horizontalMoving;
      let newY = ufo.y + this.ufoSpeed * upSec * this.verticalMoving;
      if (newX > play.playBoundaries.right || newX < play.playBoundaries.left) {
        this.direction *= -1;
        reachedSide = true;
        this.horizontalMoving = 0;
        this.verticalMoving = 1;
        this.ufosAreSinking = true;
      }
      if (!reachedSide) {
        ufo.x = newX;
        ufo.y = newY;
      }
    }

    if (this.ufosAreSinking) {
      this.ufoPresentSinkingValue += this.ufoSpeed * upSec;
      if (this.ufoPresentSinkingValue >= this.setting.ufoSinkingValue) {
        this.ufosAreSinking = false;
        this.verticalMoving = 0;
        this.horizontalMoving = 1;
        this.ufoPresentSinkingValue = 0;
      }
    }

    for (let i = 0; i < this.ufos.length; i++) {
      let ufo = this.ufos[i];
      if (!frontLineUFOs[ufo.column] || frontLineUFOs[ufo.column].row < ufo.row) {
        frontLineUFOs[ufo.column] = ufo;
      }
    }

    for (let i = 0; i < this.setting.ufoColumns; i++) {
      let ufo = frontLineUFOs[i];
      if (!ufo) {
        continue;
      }
      let chance = this.bombFrequency * upSec;
      this.object = new Objects();
      if (chance > Math.random()) {
        this.bombs.push(this.object.bomb(ufo.x, ufo.y + ufo.height / 2));
        // console.log("UFO (column:" + ufo.column + ", row:" + ufo.row + ") is bombing!");
      }
    }

    // Moving bombs
    for (let i = 0; i < this.bombs.length; i++) {
      let bomb = this.bombs[i];
      bomb.y += upSec * this.bombSpeed;
      if (bomb.y > play.height) {
        this.bombs.splice(i, 1);
        i--; // Decrement i to adjust for the removed element
      }
    }

    // Check collision
    for (let i = 0; i < this.ufos.length; i++) {
      let ufo = this.ufos[i];
      let collision = false;

      for (let j = 0; j < this.bullets.length; j++) {
        let bullet = this.bullets[j];
        // collision check
        if (bullet.x >= (ufo.x - ufo.width / 2) && 
          bullet.x <= (ufo.x + ufo.width / 2) &&
          bullet.y >= (ufo.y - ufo.height / 2) && 
          bullet.y <= (ufo.y + ufo.height / 2)) {
          // if there is collision we delete the bullet and set collision true
          bullets.splice(j, 1);
          j--; // Decrease j to adjust for the removed bullet
          collision = true;
        }
      }
      // if there is collision we delete the UFO
      if (collision) {
        this.ufos.splice(i, 1);
        i--; // Decrease i to adjust for the removed UFO
        play.sounds.playSound('ufoDeath');
      }
    }

    for (let i = 0; i < this.bombs.length; i++) {
      let bomb = this.bombs[i];
      if (bomb.x + 2 >= (spaceship.x - spaceship.width / 2) &&
          bomb.x - 2 <= (spaceship.x + spaceship.width / 2) &&
          bomb.y + 6 >= (spaceship.y - spaceship.height / 2) &&
          bomb.y <= (spaceship.y + spaceship.height / 2)) {
        // Bomb hit the spaceship

        // if there is collision we delete the bomb   
        this.bombs.splice(i, 1);
        i--; // Prevent skipping the current element
        play.sounds.playSound('explosion');
        play.goToPosition(new OpeningPosition());
      }
    }

    for (let i = 0; i < this.ufos.length; i++) {
      let ufo = this.ufos[i];
      if (ufo.x + ufo.width / 2 >= (spaceship.x - spaceship.width / 2) &&
          ufo.x - ufo.width / 2 <= (spaceship.x + spaceship.width / 2) &&
          ufo.y + ufo.height / 2 >= (spaceship.y - spaceship.height / 2) &&
          ufo.y - ufo.height / 2 <= (spaceship.y + spaceship.height / 2)) {
        // Collision detected between UFO and spaceship
        play.sounds.playSound('explosion');
        play.goToPosition(new OpeningPosition());
        return; // Exit the function to prevent further updates
      }
    }
  }

  shoot() {
    // Allows to shoot when there was no bullet shot or when the time between the last shot and now is more than the bullet frequency
    if (this.lastBulletTime === null
      || ((new Date()).getTime() - this.lastBulletTime) > this.setting.bulletMaxFrequency) {
      this.object = new Objects();
      this.bullets.push(this.object.bullet(this.spaceship.x, this.spaceship.y - this.spaceship.height / 2, this.setting.bulletSpeed));
      this.lastBulletTime = (new Date()).getTime();
      play.sounds.playSound('shot');
    }
  }
}
