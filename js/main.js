
var program;
var gl;

var cx = 0.0;
var cy = 0.5;
var cz = 0.0;

var angle = 0.0;
var elevation = 0.0;
var roll = 0.0;
var delta = 0.3;

var perspectiveMatrix;
var viewMatrix;
var worldMatrix;
var viewWorldMatrix;
var projectionMatrix;

var furnituresConfig = new Map([
  ['bed', {
    initCoords: utils.MakeTranslateMatrix(- 1.0, 0.0, - 0.5),
    initScale: utils.MakeScaleMatrix(0.6),
    initRotation: utils.MakeRotateYMatrix(30),
  }]
]);

class Furniture {
  constructor(name, vertices, normals, indices, texturecoords) {
    this.name = name;
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
    this.texturecoords = texturecoords;
  }
};

var furnitures = new Map();

var positionAttributeLocation;
var uvAttributeLocation;
var matrixLocation;
var textLocation;

async function main() {

  getCanvas();

  loadModels();

  await initializeProgram();

  drawScene();
}

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
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(furniture.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(furniture.texturecoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(furniture.indices), gl.STATIC_DRAW);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    let image = new Image();
    image.src = "models/" + furniture.name + "/" + furniture.name + ".png";
    console.log(image);

    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    furniture.vao = vao;
    furniture.texture = texture;
  });
}

function putAttributesOnGPU() {

}

function loadModels() {
  furnituresConfig.forEach((furnitureConfig, furnitureName) => {
    loadModel(furnitureName, furnitureConfig);
  });
}

async function loadModel(furnitureName, furnitureConfig) {
  await utils.get_json("models/" + furnitureName + "/" + furnitureName + ".json",
    function (model) {
      furnitures.set(furnitureName, new Furniture(
        furnitureName,
        model.meshes[0].vertices,
        model.meshes[0].normals,
        [].concat.apply([], model.meshes[0].faces),
        model.meshes[0].texturecoords[0]
      ));

      furnitures.get(furnitureName).localMatrix = utils.multiplyMatrices(
        utils.multiplyMatrices(
          utils.multiplyMatrices(
            furnitureConfig.initCoords,
            furnitureConfig.initRotation
          ),
          furnitureConfig.initScale
        ),
        utils.identityMatrix
      );
      furnitures.get(furnitureName).worldMatrix
    });
}

function drawScene() {
  furnitures.forEach(furniture => {
    updateTransformationMatrices();
    bindVertexArray();
    sendUniformsToGPU();
    drawElements();

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(textLocation, 0);
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

window.onload = main;