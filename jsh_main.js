/******************************************************/
/*                Graphics & Game Logic               */
/******************************************************/

// Speed parameters
var baseArrowRotateSpeed = 8;
var arrowRotateDirection = 0;
var baseBackgroundRotateSpeed = 2.5;
var baseObstacleSpeedFactor = 0.005;
var gameOverTimeout = 500; // Unit : ms
var backgroundFlashSpeed = 0.007;

// Cycles parameters
var cycleLength = 180;
var minCycleLength = 100;
var maxCycleLength = 160;
var baseObstacleSpawnDelayFactor = 0.15;

// Difficulty parameters
var difficultyIncreaseDelay = 600; //60 frames/sec * 10 sec
var difficultyIncreaseFactor = 0.1;
var nextDifficulty = 0;
var difficultyLevel = 0;

// Resolution-dependent resizing parameters
var oldOrigin = view.center;
var baseSize = 2 * Math.min(view.center.x, view.center.y);
var BackgroundBaseSize = 2 * Math.max(view.center.x, view.center.y);
var hexCenterSizeFactor = 0.05;
var arrowSizeFactor = 0.01;
var obstacleDistanceFactor = 0.4;
var obstacleSizeFactor = 0.01;
var arrowTranslationFactor = 1.4;
var scoreTextMarginSizeFactor = 0.05;
var backgroundSizeFactor = 1;
var warningSizeFactor = 0.001;

// Obstacle generation parameters
var patterns = [
    [true, true, false, false, true, false],
    [true, false, true, false, true, false],
    [true, false, true, true, true, false],
    [true, true, true, true, true, false]
];

// Project layers
var backgroundLayer = new Layer();
var mainLayer = new Layer();
var warningLayer = new Layer();

// Background
backgroundLayer.activate();
var backgroundSize = backgroundSizeFactor * BackgroundBaseSize;
var background = new Path.Rectangle(0,0,backgroundSize, backgroundSize);
var colorChange = 1;
initNewBackground(difficultyLevel);

// Seizure warning
warningLayer.activate();
backgroundLayer.visible = false;
mainLayer.visible = false;
var enableBackgroundAnimation = true;
var warningON = new Raster("img/warningON.svg");
var warningOFF = new Raster("img/warningOFF.svg");
var okButton;
var backgroundAnimationSwitch;
warningOFF.visible = false;

mainLayer.activate();

// Parameter-dependent variables
var arrowSize;
var hexCenterSize;
var obstacleDistance;
var obstacleSpeed;
var obstacleSize;
calculateResolutionDependentVariables(baseSize);

// Game objects arrays
var obstacles = [];
var gameObjects = [];

// Central hexagon
mainLayer.activate();
var hexCenter = new Path.RegularPolygon(view.center, 6, hexCenterSize);
var hexCenterRotation = 0;
hexCenter.rotate(30);
hexCenter.strokeColor = '#097B85';
hexCenter.strokeWidtion = 0;
gameObjects.push(hexCenter);

// Player arrow
var arrow = new Path.RegularPolygon(view.center, 3, arrowSize);
arrow.fillColor = '#1BBDCD';
arrow.translate(new Point(0, -hexCenterSize * arrowTranslationFactor));
gameObjects.push(arrow);
var arrowRotation = 270;

// Hitbox for gameover-checking
var hitbox = new Path.Circle(view.center, -hexCenterSize * arrowTranslationFactor - arrowSize-2/3);
hitbox.strokeColor = '#FF0000';
hitbox.opacity = 0;
gameObjects.push(hitbox);

// Score text
var scoreText = new PointText(new Point(view.viewSize) * scoreTextMarginSizeFactor);
scoreText.fillColor = '#191970';
scoreText.fontSize = 20;
scoreText.fontFamily = 'atomic-age';
// Best score text
var bestScoreText = new PointText(new Point(view.viewSize.width, view.viewSize.height*2) * scoreTextMarginSizeFactor);
bestScoreText.fillColor = '#191970';
bestScoreText.fontSize = 20;
bestScoreText.fontFamily = 'atomic-age';

// Mute button
var muteButton = new PointText(new Point(view.viewSize.width * (1 - scoreTextMarginSizeFactor), view.viewSize.height * scoreTextMarginSizeFactor));
muteButton.fillColor = '#191970';
muteButton.fontSize = 20;
muteButton.fontFamily = 'foundation-icons';
muteButton.content = "\uF211";

// Mouse
var mouseHideDelay = 90;
var mouseHideCpt = 0;

// Game vars
var bgRotateDirection = 1;
var arrowRotateSpeed = baseArrowRotateSpeed;
var obstacleSpeedFactor = baseObstacleSpeedFactor;
var bgRotateSpeed = baseBackgroundRotateSpeed;
var obstacleSpawnDelayFactor = baseObstacleSpawnDelayFactor;
var ingame = false;
var gameReady = false;
var startFrame = 0;
var endFrame = 0;
var bestScore = 0;
var musicHTMLElement = document.getElementById('music');

