var program;
var gl;
var shaderDir; 
var baseDir;
var susanModel;
var modelStr = 'models/bed/bed.json';
var modelTexture = 'models/bed/bed.png';

function main() {


    
    var lastUpdateTime = (new Date).getTime();
    
    var Rx = 0.0;
    var Ry = 0.0;
    var Rz = 0.0;
    var S  = 0.5;

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 1.0, 0.85, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    //###################################################################################
    //Here we extract the position of the vertices, the normals, the indices, and the uv coordinates
    var susanVertices = susanModel.meshes[0].vertices;
    var susanNormals = susanModel.meshes[0].normals;
    var susanIndices = [].concat.apply([], susanModel.meshes[0].faces);
    var susanTexCoords = susanModel.meshes[0].texturecoords[0];
    //###################################################################################

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");  
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");  
    var matrixLocation = gl.getUniformLocation(program, "matrix");  
    var textLocation = gl.getUniformLocation(program, "u_texture");

    var perspectiveMatrix = utils.MakePerspective(120, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix = utils.MakeView(1.5, 0.0, 3.0, 0.0, 0.0);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanTexCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(susanIndices), gl.STATIC_DRAW); 

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var image = new Image();
    image.src = baseDir+modelTexture;
    image.onload= function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    };
    
    drawScene();
    
    function animate(){
    var currentTime = (new Date).getTime();
    if(lastUpdateTime != null){
      var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000.0;
      Rx += deltaC;
      Ry -= deltaC;
      Rz += deltaC;    
    }
    worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, Rx, Ry, Rz, S);
    lastUpdateTime = currentTime;               
  }
    
    function drawScene() {
    animate();

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
    var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(textLocation, texture);

    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, susanIndices.length, gl.UNSIGNED_SHORT, 0 );

    window.requestAnimationFrame(drawScene);
  }
}

async function init(){

	canvas = getCanvas();

	await initializeProgram();

	await loadModels();
    
    main();
}

window.onload = init;

function getCanvas() {
	canvas = document.getElementById("main_canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
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
	shaderDir = baseDir+"shaders/";
	
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
      var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
      var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
      program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);
}

function getAttributeLocations(){

}

function getUniformLocations() {

}

function createVAOs() {

}

function putAttributesOnGPU(){

}

async function loadModels() {
	//###################################################################################
    //This loads the json model in the susanModel variable
    await utils.get_json(modelStr, function(loadedModel){susanModel = loadedModel;});
    //###################################################################################

}