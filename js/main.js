/**
 * Main program function
 */
function main() {

	//Get canvas data
	canvas.getCanvas();

	//Initialize GLSL program
	shaders.initProgram();

	//Draw the scene
	drawScene();

}

/**
 * Draw the scene fram
 */
function drawScene() {
	//Update objects matrices
	updateTransformationMatrices();
	
	//Send data to GLSL program
	shaders.bindVertexArray();
	shaders.sendUniformsToGpU();

	//Draw the objects
	shaders.drawObjects();

	//Execute the function every frame
	window.requestAnimationFrame(drawScene);
}

/**
 * Updates the object local and world matrices, the View and the perspetcive matrix
 */
function updateTransformationMatrices() {
	updateModels();
	updateView();
	updatePerspective();
}

/**
 * Update local and world matrices
 */
function updateModels() {
	//#TODO
}

/**
 * Update view matrix
 */
function updateView() {
	//#TODO
}

/**
 * Update perspective matrix
 */
function updatePerspective() {
	//#TODO
}


//main function is the program entry point
window.onload = main;

//Set the Event handler for key pressed 
utils.initInteraction();