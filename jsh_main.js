/******************************************************/
/*                      Graphics                      */
/******************************************************/

// Parameters
var arrowRotateSpeed = 3;
var arrowRotateDirection = 0;
var arrowSizeFactor = .01;
var bgRotateSpeed = 2.5;
var bgRotateDirection = 1;
var obstacleSpeed = 1;
var hexCenterSizeFactor = 0.05;
var cycleLength = 180;
var minCycleLength = 100;
var maxCycleLength = 160;

var arrowSize = view.center.x*arrowSizeFactor;
var arrow = new Path.RegularPolygon(view.center, 3, arrowSize);
arrow.fillColor = '#1BBDCD';
arrow.translate(new Point(0,view.center.y/-5));

var hexCenterSize = view.center.x*hexCenterSizeFactor;
var hexCenter = new Path.RegularPolygon(view.center, 6, hexCenterSize);
hexCenter.rotate(30);
hexCenter.strokeColor = '#097B85';
hexCenter.strokeWidth = '2';

var obstacles = [];
obstacles.push(createObstacle());

function onFrame(event) {
  if(!!cycleLength) {
    --cycleLength;
  } else {
    cycleLength = parseInt(Math.random()*(maxCycleLength-minCycleLength)) + minCycleLength;
    bgRotateDirection *= -1;
  }
  
  hexCenter.rotate(bgRotateSpeed*bgRotateDirection);
  arrow.rotate(arrowRotateSpeed*arrowRotateDirection + bgRotateSpeed*bgRotateDirection, view.center);
  
  for (i in obstacles) {
    if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
      translateToCenter(obstacles[i], obstacleSpeed);
      obstacles[i].rotate(bgRotateSpeed*bgRotateDirection, view.center)
    }
  }
  
  cleanupObstacles(obstacles);
}

function createObstacle() {
  var tan30 = Math.tan(Math.PI/6);
  var obstacle = new Path({
    segments: [[tan30*200, -200], [tan30*185, -185], [-tan30*185, -185], [-tan30*200, -200]],
    fillColor: '#097B85',
    closed: true
  });
  obstacle.translate(view.center);
  
  return obstacle;
}

function translateToCenter(path, pixels)
{
  var translation = view.center-path.interiorPoint;
  var distanceToCenter = translation.length;
  translation /= distanceToCenter;
  translation *= pixels;
  path.scale((distanceToCenter-pixels)/distanceToCenter, view.center);
}

function cleanupObstacles(obstaclesArray)
{
  if (String(parseInt(i, 10)) === i && obstacles.hasOwnProperty(i)) {
      var path = obstacles[i];

      var translation = view.center-path.interiorPoint;
      var distanceToCenter = translation.length;
      if(distanceToCenter <= hexCenterSize)
      {
          obstacles.splice(i,1);
          path.remove();
        console.log(obstacles);
      }
  }
}

/******************************************************/
/*                       Controls                     */
/******************************************************/

// Prevent right-click menu
document.body.oncontextmenu = function(){return false;}

function onKeyDown(event) {
	switch(event.key)
    {
      case 'left':
  		event.preventDefault();
        arrowRotateDirection = -1;
        break;
        
      case 'right':
  		event.preventDefault();
        arrowRotateDirection = 1;
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