/*                                                                      ******************
                                                                        ON EVENT FUNCTIONS
                                                                        ******************
*/
function onFrame(event) {
    if (mouseHideCpt < mouseHideDelay) {
        mouseHideCpt++
    } else if (mouseHideCpt == mouseHideDelay) {
        document.getElementsByTagName('body')[0].className = "hiddenCursor";
    }
    if(enableBackgroundAnimation)
    {
      changeColor(event.count);
    }
    if (ingame) {
        alternateBgRotation();
        rotateObjects();
        translateObstacles();
        cleanupObstacles();
        detectCollisions();
        nextDifficulty++;
        displayScore(event.count - startFrame);
        if (!(nextDifficulty % parseInt(obstacleSpawnDelay / obstacleSpeed))) {
            generateObstaclePattern();
        }
        if (nextDifficulty == difficultyIncreaseDelay) {	
            increaseDifficulty(difficultyLevel++);
        }
    } else {
        manageGameScores(event);
    }
}

function onResize(event) {
    var newBaseSize = 2 * Math.min(view.center.x, view.center.y);
    var newBackgroundBaseSize = 2 * Math.max(view.center.x, view.center.y);
  
    translateObjects(view.center - oldOrigin);
    scaleObjects(newBaseSize / baseSize);
    background.scale(newBackgroundBaseSize / BackgroundBaseSize, [0, 0]);
    oldOrigin = view.center;
    baseSize = newBaseSize;
    BackgroundBaseSize = newBackgroundBaseSize;
  
    calculateResolutionDependentVariables(baseSize);
}

function onMouseMove(event) {
    if (event.event.webkitMovementX || event.event.webkitMovementY) {
        mouseHideCpt = 0;
        document.getElementsByTagName('body')[0].className = "";
    }
}

/*                                                                      *****************
                                                                        OBJECTS FUNCTIONS
                                                                        *****************
*/
function translateObjects(vector) {
    muteButton.translate(new Point(vector.x*2, 0));

    for (i in gameObjects.concat(obstacles)) {
        if (String(parseInt(i, 10)) === i && gameObjects.hasOwnProperty(i)) {
            gameObjects[i].translate(vector);
        }
    }
  
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            obstacles[i].translate(vector);
        }
    }
}

function rotateObjects() {
    hexCenter.rotate(bgRotateSpeed * bgRotateDirection);
    hexCenterRotation += bgRotateSpeed * bgRotateDirection;
    hexCenterRotation = hexCenterRotation % 360;
    if(ingame)
    {
        arrow.rotate(arrowRotateSpeed * arrowRotateDirection + bgRotateSpeed * bgRotateDirection, view.center);
        arrowRotation += arrowRotateSpeed * arrowRotateDirection + bgRotateSpeed * bgRotateDirection;
        arrowRotation = (arrowRotation+360) % 360;
    }
}

function translateObstacles() {
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            translateToCenter(obstacles[i], obstacleSpeed);
            obstacles[i].rotate(bgRotateSpeed * bgRotateDirection, view.center)
        }
    }
}

function scaleObjects(scale) {
    for (i in gameObjects) {
        if (String(parseInt(i, 10)) === i && gameObjects.hasOwnProperty(i)) {
            gameObjects[i].scale(scale, view.center);
        }
    }
  
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            obstacles[i].scale(scale, view.center);
        }
    }
}

/*                                                                      ***************
                                                                        SOUND FUNCTIONS
                                                                        ***************
*/
function toggleMute()
{
    if(musicHTMLElement.muted) {
        musicHTMLElement.muted = false;
        muteButton.content = "\uF211";
    } else {
        musicHTMLElement.muted = true;
        muteButton.content = "\uF20F";
    }
}

/*                                                                      *******************
                                                                        OBSTACLES FUNCTIONS
                                                                        *******************
*/
function createObstacle(angle) {
    var tan30 = Math.tan(Math.PI / 6);
    var obstacle = new Path({
        segments: [
            [tan30 * obstacleDistance, -obstacleDistance],
            [tan30 * (obstacleDistance - obstacleSize), -(obstacleDistance - obstacleSize)],
            [-tan30 * (obstacleDistance - obstacleSize), -(obstacleDistance - obstacleSize)],
            [-tan30 * obstacleDistance, -obstacleDistance]
        ],
        fillColor: '#097B85',
        closed: true
    });
    obstacle.translate(view.center);
    obstacle.rotate(angle, view.center);
    obstacles.push(obstacle);
}

function generateObstaclePattern() {
    var pattern = patterns[parseInt(Math.random() * patterns.length)];
    var patternAngle = parseInt(Math.random() * 6) * 60;
    for (i in pattern) {
        if (pattern[i]) {
            createObstacle(i * 60 + patternAngle + hexCenterRotation);
        }
    }
}

