/**
 * Main program function
 */
async function main() {
	//Get canvas data
	canvas.initialize();
	canvas.getCanvas();

	//Load models
	models.loadModels();

	//Initialize GLSL program
	await shadersGLSL.initialize();
	
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
	shadersGLSL.bindVertexArray();
	shadersGLSL.sendUniformsToGpU();

	//Draw the objects
	shadersGLSL.drawObjects();

	//Draw every furniture 
	models.furnitures.forEach( furniture => {
		models.gl.drawElements(models.gl.TRIANGLES, furniture.indices.length, models.gl.UNSIGNED_SHORT, 0);
	});

	//Execute the function every frame
	window.requestAnimationFrame(drawScene);
}


//main function is the program entry point
window.onload = main;

//Set the Event handler for key pressed 
utils.initInteraction();