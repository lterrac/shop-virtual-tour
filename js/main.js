// var shaderDir;
// var baseDir;
// var susanModel;
// var modelStr = 'models/bed/bed.json';
// var modelTexture = 'models/bed/bed.png';

var program;
var gl;

// control vars camera movement
var cx = 0.0;
var cy = 0.0;
var cz = 0.0;

var angle = 0.0;
var elevation = 0.0;
var delta = 0.3;

//control vars lights
var ambientON = true;
var directON = true;
var pointLightON = true;
var dirLightAlpha = -utils.degToRad(270);
var dirLightBeta  = -utils.degToRad(270);

//lights
//ambient light
var ambientLightColor = [80/255, 80/255, 80/255, 1.0];
//point light
var pointLightColor = [255/255, 244/255, 229/255, 1.0];
var pointLightPosition = [2.0, 0.0, 0.0];
var pointLightDecay = 1.0;
var pointLightTarget = 10.0;
//direct light
var dirLightColor = [0.9, 1.0, 1.0, 1.0];
var dirLightDirection = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
	Math.sin(dirLightAlpha),
	Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
	];

var diffuseLightColor = [230/255, 230/255 ,230/255, 1.0];
var specularLightColor = [255/255, 255/255, 255/255, 1.0];

var mixTextureColor = 0.9;


var perspectiveMatrix;
var viewMatrix;
var worldMatrix;
var viewWorldMatrix;
var projectionMatrix;
var normalMatrix;

var furnituresNames = [
	'bed'
];

var furnitures = new Map();
var shaders = new Map();
var currentShader;

var positionAttributeLocation;
var normalAttributeLocation;
var uvAttributeLocation;
var matrixLocation;
var worldMatrixLocation;
var textLocation;
var normalMatrixPositionHandle;
//lights
var ambientLightHandle;
var diffuseLightHandle;
var specularLightHandle;
var mixTextureHandle;
var pointLightPositionHandle;
var pointLightColorHandle;
var dirLightDirectionHandle;
var dirLightColorHandle;
var pointLightDecayHandle;
var pointLightTargetHandle;

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

	//static texture
	shaders.set('static', {});
	shaders.get('static').vs = shaderDir + 'vs.glsl';
	shaders.get('static').fs = shaderDir + 'fs.glsl';
	//direct light
	shaders.set('lambAmb', {});
	shaders.get('lambAmb').vs = shaderDir + 'lambAmb_vs.glsl';
	shaders.get('lambAmb').fs = shaderDir + 'lambAmb_fs.glsl';


	currentShader = 'lambAmb';

	await utils.loadFiles([shaders.get(currentShader).vs, shaders.get(currentShader).fs], function (shaderText) {
		var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
		var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
		program = utils.createProgram(gl, vertexShader, fragmentShader);

	});
	gl.useProgram(program);
}

function getAttributeLocations() {
	positionAttributeLocation = gl.getAttribLocation(program, "in_position");
	normalAttributeLocation = gl.getAttribLocation(program, "in_normal");
	uvAttributeLocation = gl.getAttribLocation(program, "in_uv");
}

function getUniformLocations() {
	matrixLocation = gl.getUniformLocation(program, "pMatrix");
	worldMatrixLocation = gl.getUniformLocation(program, "wMatrix");
	textLocation = gl.getUniformLocation(program, "u_texture");
	normalMatrixPositionHandle = gl.getUniformLocation(program,'nMatrix');
	//lights uniforms
	ambientLightHandle = gl.getUniformLocation(program,'ambientLightColor');
	diffuseLightHandle = gl.getUniformLocation(program,'diffuseLightColor');
	specularLightHandle = gl.getUniformLocation(program,'specularLightColor');
	mixTextureHandle = gl.getUniformLocation(program,'mix_texture');

	dirLightDirectionHandle = gl.getUniformLocation(program, 'dirLightDirection');
	dirLightColorHandle = gl.getUniformLocation(program, 'dirLightColor');
	pointLightColorHandle = gl.getUniformLocation(program, 'pointLightColor');
	pointLightPositionHandle = gl.getUniformLocation(program, 'pointLightPos');
	pointLightTarget = gl.getUniformLocation(program, 'pointLightTarget');
	pointLightDecayHandle = gl.getUniformLocation(program, 'pointLightDecay');


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

		var normalBuffer = gl.createBuffer();
  		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(furniture.normals), gl.STATIC_DRAW);
  		gl.enableVertexAttribArray(normalAttributeLocation);
  		gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);


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
			furnitures.get(furniture).texturecoords = model.meshes[0].texturecoords[0];

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
		
		//projection matrix
		gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
		//normal matrix
		gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
		//world matrix
		gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, utils.transposeMatrix(worldMatrix));
		//ambient light
		gl.uniform4fv(ambientLightHandle,  ambientLightColor);
		//brdf
		gl.uniform4fv(diffuseLightHandle,  diffuseLightColor);
		gl.uniform4fv(specularLightHandle,  specularLightColor);
		gl.uniform1f(mixTextureHandle, mixTextureColor);
		//directional light
		gl.uniform4fv(dirLightColorHandle,  dirLightColor);
		gl.uniform3fv(dirLightDirectionHandle,  dirLightDirection);
		//point light
		gl.uniform4fv(pointLightColorHandle,pointLightColor);
		gl.uniform3fv(pointLightPositionHandle,pointLightPosition);  
		gl.uniform1f(pointLightDecayHandle,pointLightDecay);
		gl.uniform1f(pointLightTargetHandle,pointLightTarget);



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
	normalMatrix = utils.invertMatrix(utils.transposeMatrix(worldMatrix));

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