function cleanupObstacles() {
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            var path = obstacles[i];
            var translation = view.center - path.interiorPoint;
            var distanceToCenter = translation.length;
            if (distanceToCenter <= hexCenterSize) {
                obstacles.splice(i, 1);
                path.remove();
            }
        }
    }
}

function detectCollisions() {
    /*for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            var path = obstacles[i];
            var intersections = arrow.getIntersections(path);
            if (intersections.length > 0) {
                gameOver();
            }
        }
    }*/
    
    for(i in obstacles)
    {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i))
        {
            var path = obstacles[i];
            var intersections = hitbox.getIntersections(path);
            var instersectionAngles = [];
            for(j in intersections)
            {
                if (String(parseInt(j, 10)) === j && intersections.hasOwnProperty(j))
                {
                    instersectionAngles.push(new Point(intersections[j].point - view.center).angle);
                }
            }
            
            instersectionAngles.sort(function(a, b){return a-b});
            
            // Handle cases where bounds are of opposite sign
            for(j in instersectionAngles)
            {
                if (String(parseInt(j, 10)) === j && instersectionAngles.hasOwnProperty(j))
                {
                    instersectionAngles[j] = (instersectionAngles[j] + 360)%360;
                }
            }

            instersectionAngles.sort(function(a, b){return a-b});
               
            if((instersectionAngles[instersectionAngles.length - 1] 
                    - instersectionAngles[0] > 180) 
                ^ (arrowRotation > instersectionAngles[0] 
                    && arrowRotation < instersectionAngles[instersectionAngles.length - 1]))
            {
                gameOver();
            }
        }
    }
}

function clearObstacles() {
    for (i in obstacles) {
        obstacles[i].remove();
    }
    obstacles = [];
}

/*                                                                      ********************
                                                                        BACKGROUND FUNCTIONS
                                                                        ********************
*/
function alternateBgRotation() {
    if (!!cycleLength) {
        --cycleLength;
    } else {
        cycleLength = parseInt(Math.random() * (maxCycleLength - minCycleLength)) + minCycleLength;
        bgRotateDirection *= -1;
    }
}

function changeColor(frameIndex) {
    switch (difficultyLevel) {
        case 1:
            background.fillColor = background.fillColor + new Color(1,1,1) * colorChange * backgroundFlashSpeed;
            if (background.fillColor.gray <= 0.7 || background.fillColor.gray >= 0.95) {
                colorChange *= -1;
            }
            break;
        case 2:
            background.fillColor = background.fillColor + new Color(1,1,1) * colorChange * backgroundFlashSpeed;
            if (background.fillColor.gray <= 0.7 || background.fillColor.gray >= 0.95) {
                colorChange *= -1;
            }
            break;
        case 3:
            background.fillColor.hue += 360*backgroundFlashSpeed;
            break;
        case 4:
            if(!(frameIndex % 10)) {
                background.fillColor.hue += 5000*backgroundFlashSpeed;
            }
            break;
        case 5:
            if((frameIndex % 30) < 15) {
                background.fillColor = "#FFFFFF";
            } else {
                background.fillColor = "#000000";
            }
            break;
        case 6:
            if((frameIndex % 10) < 5) {
                background.fillColor = "#FFFFFF";
            } else {
                background.fillColor = "#000000";
            }
            break;
    } 
}

function initNewBackground() {
    switch (difficultyLevel) {
        case 1:
            background.fillColor = "#BBBBBB";
            break;
        case 2:
            background.fillColor = "#FFBE35";
            break;
        case 3:
            background.fillColor = "#A03030";
            break;
        case 4:
            background.fillcolor = "#A03030";
            break;
        default:
            background.fillColor = "#FFFFFF";
            break;
    }
}

/*                                                                      **********************
                                                                        GENERAL GAME FUNCTIONS
                                                                        **********************
*/
function gameOver() {
    gameReady = false;
    ingame = false;

    setTimeout(function () {
        gameReady = true
    }, gameOverTimeout);
}

function translateToCenter(path, pixels) {
    var translation = view.center - path.interiorPoint;
    var distanceToCenter = translation.length;
    translation /= distanceToCenter;
    translation *= pixels;
    path.scale((distanceToCenter - pixels) / distanceToCenter, view.center);
}

function newGame() {
    nextDifficulty = 0;
    difficultyLevel = 0;
    startFrame = -1;
    endFrame = 0;

    arrowRotateSpeed = baseArrowRotateSpeed;
    bgRotateSpeed = baseBackgroundRotateSpeed;
    obstacleSpeedFactor = baseObstacleSpeedFactor;
    obstacleSpawnDelayFactor = baseObstacleSpawnDelayFactor;
    obstacleSpeed = obstacleSpeedFactor * baseSize;

    clearObstacles();
    initNewBackground();
}

