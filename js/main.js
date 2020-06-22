
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

var textureIndex = 0;

var furnituresConfig = new Map([
  // ['bed', {
  //   type: 'JSON',
  //   imageType: '.png',
  //   initCoords: utils.MakeTranslateMatrix(- 1.0, 0.0, - 0.5),
  //   initScale: utils.MakeScaleMatrix(0.6),
  //   initRotation: utils.MakeRotateYMatrix(30),
  //   textureNumber: 0,
  // }],
  ['Room', {
    type: 'JSON',
    initCoords: utils.MakeTranslateMatrix(0.0, 0.0, 0.0),
    initScale: utils.MakeScaleMatrix(1),
    initRotation: utils.MakeRotateYMatrix(0),
    textureNumber: 1,
  }],
]);

class Furniture {
  constructor() {
    this.components = [];
    this.children = [];
    this.localMatrix = utils.identityMatrix();
    this.worldMatrix = utils.identityMatrix();
  }
  setParent(parent) {
    // remove us from our parent
    if (this.parent) {
      var ndx = this.parent.children.indexOf(this);
      if (ndx >= 0) {
        this.parent.children.splice(ndx, 1);
      }
    }

    // Add us to our new parent
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent;
  };


  updateWorldMatrix(matrix) {
    this.components.forEach(component => {
      component.updateWorldMatrix(matrix);
    });
  }
}
class FurnitureComponent {
  // constructor(name, vertices, normals, indices, texturecoords) {
  //   this.name = name;
  //   this.vertices = vertices;
  //   this.normals = normals;
  //   this.indices = indices;
  //   this.texturecoords = texturecoords;

  //   this.children = [];
  //   this.localMatrix = utils.identityMatrix();
  //   this.worldMatrix = utils.identityMatrix();
  // }

  constructor() {

  }


  updateWorldMatrix(matrix) {
    if (matrix) {
      // a matrix was passed in so do the math
      this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
    } else {
      // no matrix was passed in so just copy.
      utils.copy(this.localMatrix, this.worldMatrix);
    }

    // now process all the children
    var worldMatrix = this.worldMatrix;
    this.children.forEach(function (child) {
      child.updateWorldMatrix(worldMatrix);
    });
  };

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
    furniture.components.forEach(component => {
      let vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(component.vertices), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

      uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(component.texturecoords), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(uvAttributeLocation);
      gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(component.indices), gl.STATIC_DRAW);

      component.vao = vao;

    });
  });
}

function putAttributesOnGPU() {

}

function loadModels() {
  furnituresConfig.forEach((furnitureConfig, furnitureName) => {
    console.log("LOAD");
    loadModel(furnitureName, furnitureConfig);
  });
}

async function loadModel(furnitureName, furnitureConfig) {
  // switch (furnitureConfig.type) {
  //   case 'JSON':
  //     console.log("JSON " + furnitureName);

  //     await utils.get_json("models/" + furnitureName + "/" + furnitureName + ".json",
  //       function (model) {


  //         furnitures.set(furnitureName, new Furniture(
  //           furnitureName,
  //           model.meshes[0].vertices,
  //           model.meshes[0].normals,
  //           [].concat.apply([], model.meshes[0].faces),
  //           model.meshes[0].texturecoords[0]
  //         ))
  //       });
  //     break;
  //   case 'OBJ':

  //     console.log("OBJ " + furnitureName);
  //     await utils.get_objstr("models/" + furnitureName + "/" + furnitureName + ".json",
  //       function (model) {
  //         let modelMesh = new OBJ.Mesh(model);
  //         console.log(model);
  //         console.log(modelMesh);
  //         console.log(modelMesh.vertices);


  //         furnitures.set(furnitureName, new Furniture(
  //           furnitureName,
  //           modelMesh.vertices,
  //           modelMesh.vertexNormals,
  //           modelMesh.indices,
  //           modelMesh.textures
  //         ))
  //       });
  //     break;
  // };

  let model;
  await utils.get_json("models/" + furnitureName + "/" + furnitureName + ".json",
    function (parsedModel) {
      model = parsedModel;

      // furnitures.set(furnitureName, new Furniture(
      //   furnitureName,
      //   parsedModel.meshes[0].vertices,
      //   parsedModel.meshes[0].normals,
      //   [].concat.apply([], parsedModel.meshes[0].faces),
      //   parsedModel.meshes[0].texturecoords[0]
      // ))
    });

  //Parse like hell
  furnitures.set(furnitureName, new Furniture());
  let furniture = furnitures.get(furnitureName);

  //local matrix of root object node
  furniture.localMatrix = model.rootnode.transformation;

  model.rootnode.children.forEach(parsedChildren => {
    let component = new FurnitureComponent();


    component.name = furnitureName;
    component.localMatrix = parsedChildren.transformation;
    component.vertices = model.meshes[parsedChildren.meshes].vertices;
    component.normals = model.meshes[parsedChildren.meshes].normals;
    component.indices = [].concat.apply([], model.meshes[parsedChildren.meshes].faces);
    //Get textures
    component.texturecoords = model.meshes[parsedChildren.meshes].texturecoords[0];
    console.log(model.meshes[parsedChildren.meshes].materialindex);

    model.materials[model.meshes[parsedChildren.meshes].materialindex].properties.forEach(materialProperty => {
      if (materialProperty.key == "$tex.file") {
        component.textureImageName = materialProperty.value;
        component.textureIndex = textureIndex;
        textureIndex++;
      }
    });

    console.log(component);


    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    let image = new Image();
    image.src = "models/" + component.name + "/" + component.textureImageName;
    console.log(image);

    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    component.texture = texture;


    furniture.components.push(component);
  });

  // furnitures.get(furnitureName).localMatrix = utils.multiplyMatrices(
  //   utils.multiplyMatrices(
  //     utils.multiplyMatrices(
  //       furnitureConfig.initCoords,
  //       furnitureConfig.initRotation
  //     ),
  //     furnitureConfig.initScale
  //   ),
  //   utils.identityMatrix
  // );

  //#TODO DEFINE WORLD MATRIX
}

function drawScene() {
  furnitures.forEach(furniture => {
    furniture.components.forEach(component => {

      updateTransformationMatrices();
      bindVertexArray();
      sendUniformsToGPU();
      drawElements();

      utils.resizeCanvasToDisplaySize(gl.canvas);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

      gl.activeTexture(gl.TEXTURE0 + component.textureIndex);
      //console.log("enabling " + component.textureIndex);
      

      gl.uniform1i(textLocation, 0);
      gl.bindVertexArray(component.vao);
      gl.drawElements(gl.TRIANGLES, component.indices.length, gl.UNSIGNED_SHORT, 0);
    });
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
window.onload = main;