/**
 * Main program function
 */
function main() {
	//Get canvas data
	canvas.getCanvas();

	//Load models
	models.loadModels();

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
	models.updateTransformationMatrices();
	
	//Send data to GLSL program
	shaders.bindVertexArray();
	shaders.sendUniformsToGpU();

	//Draw the objects
	shaders.drawObjects();

	//Draw every furniture 
	models.furnitures.forEach( (name, furniture) => {
		models.gl.drawElements(gl.TRIANGLES, furniture.indices.length, models.gl.UNSIGNED_SHORT, 0);
	});

	//Execute the function every frame
	window.requestAnimationFrame(drawScene);
}


//main function is the program entry point
window.onload = main;

//Set the Event handler for key pressed 
utils.initInteraction();