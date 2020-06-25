/**
 * GLSL reference and program
 */
var program;
var gl;

/**
 * Camera coordinates
 */
var cx = 0.0;
var cy = 0.5;
var cz = 0.0;

/**
 * Camera angles
 */
var angle = 0.0;
var elevation = 0.0;
var roll = 0.0;

/**
 * Angular delta for camera
 */
var delta = 0.3;

var perspectiveMatrix;
var viewMatrix;
var worldMatrix;
var viewWorldMatrix;
var projectionMatrix;

/**
 * Shader handlers
 */
var positionAttributeLocation;
var uvAttributeLocation;
var matrixLocation;
var textLocation;


/**
 * Furnitures initial configuration
 */
var furnituresConfig = [
    {
        name: 'bed',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(- 1.0, 0.0, - 0.5),
        initScale: utils.MakeScaleMatrix(0.6),
        initRotation: utils.MakeRotateYMatrix(30),
    },
    {
        name: 'bed_2',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(- 3.0, 1.0, - 2.5),
        initScale: utils.MakeScaleMatrix(0.6),
        initRotation: utils.MakeRotateYMatrix(30),
    },
    {
        name: 'closet',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(3.0, 1.0, - 2.5),
        initScale: utils.MakeScaleMatrix(0.6),
        initRotation: utils.MakeRotateYMatrix(30),
    },
    // {
    //     name: 'chair',
    //     type: 'JSON',
    //     imageType: '.png',
    //     initCoords: utils.MakeTranslateMatrix( 3.0, 1.0, - 2.5),
    //     initScale: utils.MakeScaleMatrix(0.6),
    //     initRotation: utils.MakeRotateYMatrix(30),
    // },
    {
        name: 'Room',
        type: 'JSON',
        initCoords: utils.MakeTranslateMatrix(0.0, 0.0, 0.0),
        initScale: utils.MakeScaleMatrix(1),
        initRotation: utils.MakeRotateYMatrix(0),
    },
    // ['Desk', {
    //     type: 'JSON',
    //     initCoords: utils.MakeTranslateMatrix(0.0, 0.0, 0.0),
    //     initScale: utils.MakeScaleMatrix(1),
    //     initRotation: utils.MakeRotateYMatrix(0),
    // }],
];

/**
 * A furniture has components (parts to render) and children (compose the scene graph)
 */
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

/**
 * Map containing all the scene furnitures
 */
var furnitures = new Map();

/**
 * Initialize the program and start drawing the scene
 */
async function main() {
    console.log("start program");

    getCanvas();

    await initializeProgram();

    await loadModels();

    console.log("FURNITURES");
    console.log(furnitures);


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

    console.log("canvas configured");

}

async function initializeProgram() {
    console.log("init webgl program");

    await compileAndLinkShaders();

    getAttributeLocations();

    getUniformLocations();
}

async function compileAndLinkShaders() {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "shaders/";

    //Load, compile and link shaders
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        program = utils.createAndCompileShaders(gl, shaderText);
    });
    gl.useProgram(program);
    console.log("compiled shaders");
}

function getAttributeLocations() {
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    console.log("set shaders attribute handlers");
}

function getUniformLocations() {
    matrixLocation = gl.getUniformLocation(program, "matrix");
    textLocation = gl.getUniformLocation(program, "u_texture");
    console.log("set shaders uniform handlers");
}

async function loadModels() {
    for (const furnitureConfig in furnituresConfig) {
        console.log("model " + furnituresConfig[furnitureConfig]);
        await loadModel(furnituresConfig[furnitureConfig]);
    }

    console.log("loaded files");

}

async function loadModel(furnitureConfig) {
    console.log("load " + furnitureConfig.name);

    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    modelsDir = baseDir + "models/";

    var model;

    await utils.get_json("models/" + furnitureConfig.name + "/" + furnitureConfig.name + ".json",
        function (parsedModel) {
            model = parsedModel;
        });

    var furniture = new Furniture();
    furnitures.set(furnitureConfig.name, furniture);
    furniture.name = furnitureConfig.name;
    //local matrix of root object node
    furniture.localMatrix = model.rootnode.transformation;

    model.rootnode.children.forEach(parsedChildren => {
        if (parsedChildren.meshes != undefined) {
            let component = new FurnitureComponent();

            component.name = parsedChildren.name;
            component.localMatrix = parsedChildren.transformation;
            component.worldMatrix = furnitureConfig.initCoords;
            component.vertices = model.meshes[parsedChildren.meshes].vertices;
            component.normals = model.meshes[parsedChildren.meshes].normals;
            component.indices = [].concat.apply([], model.meshes[parsedChildren.meshes].faces);
            //Get textures
            component.texturecoords = model.meshes[parsedChildren.meshes].texturecoords[0];

            model.materials[model.meshes[parsedChildren.meshes].materialindex].properties.forEach(materialProperty => {
                //If the texture is embedded in the material pick from it
                if (materialProperty.key == "$tex.file") {
                    component.textureImageName = materialProperty.value;
                }
            });

            console.log("component");
            console.log(component);



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


            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

            let image = new Image();
            var path = window.location.pathname;
            var page = path.split("/").pop();
            baseDir = window.location.href.replace(page, '');
            modelsDir = baseDir + "models/";

            image.onload = function () {

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            };

            image.src = modelsDir + furniture.name + "/" + component.textureImageName; //+ "Room/Floor.jpg"; //

            console.log("image load " + image.baseURI);
            component.texture = texture;
            furniture.components.push(component);

        }
    });

    console.log("loaded ");
    console.log(furniture);



}

function drawScene() {

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    furnitures.forEach(furniture => {
        furniture.components.forEach(component => {
            console.log("rendering component " + component.name + " furniture " + furniture.name);

            updateTransformationMatrices(component);
            bindVertexArray();
            sendUniformsToGPU();
            drawElements();



            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, component.texture);
            gl.uniform1i(textLocation, 0);

            gl.bindVertexArray(component.vao);
            gl.drawElements(gl.TRIANGLES, component.indices.length, gl.UNSIGNED_SHORT, 0);
        });
    });

    window.requestAnimationFrame(drawScene);
}

function updateTransformationMatrices(component) {

    updateView();
    updatePerspective();

    viewWorldMatrix = utils.multiplyMatrices(viewMatrix, component.worldMatrix);
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
