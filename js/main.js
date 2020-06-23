// var shaderDir;
// var baseDir;
// var susanModel;
// var modelStr = 'models/bed/bed.json';
// var modelTexture = 'models/bed/bed.png';

var program;
var gl;

// control vars camera movement
var cx = 0.5;
var cy = 2.0;
var cz = 1.0;

var angle = 0.0;
var elevation = -10.0;
var delta = 0.3;

//control vars lights
var ambientON;
var directON;
var pointLightON;
var numOfSpotlights;
var specularType;
var dirLightAlpha;
var dirLightBeta;

//lights
//ambient light
var ambientLightColor;
//point light
var pointLightColor;
var pointLightPosition;
var pointLightDecay;
var pointLightTarget;
//spot lights
var spotlights = new Map();
//direct light
var dirLightColor;
var dirLightDirection;


var diffuseLightColor;
var specularLightColor;
var specShine;

var mixTextureColor;


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
var eyePosHandle;
//lights
var specularTypeHandle;
var ambientLightHandle;
var diffuseLightHandle;
var specularLightHandle;
var specShineHandle;
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

	initParams();

	await compileAndLinkShaders();

	getAttributeLocations();

	getUniformLocations();

	createVAOs();

	putAttributesOnGPU();
}

function initParams(){
	//control vars lights
	specularType = [1, 0];
	ambientON = true;
	directON = true;
	pointLightON = true;
	numOfSpotlights = 1;
	dirLightAlpha = -utils.degToRad(270);
	dirLightBeta  = -utils.degToRad(270);

	//lights
	//ambient light
	ambientLightColor = [50/255, 50/255, 50/255, 1.0];
	//point light
	pointLightColor = [254/255, 244/255, 229/255, 1.0];
	pointLightPosition = [-0.1, 1.0, 2.0];
	pointLightDecay = 1.0;
	pointLightTarget = 1.0;
	//spot lights
	spotlights = new Map();
	for(i=0; i<numOfSpotlights;i++){
		spotlights.set('spotLight'+i,{});
		spotlights.get('spotLight'+i).name = 'spotLight'+i;
		spotlights.get('spotLight'+i).color = [230/255, 230/255 ,230/255, 1.0];
		spotlights.get('spotLight'+i).position = [1.0, 1.0, 0.0];
		spotlights.get('spotLight'+i).direction = [1.0, 0.1, 0.1];
		spotlights.get('spotLight'+i).decay = 1.0;
		spotlights.get('spotLight'+i).target = 1.0;
		spotlights.get('spotLight'+i).coneIn = 30.0;
		spotlights.get('spotLight'+i).coneOut = 60.0;
		spotlights.get('spotLight'+i).On = true;

	}
	//direct light
	dirLightColor = [0.9, 1.0, 1.0, 1.0];
	dirLightDirection = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
		Math.sin(dirLightAlpha),
		Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
	];


	diffuseLightColor = [230/255, 230/255 ,230/255, 1.0]; //warm white
	specularLightColor = [250/255, 250/255, 250/255, 1.0]; //white
	specShine = 100.0;

	mixTextureColor = 0.9; //percentage of texture color in the final projection

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
	eyePosHandle = gl.getUniformLocation(program,'eyePos');
	//lights uniforms
	ambientLightHandle = gl.getUniformLocation(program,'ambientLightColor');
	diffuseLightHandle = gl.getUniformLocation(program,'diffuseLightColor');
	specularLightHandle = gl.getUniformLocation(program,'specularLightColor');
	specShineHandle = gl.getUniformLocation(program, 'specShine');
	specularTypeHandle = gl.getUniformLocation(program, 'specularType');
	mixTextureHandle = gl.getUniformLocation(program,'mix_texture');

	dirLightDirectionHandle = gl.getUniformLocation(program, 'dirLightDirection');
	dirLightColorHandle = gl.getUniformLocation(program, 'dirLightColor');
	pointLightColorHandle = gl.getUniformLocation(program, 'pointLightColor');
	pointLightPositionHandle = gl.getUniformLocation(program, 'pointLightPos');
	pointLightTargetHandle = gl.getUniformLocation(program, 'pointLightTarget');
	pointLightDecayHandle = gl.getUniformLocation(program, 'pointLightDecay');
	spotlights.forEach(spotlight => {
		var name = spotlight.name;
		spotlight.colorHandle = gl.getUniformLocation(program, name+'Color');
		spotlight.positionHandle = gl.getUniformLocation(program, name+'Pos');
		spotlight.directionHandle = gl.getUniformLocation(program, name+'Dir');
		spotlight.decayHandle = gl.getUniformLocation(program, name+'Decay');
		spotlight.targetHandle = gl.getUniformLocation(program, name+'Target');
		spotlight.coneInHandle = gl.getUniformLocation(program, name+'ConeIn');
		spotlight.coneOutHandle = gl.getUniformLocation(program, name+'ConeOut');

	});


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

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(textLocation, furniture.texture);

		gl.bindVertexArray(furniture.vao);
		gl.drawElements(gl.TRIANGLES, furniture.indices.length, gl.UNSIGNED_SHORT, 0);
		
	});

	gl.uniform3fv(eyePosHandle,[cx,cy,cz]);
	//ambient light
	gl.uniform4fv(ambientLightHandle, ambientLightColor);
	//brdf
	gl.uniform4fv(diffuseLightHandle, diffuseLightColor);
	gl.uniform4fv(specularLightHandle, specularLightColor);
	gl.uniform1f(specShineHandle, specShine);
	gl.uniform1f(mixTextureHandle, mixTextureColor);
	gl.uniform2fv(specularTypeHandle,specularType);
	//directional light
	gl.uniform4fv(dirLightColorHandle, dirLightColor);
	gl.uniform3fv(dirLightDirectionHandle, dirLightDirection);
	//point light
	gl.uniform4fv(pointLightColorHandle, pointLightColor);
	gl.uniform3fv(pointLightPositionHandle, pointLightPosition);
	gl.uniform1f(pointLightDecayHandle, pointLightDecay);
	gl.uniform1f(pointLightTargetHandle, pointLightTarget);
	//spotlights
	for(i=0; i < numOfSpotlights; i++){
		var spotlight = spotlights.get('spotLight'+i);
		gl.uniform4fv(spotlight.colorHandle, spotlight.color);
		gl.uniform3fv(spotlight.positionHandle, spotlight.position);
		gl.uniform3fv(spotlight.directionHandle, spotlight.direction);
		gl.uniform1f(spotlight.decayHandle, spotlight.decay);
		gl.uniform1f(spotlight.targetHandle, spotlight.target);
		gl.uniform1f(spotlight.coneInHandle, spotlight.coneIn);
		gl.uniform1f(spotlight.coneOutHandle, spotlight.coneOut);
	}

	window.requestAnimationFrame(drawScene);
}

function updateTransformationMatrices() {

	updateView();
	updatePerspective();

	viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
	projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
}

function updateView() {

	worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
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