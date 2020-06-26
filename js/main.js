/**
 * GLSL reference and program
 */
var program;
var gl;

// control vars camera movement
var cx = 0.5;
var cy = 2.0;
var cz = 1.0;

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
var viewProjectionMatrix;
var normalMatrix;

var shaders = new Map();
var currentShader;

/**
 * Shader handlers
 */
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


/**
 * Furnitures initial configuration
 */
var furnituresConfig = [
    {
        name: 'bed',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(- 1.0, 0.0, - 0.5),
        initScale: utils.MakeScaleMatrix(0.8),
        initRotation: utils.MakeRotateYMatrix(30),
    },
    {
        name: 'bed_2',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(- 3.0, 0.0, - 2.5),
        initScale: utils.MakeScaleMatrix(0.9),
        initRotation: utils.MakeRotateYMatrix(30),
    },
    {
        name: 'closet',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix(3.0, 0.5, - 2.5),
        initScale: utils.MakeScaleMatrix(1),
        initRotation: utils.MakeRotateYMatrix(0),
    },
    {
        name: 'book-shelf',
        type: 'JSON',
        imageType: '.jpg',
        initCoords: utils.MakeTranslateMatrix(-10.0, 0.0, - 2.5),
        initScale: utils.MakeScaleMatrix(0.8),
        initRotation: utils.MakeRotateYMatrix(0),
    },
    {
        name: 'chair',
        type: 'JSON',
        imageType: '.png',
        initCoords: utils.MakeTranslateMatrix( 3.0, 1.0, - 5.5),
        initScale: utils.MakeScaleMatrix(0.6),
        initRotation: utils.MakeRotateYMatrix(30),
    },
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
    }

    getWorldCoordinates() {
        return [this.worldMatrix[3] / this.worldMatrix[15], this.worldMatrix[7] / this.worldMatrix[15], this.worldMatrix[11] / this.worldMatrix[15]];
    }


    updateWorldMatrix(matrix) {
        if (matrix) {
            // a matrix was passed in so do the math
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
            // no matrix was passed in so just copy.
            utils.copy(this.localMatrix, this.worldMatrix);
        };

        // now process all the children
        var worldMatrix = this.worldMatrix;
        this.children.forEach(function (child) {
            child.updateWorldMatrix(worldMatrix);
        });
    }
}


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

    initParams();

    await compileAndLinkShaders();

    getAttributeLocations();

    getUniformLocations();
}

function initParams() {
    //control vars lights
    specularType = [1, 0];
    ambientON = true;
    directON = true;
    pointLightON = true;
    numOfSpotlights = 1;
    dirLightAlpha = -utils.degToRad(270);
    dirLightBeta = -utils.degToRad(270);

    //lights
    //ambient light
    ambientLightColor = [50 / 255, 50 / 255, 50 / 255, 1.0];
    //point light
    pointLightColor = [254 / 255, 244 / 255, 229 / 255, 1.0];
    pointLightPosition = [-0.1, 1.0, 2.0];
    pointLightDecay = 1.0;
    pointLightTarget = 1.0;
    //spot lights
    spotlights = new Map();
    for (i = 0; i < numOfSpotlights; i++) {
        spotlights.set('spotLight' + i, {});
        spotlights.get('spotLight' + i).name = 'spotLight' + i;
        spotlights.get('spotLight' + i).color = [230 / 255, 230 / 255, 230 / 255, 1.0];
        spotlights.get('spotLight' + i).position = [1.0, 1.0, 0.0];
        spotlights.get('spotLight' + i).direction = [1.0, 0.1, 0.1];
        spotlights.get('spotLight' + i).decay = 1.0;
        spotlights.get('spotLight' + i).target = 1.0;
        spotlights.get('spotLight' + i).coneIn = 30.0;
        spotlights.get('spotLight' + i).coneOut = 60.0;
        spotlights.get('spotLight' + i).On = true;

    }
    //direct light
    dirLightColor = [0.9, 1.0, 1.0, 1.0];
    dirLightDirection = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
    Math.sin(dirLightAlpha),
    Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
    ];


    diffuseLightColor = [230 / 255, 230 / 255, 230 / 255, 1.0]; //warm white
    specularLightColor = [250 / 255, 250 / 255, 250 / 255, 1.0]; //white
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
        program = utils.createAndCompileShaders(gl, shaderText);
    });
    gl.useProgram(program);
    console.log("compiled shaders");
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
    normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    eyePosHandle = gl.getUniformLocation(program, 'eyePos');
    //lights uniforms
    ambientLightHandle = gl.getUniformLocation(program, 'ambientLightColor');
    diffuseLightHandle = gl.getUniformLocation(program, 'diffuseLightColor');
    specularLightHandle = gl.getUniformLocation(program, 'specularLightColor');
    specShineHandle = gl.getUniformLocation(program, 'specShine');
    specularTypeHandle = gl.getUniformLocation(program, 'specularType');
    mixTextureHandle = gl.getUniformLocation(program, 'mix_texture');

    dirLightDirectionHandle = gl.getUniformLocation(program, 'dirLightDirection');
    dirLightColorHandle = gl.getUniformLocation(program, 'dirLightColor');
    pointLightColorHandle = gl.getUniformLocation(program, 'pointLightColor');
    pointLightPositionHandle = gl.getUniformLocation(program, 'pointLightPos');
    pointLightTargetHandle = gl.getUniformLocation(program, 'pointLightTarget');
    pointLightDecayHandle = gl.getUniformLocation(program, 'pointLightDecay');
    spotlights.forEach(spotlight => {
        var name = spotlight.name;
        spotlight.colorHandle = gl.getUniformLocation(program, name + 'Color');
        spotlight.positionHandle = gl.getUniformLocation(program, name + 'Pos');
        spotlight.directionHandle = gl.getUniformLocation(program, name + 'Dir');
        spotlight.decayHandle = gl.getUniformLocation(program, name + 'Decay');
        spotlight.targetHandle = gl.getUniformLocation(program, name + 'Target');
        spotlight.coneInHandle = gl.getUniformLocation(program, name + 'ConeIn');
        spotlight.coneOutHandle = gl.getUniformLocation(program, name + 'ConeOut');

    });


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
            let component = new Furniture();
            furniture.children.push(component);
            component.name = parsedChildren.name;
            component.localMatrix = utils.multiplyMatrices(
                utils.multiplyMatrices(
                    utils.multiplyMatrices(
                        furnitureConfig.initCoords
                        , furnitureConfig.initRotation
                    )
                    , furnitureConfig.initScale
                )
                , parsedChildren.transformation
            );
            component.updateWorldMatrix(worldMatrix);
            
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



            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(component.vertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            var normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(component.normals), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

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

            component.texture = texture;

        }
    });

    console.log("loaded ");
    console.log(furniture);
}

