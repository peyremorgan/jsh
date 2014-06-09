/******************************************************/
/*                Graphics & Game Logic               */
/******************************************************/
// Speed parameters
var arrowRotateSpeed = 8;
var arrowRotateDirection = 0;
var bgRotateSpeed = 2.5;
var obstacleSpeedFactor = 0.005;
var gameOverTimeout = 500; // Unit : ms
// Cycles parameters
var cycleLength = 180;
var minCycleLength = 100;
var maxCycleLength = 160;
var obstacleSpawnDelay = 120;
// Resolution-dependent resizing parameters
var baseSize = 2 * Math.min(view.center.x, view.center.y);
var hexCenterSizeFactor = 0.05;
var arrowSizeFactor = 0.01;
var obstacleDistanceFactor = 0.4;
var arrowTranslationFactor = 1.4;
var scoreTextMarginSizeFactor = 0.05;
var oldOrigin = view.center;
// Obstacle generation parameters
var patterns = [
    [true, true, false, false, true, false],
    [true, false, true, false, true, false],
    [true, false, true, true, true, false],
    [true, true, true, true, true, false]
];

// Parameter-dependent variables
var obstacleDistance;
var obstacleSpeed;
calculateResolutionDependentVariables(baseSize);

// Game objects arrays
var obstacles = [];
var gameObjects = [];

// Central hexagon
var hexCenterSize = baseSize * hexCenterSizeFactor;
var hexCenter = new Path.RegularPolygon(view.center, 6, hexCenterSize);
hexCenter.rotate(30);
hexCenter.strokeColor = '#097B85';
hexCenter.strokeWidth = '2';
var hexCenterRotation = 0;
gameObjects.push(hexCenter);

// Player arrow
var arrowSize = baseSize * arrowSizeFactor;
var arrow = new Path.RegularPolygon(view.center, 3, arrowSize);
arrow.fillColor = '#1BBDCD';
arrow.translate(new Point(0, -hexCenterSize * arrowTranslationFactor));
gameObjects.push(arrow);

// Score text
var scoreText = new PointText(new Point(view.viewSize) * scoreTextMarginSizeFactor);
scoreText.fillColor = '#191970';
scoreText.fontSize = 20;
scoreText.fontFamily = 'atomic-age';

var bestScoreText = new PointText(new Point(view.viewSize.width, view.viewSize.height*2) * scoreTextMarginSizeFactor);
bestScoreText.fillColor = '#191970';
bestScoreText.fontSize = 20;
bestScoreText.fontFamily = 'atomic-age';

// Game vars
var bgRotateDirection = 1;
var ingame = true;
var gameReady = true;
var startFrame = 0;
var endFrame = 0;
var bestScore = 0;

function alternateBgRotation() {
    if (!!cycleLength) {
        --cycleLength;
    } else {
        cycleLength = parseInt(Math.random() * (maxCycleLength - minCycleLength)) + minCycleLength;
        bgRotateDirection *= -1;
    }
}

function rotateObjects() {
    hexCenter.rotate(bgRotateSpeed * bgRotateDirection);
    hexCenterRotation += bgRotateSpeed * bgRotateDirection;
    hexCenterRotation = hexCenterRotation % 360;
    arrow.rotate(arrowRotateSpeed * arrowRotateDirection + bgRotateSpeed * bgRotateDirection, view.center);
}

function translateObstacles() {
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            translateToCenter(obstacles[i], obstacleSpeed);
            obstacles[i].rotate(bgRotateSpeed * bgRotateDirection, view.center)
        }
    }
}

function createObstacle(angle) {
    var tan30 = Math.tan(Math.PI / 6);
    var obstacle = new Path({
        segments: [
            [tan30 * obstacleDistance, -obstacleDistance],
            [tan30 * (obstacleDistance - 15), -(obstacleDistance - 15)],
            [-tan30 * (obstacleDistance - 15), -(obstacleDistance - 15)],
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


function translateToCenter(path, pixels) {
    var translation = view.center - path.interiorPoint;
    var distanceToCenter = translation.length;
    translation /= distanceToCenter;
    translation *= pixels;
    path.scale((distanceToCenter - pixels) / distanceToCenter, view.center);
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


function gameOver() {
    gameReady = false;
    ingame = false;

    setTimeout(function () {
        gameReady = true
    }, gameOverTimeout);
}


function detectCollisions() {
    for (i in obstacles) {
        if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
            var path = obstacles[i];
            var intersections = arrow.getIntersections(path);

            if (intersections.length > 0) {
                gameOver();
            }
        }
    }
}

function onResize(event) {
    var newBaseSize = 2 * Math.min(view.center.x, view.center.y);

    translateObjects(view.center - oldOrigin);
    scaleObjects(newBaseSize / baseSize);
    oldOrigin = view.center;
    baseSize = newBaseSize;

    calculateResolutionDependentVariables(baseSize);
}

function translateObjects(vector) {
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

function onFrame(event) {
    if (ingame) {
        alternateBgRotation();
        rotateObjects();
        translateObstacles();
        cleanupObstacles();
        detectCollisions();
        displayScore(event.count - startFrame);
        if (!(event.count % parseInt(obstacleSpawnDelay / obstacleSpeed))) {
            generateObstaclePattern();
        }
    } else {
        manageGameScores(event);
    }
}

function newGame() {
    startFrame = -1;
    endFrame = 0;

    for (i in obstacles) {
        obstacles[i].remove();
    }
    obstacles = [];
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

            // Update best score
        }
    }
}

function calculateResolutionDependentVariables(size) {
    obstacleDistance = obstacleDistanceFactor * size;
    obstacleSpeed = obstacleSpeedFactor * size;
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

        break;

    case 'down':
        event.preventDefault();
        break;
        //Fixme : won't handle both arrows pressed
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