function displayScore(score) {
    scoreText.content = 'SCORE : ' + score.toString();
    if(score > bestScore) {
        bestScore = score;
        bestScoreText.content = 'BEST : ' + bestScore.toString();
    }
}

function manageGameScores(event) {
    if (!endFrame) {
        if (startFrame == -1) {
            startFrame = event.count;
            ingame = true;
        } else {
            endFrame = event.count;
            var score = endFrame - startFrame;
        }
    }
}

function calculateResolutionDependentVariables(size) {
    hexCenterSize = hexCenterSizeFactor * size;
    arrowSize = arrowSizeFactor * size;
    obstacleSpawnDelay = obstacleSpawnDelayFactor * size;

    obstacleDistance = obstacleDistanceFactor * size;
    obstacleSpeed = obstacleSpeedFactor * size;
    obstacleSize = obstacleSizeFactor * size;

    background.size = view.size;
    if(warningLayer.visible)
    {
      warningON.scaling = warningSizeFactor * size;
      warningON.position = view.center;
    
      warningOFF.scaling = warningSizeFactor * size;
      warningOFF.position = view.center;
    
      warningLayer.activate();
      okButton = new Path.Rectangle(new Point(view.center.x*4/3, view.center.y*5/4), new Point(view.center.x*2, view.center.y*2));
      okButton.fillColor = "#FF00FF";
      okButton.opacity = 0;
      
	  backgroundAnimationSwitch = new Path.Rectangle(new Point(view.center.x*2/3, view.center.y*5/4), new Point(view.center.x*4/3-10, view.center.y*2));
      backgroundAnimationSwitch.fillColor = "#FF00FF";
      backgroundAnimationSwitch.opacity = 0;
      
      mainLayer.activate();
    }
}

function increaseDifficulty(difficulty) {
    initNewBackground();
    nextDifficulty = 0;
    arrowRotateSpeed = (1 + difficulty * difficultyIncreaseFactor) * baseArrowRotateSpeed;
    bgRotateSpeed = (1 + difficulty * difficultyIncreaseFactor) * baseBackgroundRotateSpeed;
    obstacleSpeedFactor = (1 + difficulty * difficultyIncreaseFactor) * baseObstacleSpeedFactor;
    obstacleSpeed = obstacleSpeedFactor * baseSize;
    obstacleSpawnDelayFactor = (1 + difficulty * difficultyIncreaseFactor) * baseObstacleSpawnDelayFactor;
    obstacleSpeedFactor = ( 1 + difficulty * difficultyIncreaseFactor) * baseObstacleSpeedFactor;
}

/******************************************************/
/*                       Controls                     */
/******************************************************/

// Prevent right-click menu
document.body.oncontextmenu = function () {
    return false;
}

function onKeyDown(event) {
    if (!ingame && gameReady) {
        newGame();
    }

    switch (event.key) {
        //Fixme : won't handle both arrows pressed
        case 'left':
            event.preventDefault();
            arrowRotateDirection = -1;
            break;

        case 'right':
            event.preventDefault();
            arrowRotateDirection = 1;
            break;

        case 'up':
            event.preventDefault();
            break;

        case 'down':
            event.preventDefault();
            break;

        case 'space':
            event.preventDefault();
            clearObstacles();
            break;
    }
}


function onKeyUp(event) {
    switch (event.key) {
        case 'left':
            arrowRotateDirection = 0;
            break;

        case 'right':
            arrowRotateDirection = 0;
            break;

        //Fixme : won't handle both arrows pressed
    }
}

function onMouseDown(event) {
    if (muteButton.hitTest(event.point)) {
        toggleMute();
      return;
    }
  
  if(warningLayer.visible)
  {
    if(backgroundAnimationSwitch.hitTest(event.point))
    {
      enableBackgroundAnimation = !enableBackgroundAnimation;
      warningOFF.visible = !warningOFF.visible;
      warningON.visible = !warningON.visible;
    }
    
    if(okButton.hitTest(event.point))
    {
      warningLayer.visible = false;
      backgroundLayer.visible = true;
      mainLayer.visible = true;
        
      setTimeout(function () {
          gameReady = true;
          ingame = true;
    }, gameOverTimeout);
    }
  }
  
    switch(event.event.which) {
      case 1:
        event.preventDefault();
        arrowRotateDirection = -1;
        break;
        
      case 3:
        event.preventDefault();
        arrowRotateDirection = 1;
        break;
    }
}

function onMouseUp(event) {
    if (!ingame && gameReady) {
        newGame();
    }

    switch (event.event.which) {
        case 1:
            arrowRotateDirection = 0;
            break;

        case 3:
            arrowRotateDirection = 0;
        	break;
    }
}