function drawScene() {

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(eyePosHandle, [cx, cy, cz]);
    //ambient light
    gl.uniform4fv(ambientLightHandle, ambientLightColor);
    //brdf
    gl.uniform4fv(diffuseLightHandle, diffuseLightColor);
    gl.uniform4fv(specularLightHandle, specularLightColor);
    gl.uniform1f(specShineHandle, specShine);
    gl.uniform1f(mixTextureHandle, mixTextureColor);
    gl.uniform2fv(specularTypeHandle, specularType);
    //directional light
    gl.uniform4fv(dirLightColorHandle, dirLightColor);
    gl.uniform3fv(dirLightDirectionHandle, dirLightDirection);
    //point light
    gl.uniform4fv(pointLightColorHandle, pointLightColor);
    gl.uniform3fv(pointLightPositionHandle, pointLightPosition);
    gl.uniform1f(pointLightDecayHandle, pointLightDecay);
    gl.uniform1f(pointLightTargetHandle, pointLightTarget);
    //spotlights
    for (i = 0; i < numOfSpotlights; i++) {
        var spotlight = spotlights.get('spotLight' + i);
        gl.uniform4fv(spotlight.colorHandle, spotlight.color);
        gl.uniform3fv(spotlight.positionHandle, spotlight.position);
        gl.uniform3fv(spotlight.directionHandle, spotlight.direction);
        gl.uniform1f(spotlight.decayHandle, spotlight.decay);
        gl.uniform1f(spotlight.targetHandle, spotlight.target);
        gl.uniform1f(spotlight.coneInHandle, spotlight.coneIn);
        gl.uniform1f(spotlight.coneOutHandle, spotlight.coneOut);
    }


    furnitures.forEach(furniture => {
        furniture.children.forEach(component => {

            updateTransformationMatrices(component);
            bindVertexArray();
            sendUniformsToGPU();
            drawElements();

            //projection matrix
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            //normal matrix
            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
            //world matrix
            gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, utils.transposeMatrix(worldMatrix));


            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, component.texture);
            gl.uniform1i(textLocation, 0);

            gl.bindVertexArray(component.vao);
            gl.drawElements(gl.TRIANGLES, component.indices.length, gl.UNSIGNED_SHORT, 0);
        });
    });

    window.requestAnimationFrame(drawScene);
}

//TODO CONTROLLA CHE SIA TUTTO GIUSTO
function updateTransformationMatrices(component) {

    updateView();
    updatePerspective();

    viewWorldMatrix = utils.multiplyMatrices(viewMatrix, component.worldMatrix);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
}

function updateView() {

	worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
	viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);
	normalMatrix = utils.invertMatrix(utils.transposeMatrix(worldMatrix));

}

function updatePerspective() {

    perspectiveMatrix = utils.MakePerspective(40, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
}

function bindVertexArray() {

}
function sendUniformsToGPU() {

}
function drawElements() {

}

utils.initInteraction();
window.onload = main;
