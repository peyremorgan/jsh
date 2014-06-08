// Create a circle shaped path with its center at the center
// of the view and a radius of 30:
var center = new Point(50, 50);
var sides = 3;
var radius = 40;
var triangle = new Path.RegularPolygon(center, sides, radius);
triangle.fillColor = '#1BBDCD';

function onResize(event) {
	// Whenever the window is resized, recenter the path:
	triangle.position = view.center;
}