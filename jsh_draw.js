// Prevent right-click menu
document.body.oncontextmenu = function(){return false;}

var sides = 3;
var radius = 7;
var center = view.center;
var arrow = new Path.RegularPolygon(center, sides, radius);
arrow.fillColor = '#1BBDCD';

var rotateSpeed = 3;
var rotateDirection = 0;

function onResize(event) {
  // Whenevr the window is resized, recenter the path:
  arrow.position = view.center;
  arrow.translate(new Point(0,view.center.y/-5));
}

function onFrame(event) {
  arrow.rotate(rotateSpeed*rotateDirection, view.center);
}

function onKeyDown(event) {
	switch(event.key)
    {
      case 'left':
  		event.preventDefault();
        rotateDirection = -1;
        break;
        
      case 'right':
  		event.preventDefault();
        rotateDirection = 1;
        break;
        
        //Fixme : won't handle both arrows pressed
    }
}

function onKeyUp(event) {
  
  switch(event.key)
    {
      case 'left':
        rotateDirection = 0;
        break;
        
      case 'right':
        rotateDirection = 0;
        break;
        
        //Fixme : won't handle both arrows pressed
    }
  
}