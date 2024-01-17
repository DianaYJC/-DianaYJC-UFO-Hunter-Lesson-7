// Canvas drawing
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas automatic resizing
function resize() {
  // Configure height based on screen size
  const height = window.innerHeight - 20;

  // Calculate canvas's width by ratio
  const ratio = canvas.width / canvas.height;
  const width = height * ratio;

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}

window.addEventListener('load', resize);

// Game Basics
class GameBasics {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    // active playing field
    this.playBoundaries = {
      top: 150,
      bottom: 650,
      left: 100,
      right: 800
    };
    
    // initial values
    this.level = 1;
    this.score = 0;
    this.shields = 2;

    // game settings
    this.setting = {
      //FPS: 60 frame per 1 second, this means 1 new frame in every 0.01666667 seconds  
      updateSeconds: (1 / 60),
      spaceshipSpeed: 200, //spaceship's speed 
      bulletSpeed: 130, //bullets speed of spaceship
      bulletMaxFrequency: 500, //how fast our spaceship can shoot one after another
      ufoRows: 4,
      ufoColumns: 8,
      ufoSpeed: 35,
      ufoSinkingValue: 30, // distance of sinking,
      bombSpeed: 75, 
      bombFrequency: 0.05
    };

    // Store positions and states of the game 
    this.positionContainer = [];
    
    // pressed keys storing
    this.pressedKeys = {};
  }

  //  Return to current game position and status. Always returns the top element of positionContainer.
  presentPosition() {
    return this.positionContainer.length > 0 ? this.positionContainer[this.positionContainer.length - 1] : null;
  }

  // Move to the desired position
  goToPosition(position) {
    // If we're already in a position, don't need to go to new position
    if (this.presentPosition()) {
      this.positionContainer.length = 0;
    }
    // If we finds an 'entry' in a given position, we call it. 
    if (position.entry) {
      position.entry(play); // play is the game object
    }
    // Set the current game position in the positionContainer
    this.positionContainer.push(position);
  }
  // Push our new position
  pushPosition(position) {
    this.positionContainer.push(position);
  }
  // Pop the position
  popPosition() {
    this.positionContainer.pop();
  }

  // GameBasics start - Starting the loop
  start() {
    //Specify the interval in milliseconds 
    setInterval(function () { gameLoop(play); }, this.setting.updateSeconds * 1000); //0,01666667 sec * 1000 = 16,67 ms
    //Go into the Opening position
    this.goToPosition(new OpeningPosition());
  }

  // Notifies the game when a key is pressed
  keyDown(keyboardCode) {
    // store the pressed key in 'pressedKeys'
    this.pressedKeys[keyboardCode] = true;
    //  it calls the present position's keyDown function
    if (this.presentPosition() && this.presentPosition().keyDown) {
      this.presentPosition().keyDown(this, keyboardCode);
    }
  }
  //  Notifies the game when a key is released
  keyUp(keyboardCode) {
    // delete the released key from 'pressedKeys'
    delete this.pressedKeys[keyboardCode];
  }
  
}

// Game Loop
function gameLoop(play) {
  let presentPosition = play.presentPosition();

  if (presentPosition) {
    // update
    if (presentPosition.update) {
      presentPosition.update(play);
    }
    // draw
    if (presentPosition.draw) {
      presentPosition.draw(play);
    }
  }
}

// Create a GameBasics object
const play = new GameBasics(canvas);
play.sounds = new Sounds(); 
play.sounds.init();
play.start();

// Keyboard events listening
window.addEventListener("keydown", function (e) {
  const keyboardCode = e.code; // Get the event code
  if (keyboardCode == 'Space' || keyboardCode == 'ArrowLeft' || keyboardCode == 'ArrowRight') { 
    e.preventDefault(); // Prevent the default behavior of the space and arrow keys
  }
  play.keyDown(keyboardCode);
})

window.addEventListener("keyup", function (e) {
  const keyboardCode = e.code; // Get the event code
  play.keyUp(keyboardCode);
});
