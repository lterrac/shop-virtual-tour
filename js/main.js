// var shaderDir;
// var baseDir;
// var susanModel;
// var modelStr = 'models/bed/bed.json';
// var modelTexture = 'models/bed/bed.png';

var program;
var gl;

var cx = 0.0;
var cy = 0.0;
var cz = 0.0;

var angle = 0.0;
var elevation = 0.0;
var delta = 0.3;

var perspectiveMatrix;
var viewMatrix;
var worldMatrix;
var viewWorldMatrix;
var projectionMatrix;

var furnituresNames = [
	'bed'
];

var furnitures = new Map();

var positionAttributeLocation;
var uvAttributeLocation;
var matrixLocation;
var textLocation;

async function main() {

	canvas = getCanvas();

	loadModels();

	await initializeProgram();

	drawScene();
}

window.onload = main;

function getCanvas() {
	canvas = document.getElementById("main_canvas");
	gl = canvas.getContext("webgl2");
	if (!gl) {
		document.write("GL context not opened");
		return;
	}

	utils.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0.85, 1.0, 0.85, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
}

async function initializeProgram() {

	await compileAndLinkShaders();

	getAttributeLocations();

	getUniformLocations();

	createVAOs();

	putAttributesOnGPU();
}

async function compileAndLinkShaders() {
	var path = window.location.pathname;
	var page = path.split("/").pop();
	baseDir = window.location.href.replace(page, '');
	shaderDir = baseDir + "shaders/";

	await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
		var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
		var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
		program = utils.createProgram(gl, vertexShader, fragmentShader);

	});
	gl.useProgram(program);
}

function getAttributeLocations() {
	positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
}

function getUniformLocations() {
	matrixLocation = gl.getUniformLocation(program, "matrix");
	textLocation = gl.getUniformLocation(program, "u_texture");
}

function createVAOs() {
	furnitures.forEach(furniture => {
		furniture.vao = gl.createVertexArray();
		var vao = furniture.vao;
		gl.bindVertexArray(vao);

		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(furniture.vertices), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

		var uvBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(furniture.texturecoords), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(uvAttributeLocation);
		gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

		var indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(furniture.indices), gl.STATIC_DRAW);
	});
}

function putAttributesOnGPU() {

}

function loadModels() {
	furnituresNames.forEach(furniture => {
		loadModel(furniture);
	});
}

async function loadModel(furniture) {
	await utils.get_json("models/" + furniture + "/" + furniture + ".json",
		function (model) {
			furnitures.set(furniture, {});
			furnitures.get(furniture).name = furniture;
			furnitures.get(furniture).vertices = model.meshes[0].vertices;
			furnitures.get(furniture).normals = model.meshes[0].normals;
			furnitures.get(furniture).indices = [].concat.apply([], model.meshes[0].faces);
			furnitures.get(furniture).texturecoords = model.meshes[0].texturecoords;

			furnitures.get(furniture).texture = gl.createTexture();
			var texture = furnitures.get(furniture).texture;
			gl.bindTexture(gl.TEXTURE_2D, texture);

			var image = new Image();
			image.src = "models/" + furniture + "/" + furniture + ".png";
			image.onload = function () {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.generateMipmap(gl.TEXTURE_2D);
			};
		});
}

function drawScene() {
	furnitures.forEach(furniture => {
		updateTransformationMatrices();
		bindVertexArray();
		sendUniformsToGPU();
		drawElements();

		utils.resizeCanvasToDisplaySize(gl.canvas);
		gl.clearColor(0.85, 0.85, 0.85, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(textLocation, furniture.texture);

		gl.bindVertexArray(furniture.vao);
		gl.drawElements(gl.TRIANGLES, furniture.indices.length, gl.UNSIGNED_SHORT, 0);
	});

	window.requestAnimationFrame(drawScene);
}

function updateTransformationMatrices() {

	updateView();
	updatePerspective();

	viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
	projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
}

function updateView() {

	worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5);
	viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);

}

function updatePerspective() {

	perspectiveMatrix = utils.MakePerspective(120, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
}

function bindVertexArray() {

}
function sendUniformsToGPU() {

}
function drawElements() {

}


utils.initInteraction();