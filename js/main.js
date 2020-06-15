/**
 * Canvas variables
 */
var canvas = document.getElementById("main_canvas"),
	canvasWidth = canvas.clientWidth,
	canvasHeigth = canvas.clientHeight,
	aspect = canvasWidth / canvasHeigth,
	gl;

/**
 * Main program function
 */
function main() {
	//Get canvas data
	canvas.getCanvas();

	//Initialize GLSL program
	shaders.initProgram();

	//Load models
	models.loadModels();

	//Draw the scene
	drawScene();

}

/**
 * Draw the scene fram
 */
function drawScene() {
	//Update objects matrices
	models.updateTransformationMatrices();
	
	//Send data to GLSL program
	shaders.bindVertexArray();
	shaders.sendUniformsToGpU();

	//Draw the objects
	shaders.drawObjects();

	//Execute the function every frame
	window.requestAnimationFrame(drawScene);
}

/**
 * Draw scene frame
 */
function drawScene() {
	//Move the camera
	camera.cameraMovement();
}

//main function is the program entry point
window.onload = main;

//Set the Event handler for key pressed
utils.initInteraction();
