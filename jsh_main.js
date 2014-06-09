/******************************************************/
/*                      Graphics                      */
/******************************************************/

// Parameters
var arrowRotateSpeed = 4;
var arrowRotateDirection = 0;
var arrowSizeFactor = 0.01;
var bgRotateSpeed = 2.5;
var bgRotateDirection = 1;
var obstacleSpeed = 1;
var hexCenterSizeFactor = 0.05;
var cycleLength = 180;
var minCycleLength = 100;
var maxCycleLength = 160;
var obstacleSpawnDelay = 90;
var patterns = [[true, true, false, false, true, false],
                [true, false, true, false, true, false],
                [true, false, true, true, true, false],
                [true, true, true, true, true, false]];

// Player arrow
var arrowSize = view.center.x * arrowSizeFactor;
var arrow = new Path.RegularPolygon(view.center, 3, arrowSize);
arrow.fillColor = '#1BBDCD';
arrow.translate(new Point(0, view.center.y / -5));

// Central hexagon
var hexCenterSize = view.center.x * hexCenterSizeFactor;
var hexCenter = new Path.RegularPolygon(view.center, 6, hexCenterSize);
hexCenter.rotate(30);
hexCenter.strokeColor = '#097B85';
hexCenter.strokeWidth = '2';
var hexCenterRotation = 0;

// Obstacles array
var obstacles = [];

// Game vars
var ingame = true;
var endFrame = 0;
var scoreBanner;

function alternateBgRotation() {
  if (!!cycleLength) {
      --cycleLength;
  } else {
    cycleLength = parseInt(Math.random()*(maxCycleLength-minCycleLength)) + minCycleLength;
    bgRotateDirection *= -1;
  }  
}


function rotateObjects()
{
  hexCenter.rotate(bgRotateSpeed * bgRotateDirection);
  hexCenterRotation += bgRotateSpeed * bgRotateDirection;
  hexCenterRotation = hexCenterRotation % 360;
  arrow.rotate(arrowRotateSpeed * arrowRotateDirection + bgRotateSpeed*bgRotateDirection, view.center);
}



function translateObstacles()
{
  for (i in obstacles) {
    if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
      translateToCenter(obstacles[i], obstacleSpeed);
      obstacles[i].rotate(bgRotateSpeed*bgRotateDirection, view.center)
    }
  }
}


function createObstacle(angle) {
  var tan30 = Math.tan(Math.PI/6);
  var obstacle = new Path({
    segments: [[tan30*200, -200], [tan30*185, -185], [-tan30*185, -185], [-tan30*200, -200]],
    fillColor: '#097B85',
    closed: true
  });
  obstacle.translate(view.center);
  obstacle.rotate(angle, view.center);
  
  obstacles.push(obstacle);
}


function generateObstaclePattern() {
  var pattern = patterns[parseInt(Math.random()*patterns.length)];
  var patternAngle = parseInt(Math.random()*6)*60;
  
  for (i in pattern) {
    if (pattern[i]) {
      createObstacle(i*60 + patternAngle + hexCenterRotation);
    }
  }
}


function translateToCenter(path, pixels) {
  var translation = view.center-path.interiorPoint;
  var distanceToCenter = translation.length;
  translation /= distanceToCenter;
  translation *= pixels;
  path.scale((distanceToCenter-pixels)/distanceToCenter, view.center);
}


function cleanupObstacles() {
  for(i in obstacles) {
    if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
      var path = obstacles[i];
      var translation = view.center-path.interiorPoint;
      var distanceToCenter = translation.length;
      if(distanceToCenter <= hexCenterSize) {
        obstacles.splice(i,1);
        path.remove();
      }
  	}
  }
}


function gameOver() {
  ingame = false;
}


function detectCollisions() {
  for(i in obstacles) {
    if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
      var path = obstacles[i];
      var intersections = arrow.getIntersections(path);
      
      if (intersections.length > 0) {
        gameOver();
      }
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
    if(!(event.count%obstacleSpawnDelay)) {generateObstaclePattern();}
  } else {
    if(!endFrame) {
        endFrame = event.count;
        
        var scorebanner = centeredRectangle(view.center, new Point(view.center.x*2/3,view.center.y/3));
        scorebanner.fillColor = '#F8F8FF';
        scorebanner.strokeColor = '#A6120A';
        console.log(scorebanner);
        var scoreText = new PointText(scorebanner.getNearestPoint(new Point(0,0)) * 1.22)
        scoreText.fillColor = '#191970';
        scoreText.fontSize = view.center.y/13;
        scoreText.fontFamiliy = 'Montserrat';
        scoreText.content = 'Score : '+endFrame.toString();
    }
  }
}

function centeredRectangle(origin, dimensions) {
  return new Path.Rectangle({x:origin.x-dimensions.x/2, y:origin.y-dimensions.y/2, width:dimensions.x, height:dimensions.y});
}


function newGame() {
    for (i in obstacles) {
        obstacles[i].remove();
    }
    obstacles = [];
    
    scoreBanner.remove();
}

/******************************************************/
/*                       Controls                     */
/******************************************************/

// Prevent right-click menu
document.body.oncontextmenu = function(){return false;}


function onKeyDown(event) {
	switch(event.key) {
      case 'left':
  		event.preventDefault();
        arrowRotateDirection = -1;
        break;
        
      case 'right':
  		event.preventDefault();
        arrowRotateDirection = 1;
        break;
        
      default :
        if (!ingame) {
          newGame();
        }
        break;
      //Fixme : won't handle both arrows pressed
    }
}


function onKeyUp(event) {
  
  switch(event.key)
    {
      case 'left':
        arrowRotateDirection = 0;
        break;
        
      case 'right':
        arrowRotateDirection = 0;
        break;
        
      //Fixme : won't handle both arrows pressed
    }
  
}