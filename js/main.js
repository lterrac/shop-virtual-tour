/**
 * GLSL reference and program
 */
var program;
var gl;
var rotation = (Quaternion.ONE);

// control vars camera movement
var initCameraPosition = [0.0, 3.0, 8.0];
var cx = initCameraPosition[0];
var cy = initCameraPosition[1];
var cz = initCameraPosition[2];
var currCamera;
var cameraTour;

var lastUpdateTime;

const MAX_ELEVATION_ANGLE = 0.5;
const MIN_ELEVATION_ANGLE = MAX_ELEVATION_ANGLE * -1;

var vx = 0.0;
var vy = 0.0;
var vz = 0.0;
var rvx = 0.0;
var rvy = 0.0;
var rvz = 0.0;

/**
 * Camera angles
 */
var angle = 0.01;
var elevation = 0.01;
var roll = 0.01;

/**
 * Angular delta for camera
 */
var delta = 0.3;
var mouseState = false;
var lastMouseX = -100,
    lastMouseY = -100;

/**
 * Texture map
 */
var textures = new Map();

//control vars lights
var ambientON;
var directON;
var pointLightON;
var specularType;
var dirLightAlpha;
var dirLightBeta;

//lights
var warmLight;
var coldLight;
var lowLight;
//ambient light
var ambientLightColor;
//emission color
var materialEmission;
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
var viewMatrix = utils.MakeView(vx, vy, vz, elevation, angle);
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
var switchLightsHandle;
var materialEmissionHandle;

/**
 * Furnitures initial configuration
 */
var furnituresConfig = [{
        name: 'Bed',
        initCoords: utils.MakeTranslateMatrix(0.0, 0.0, -5.0),
        initScale: utils.MakeScaleMatrix(0.9),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 4.0, -6.0],
        pivot: [0.0, 0.0, -6.0],
        mainTexture: "Orion"
    },
    {
        name: 'Bed 2',
        initCoords: utils.MakeTranslateMatrix(4.0, 0.0, -5.0),
        initScale: utils.MakeScaleMatrix(0.9),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: 0,
        spotlightPosition: [4.0, 4.0, -6.0],
        pivot: [4.0, 0.0, -6.0],
        mainTexture: "Pois"
    },
    {
        name: 'Wardrobe',
        initCoords: utils.MakeTranslateMatrix(10.0, 0.0, -5.0),
        initScale: utils.MakeScaleMatrix(1),
        initRotation: utils.MakeRotateYMatrix(+90),
        initOrbitAngle: 0,
        spotlightPosition: [7.0, 0.5, -5.0],
        pivot: [10.0, 1.0, -5.0],
        mainTexture: "White"
    },
    {
        name: 'Book Shelf',
        initCoords: utils.MakeTranslateMatrix(-8.8, 0.0, 1.0),
        initScale: utils.MakeScaleMatrix(0.8),
        initRotation: utils.MakeRotateYMatrix(180),
        initOrbitAngle: 90,
        spotlightPosition: [-6.5, 0.5, 1.0],
        pivot: [-8.8, 1.0, 1.0],
        mainTexture: "Standard"
    },
    {
        name: 'Chair',
        initCoords: utils.MakeTranslateMatrix(1.0, 0.0, 0.0),
        initScale: utils.MakeScaleMatrix(0.3),
        initRotation: utils.MakeRotateYMatrix(30),
        initOrbitAngle: 0,
        spotlightPosition: [1.0, 4.0, 0.0],
        pivot: [1.0, 0.0, 0.0],
        mainTexture: "Stoffa"
    },
    {
        name: 'Coffee Table',
        initCoords: utils.MakeTranslateMatrix(0.5, 0.25, 1.5),
        initScale: utils.MakeScaleMatrix(0.015),
        initRotation: utils.MakeRotateYMatrix(-90),
        initOrbitAngle: 0,
        spotlightPosition: [-1.0, 4.0, 1.5],
        pivot: [-1.0, 0.5, 1.5],
        mainTexture: "Marmo"
    },
    {
        name: 'Sofa',
        initCoords: utils.MakeTranslateMatrix(-6.0, -0.4, -5.0),
        initScale: utils.MakeScaleMatrix(0.1),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: -70,
        spotlightPosition: [-6.5, 6.0, -5.5],
        pivot: [-6.5, 0.0, -5.5],
        mainTexture: "White"
    },
    {
        name: 'Room',
        initCoords: utils.MakeTranslateMatrix(0.0, 0.0, 0.0),
        initScale: utils.MakeScaleMatrix(1),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 1.0, 0.0],
        pivot: [0.0, 0.0, 0.0],
        mainTexture: "Wall"
    }, ,
    {
        name: 'LampCloset',
        initCoords: utils.MakeTranslateMatrix(7.5, 0.0, -5.0),
        initScale: utils.MakeScaleMatrix(0.5),
        initRotation: utils.MakeRotateYMatrix(90),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 1.0, 0.0],
        pivot: [7.5, 0.0, -5.0],
        mainTexture: "Black"
    },
    {
        name: 'LampShelf',
        initCoords: utils.MakeTranslateMatrix(-6.5, 0.0, 1.0),
        initScale: utils.MakeScaleMatrix(0.5),
        initRotation: utils.MakeRotateYMatrix(-90),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 1.0, 1.0],
        pivot: [-7.0, 0.0, 1.0],
        mainTexture: "Black"
    },
    {
        name: 'Fan',
        initCoords: utils.MakeTranslateMatrix(0.0, 4.8, 0.0),
        initScale: utils.MakeScaleMatrix(0.5),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 2.0, 0.0],
        pivot: [0.0, 5.5, 0.0],
        mainTexture: "FanOn"
    },
    {
        name: 'Fridge',
        initCoords: utils.MakeTranslateMatrix(-8.8, 0.0, 6.0),
        initScale: utils.MakeScaleMatrix(1.5),
        initRotation: utils.MakeRotateYMatrix(-90),
        initOrbitAngle: 0,
        spotlightPosition: [-8.8, 4.0, 6.0],
        pivot: [-8.8, 1.5, 6.0],
        mainTexture: "Fridge"
    },
    {
        name: 'WindowRight',
        initCoords: utils.MakeTranslateMatrix(9.9, 1.5, 1.0),
        initScale: utils.MakeScaleMatrix(1.5),
        initRotation: utils.MakeRotateYMatrix(0),
        initOrbitAngle: 0,
        spotlightPosition: [9.9, 4.5, 1.0],
        pivot: [9.9, 1.5, 1.0],
        mainTexture: "White"
    },
    {
        name: 'WindowFront',
        initCoords: utils.MakeTranslateMatrix(0.0, 1.5, -9.9),
        initScale: utils.MakeScaleMatrix(1.5),
        initRotation: utils.MakeRotateYMatrix(90),
        initOrbitAngle: 0,
        spotlightPosition: [0.0, 3.5, -9.9],
        pivot: [0.0, 1.5, -9.9],
        mainTexture: "White"
    }
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

    getOrbitCoordinates() {
        return [this.orbit.worldMatrix[3] / this.orbit.worldMatrix[15], this.orbit.worldMatrix[7] / this.orbit.worldMatrix[15], this.orbit.worldMatrix[11] / this.orbit.worldMatrix[15]];
    }

    updateWorldMatrix(matrix) {
        if (matrix) {
            // a matrix was passed in so do the math
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
            // no matrix was passed in so just copy.
            utils.copy(this.localMatrix, this.worldMatrix);
        };

        var worldMatrix = this.worldMatrix;

        // process the orbit
        if (this.orbit) {
            this.orbit.updateWorldMatrix(worldMatrix);
        }

        // now process all the children
        this.children.forEach(function(child) {
            child.updateWorldMatrix(worldMatrix);
        });
    }
}


/**
 * Map containing all the scene furnitures 
 */
var furnitures = new Map();

/**
 * Root of scene graph (the room)
 */
var root;

/**
 * Initialize the program and start drawing the scene
 */
async function main() {
    setGUI();

    getCanvas();

    await initializeProgram();

    await loadModels();

    setGraphRoot();

    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width / gl.canvas.height, 0.01, 2000.0);

    drawScene();

}

function getCanvas() {
    canvas = document.getElementById("main_canvas");

    canvas.addEventListener("mousedown", utils.doMouseDown, false);
    canvas.addEventListener("mouseup", utils.doMouseUp, false);
    canvas.addEventListener("mousemove", utils.doMouseMove, false);

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
}

function initParams() {
    //control vars lights
    specularType = [1, 0];
    ambientON = 1.0;
    directON = 1.0;
    pointLightON = 1.0;
    dirLightAlpha = -utils.degToRad(0);
    dirLightBeta = -utils.degToRad(45);

    currCamera = 0;
    cameraTour = ['Free camera'];


    //lights
    warmLight = [175 / 255, 175 / 255, 152 / 255, 1.0];
    coldLight = [70 / 255, 70 / 255, 70 / 255, 1.0];
    lowLight = [30 / 255, 30 / 255, 30 / 255, 1.0];
    //ambient light
    ambientLightColor = lowLight;
    //point light
    pointLightColor = warmLight;
    pointLightPosition = [0.0, 3.0, 0.0];
    pointLightDecay = 0.3;
    pointLightTarget = 1.0;
    //spot lights
    spotlight = {};
    spotlight.name = 'spotLight';
    spotlight.color = warmLight;
    spotlight.position = [0.0, 4.0, 1.0];
    spotlight.targetPosition = [0.0, 0.0, 1.0];
    spotlight.decay = 1.0;
    spotlight.target = 2.5;
    spotlight.coneIn = 0.6;
    spotlight.coneOut = 50.0;
    spotlight.On = 0.0;
    //direct light
    dirLightColor = coldLight;
    dirLightDirection = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
        Math.sin(dirLightAlpha),
        Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
    ];


    diffuseLightColor = [230 / 255, 230 / 255, 230 / 255, 1.0]; //warm white
    specularLightColor = [250 / 255, 250 / 255, 250 / 255, 1.0]; //white
    specShine = 90.0;

    mixTextureColor = 0.9; //percentage of texture color in the final projection

    lastUpdateTime = (new Date).getTime();

}

async function compileAndLinkShaders() {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "shaders/";

    shaders.set('basic', {});
    shaders.get('basic').vs = shaderDir + 'vs.glsl';
    shaders.get('basic').fs = shaderDir + 'fs.glsl';



    currentShader = 'basic';

    await utils.loadFiles([shaders.get(currentShader).vs, shaders.get(currentShader).fs], function(shaderText) {
        program = utils.createAndCompileShaders(gl, shaderText);
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
    normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    eyePosHandle = gl.getUniformLocation(program, 'eyePos');
    //lights uniforms
    ambientLightHandle = gl.getUniformLocation(program, 'ambientLightColor');
    materialEmissionHandle = gl.getUniformLocation(program, 'materialEmission');
    diffuseLightHandle = gl.getUniformLocation(program, 'diffuseLightColor');
    specularLightHandle = gl.getUniformLocation(program, 'specularLightColor');
    specShineHandle = gl.getUniformLocation(program, 'specShine');
    specularTypeHandle = gl.getUniformLocation(program, 'specularType');
    mixTextureHandle = gl.getUniformLocation(program, 'mix_texture');

    switchLightsHandle = gl.getUniformLocation(program, 'switchLights');
    dirLightDirectionHandle = gl.getUniformLocation(program, 'dirLightDirection');
    dirLightColorHandle = gl.getUniformLocation(program, 'dirLightColor');
    pointLightColorHandle = gl.getUniformLocation(program, 'pointLightColor');
    pointLightPositionHandle = gl.getUniformLocation(program, 'pointLightPos');
    pointLightTargetHandle = gl.getUniformLocation(program, 'pointLightTarget');
    pointLightDecayHandle = gl.getUniformLocation(program, 'pointLightDecay');

    var name = spotlight.name;
    spotlight.colorHandle = gl.getUniformLocation(program, name + 'Color');
    spotlight.positionHandle = gl.getUniformLocation(program, name + 'Pos');
    spotlight.targetPositionHandle = gl.getUniformLocation(program, name + 'TargetPos');
    spotlight.decayHandle = gl.getUniformLocation(program, name + 'Decay');
    spotlight.targetHandle = gl.getUniformLocation(program, name + 'Target');
    spotlight.coneInHandle = gl.getUniformLocation(program, name + 'ConeIn');
    spotlight.coneOutHandle = gl.getUniformLocation(program, name + 'ConeOut');


}

async function loadModels() {
    for (const furnitureConfig in furnituresConfig) {
        await loadModel(furnituresConfig[furnitureConfig]);
    }
}

async function loadModel(furnitureConfig) {

    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    modelsDir = baseDir + "models/";

    var model;

    await utils.get_json("models/" + furnitureConfig.name + "/" + furnitureConfig.name + ".json",
        function(parsedModel) {
            model = parsedModel;
        });

    //Create a new furniture
    let furniture = new Furniture();
    furnitures.set(furnitureConfig.name, furniture);
    furniture.name = furnitureConfig.name;
    cameraTour.push(furnitureConfig.name);
    //local matrix of furniture
    furniture.localMatrix = utils.multiplyMatrices(
        utils.multiplyMatrices(
            utils.multiplyMatrices(
                furnitureConfig.initCoords, furnitureConfig.initRotation
            ), furnitureConfig.initScale
        ), model.rootnode.transformation
    );
    furniture.pivot = furnitureConfig.pivot;
    furniture.spotlightPosition = furnitureConfig.spotlightPosition;

    //Create orbit
    let orbit = new Furniture();
    orbit.name = furnitureConfig.name + " orbit";
    orbit.angle = furnitureConfig.initOrbitAngle;
    orbit.scale = furnitureConfig.initScale;
    orbit.localMatrix = utils.multiplyMatrices(
        utils.multiplyMatrices(
            utils.MakeRotateYMatrix(orbit.angle),
            utils.invertMatrix(orbit.scale)
        ),
        utils.MakeTranslateMatrix(0.0, 3.0, 3.0)
    );
    furniture.orbit = orbit;

    //Create furniture components
    model.rootnode.children.forEach(parsedChildren => {
        //FIX: some components does not have meshes, do not parse them
        if (parsedChildren.meshes != undefined) {
            let component = new Furniture();
            furniture.children.push(component);
            component.name = parsedChildren.name;
            component.localMatrix = parsedChildren.transformation;

            component.vertices = model.meshes[parsedChildren.meshes].vertices;
            component.normals = model.meshes[parsedChildren.meshes].normals;
            component.indices = [].concat.apply([], model.meshes[parsedChildren.meshes].faces);
            //Get textures
            component.texturecoords = model.meshes[parsedChildren.meshes].texturecoords[0];

            model.materials[model.meshes[parsedChildren.meshes].materialindex].properties.forEach(materialProperty => {
                //If the texture is embedded in the material pick from it
                if (materialProperty.key == "$tex.file") {
                    component.textureImageName = materialProperty.value;

                    //Keeps track of the current image set to the main texture in order to change it properly from GUI
                    if (component.textureImageName.includes(furnitureConfig.mainTexture)) {
                        component.currentTextureImageName = component.textureImageName;
                    }
                }

                if (materialProperty.key == "$clr.diffuse") component.diffuse = new Float32Array([materialProperty.value[0], materialProperty.value[1], materialProperty.value[2], 1.0]);

                if (materialProperty.key == "$clr.specular") component.specular = new Float32Array([materialProperty.value[0], materialProperty.value[1], materialProperty.value[2], 1.0]);

                if (materialProperty.key == "$clr.ambient") component.ambient = new Float32Array([materialProperty.value[0] / 4.0, materialProperty.value[1] / 4.0, materialProperty.value[2] / 4.0, 1.0]);

                if (materialProperty.key == "$mat.shininess") component.shine = materialProperty.value * 1.0;

                if (materialProperty.key == "$clr.emission") component.emission = materialProperty.value;
            });

            if (!component.diffuse) component.diffuse = diffuseLightColor;
            if (!component.specular) component.specular = specularLightColor;
            if (!component.ambient) component.ambient = ambientLightColor;
            if (!component.shine) component.shine = specShine;
            if (!component.emission) component.emission = [0.0, 0.0, 0.0, 1.0];

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

            //Caching mechanism
            //Useful only for the room loading
            if (textures.has(component.textureImageName)) {
                setTexture(textures.get(component.textureImageName), texture);
            } else {
                let image = new Image();
                var path = window.location.pathname;
                var page = path.split("/").pop();
                baseDir = window.location.href.replace(page, '');
                modelsDir = baseDir + "models/";

                image.onload = function() {
                    setTexture(image, texture);
                    textures.set(component.textureImageName, image);
                };
                image.src = modelsDir + furniture.name + "/" + component.textureImageName;
            }
            component.texture = texture;
        }
    });

}

/**
 * Bind the texture and put the image inside of it
 * @param {Image} image 
 * @param {Texture} texture 
 */
function setTexture(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
}

/**
 * Delete Room from furnitures after the object loading and update worldMatrix()
 */
function setGraphRoot() {
    root = furnitures.get('Room');

    furnitures.delete('Room');
    furnitures.forEach(furniture => {
        furniture.setParent(root);
    });
    //Init world matrix
    root.updateWorldMatrix();
    worldMatrix = root.worldMatrix;
}

function animate() {
    var currentTime = (new Date).getTime();
    if (lastUpdateTime) {
        var deltaC = ((currentTime - lastUpdateTime)) / 10.0;
        let furniture = furnitures.get('Fan');
        furniture.localMatrix = utils.multiplyMatrices(utils.MakeRotateYMatrix(deltaC), furniture.localMatrix);
    }
    lastUpdateTime = currentTime;
}


function drawScene() {

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    dynamicCamera();
    //Draw the room
    root.updateWorldMatrix(worldMatrix);

    animate();

    updateTransformationMatrices(root);

    root.children.filter(children => children.indices)
        .forEach(component => {
            sendUniformsToGPU(component);
            drawElement(component);
        });

    furnitures.forEach(furniture => {
        updateTransformationMatrices(furniture);
        furniture.children.forEach(component => {

            sendUniformsToGPU(component);
            drawElement(component);


        });
    });

    window.requestAnimationFrame(drawScene);
}

function dynamicCamera() {

    delta = Quaternion.fromEuler(utils.degToRad(rvz),
        utils.degToRad(-rvx),
        utils.degToRad(rvy));

    rotation = rotation.mul(delta);



    dvecmat = utils.transposeMatrix(viewMatrix);
    dvecmat[12] = dvecmat[13] = dvecmat[14] = 0.0;
    xaxis = [dvecmat[0], dvecmat[4], dvecmat[8]];
    yaxis = [dvecmat[1], dvecmat[5], dvecmat[9]];
    zaxis = [dvecmat[2], dvecmat[6], dvecmat[10]];

    if ((rvx != 0) || (rvy != 0) || (rvz != 0)) {
        qx = Quaternion.fromAxisAngle(xaxis, utils.degToRad(rvx * 1));
        qy = Quaternion.fromAxisAngle(yaxis, utils.degToRad(rvy * 1));
        qz = Quaternion.fromAxisAngle(zaxis, utils.degToRad(rvz * 1));
        newDvecmat = utils.multiplyMatrices(utils.multiplyMatrices(utils.multiplyMatrices(
            qy.toMatrix4(), qx.toMatrix4()), qz.toMatrix4()), dvecmat);

        R11 = newDvecmat[10];
        R12 = newDvecmat[8];
        R13 = newDvecmat[9];
        R21 = newDvecmat[2];
        R22 = newDvecmat[0];
        R23 = newDvecmat[1];
        R31 = newDvecmat[6];
        R32 = newDvecmat[4];
        R33 = newDvecmat[5];

        if ((R31 < 1) && (R31 > -1)) {
            theta = -Math.asin(R31);
            phi = Math.atan2(R32 / Math.cos(theta), R33 / Math.cos(theta));
            psi = -Math.atan2(R21 / Math.cos(theta), R11 / Math.cos(theta));

        } else {
            phi = 0;
            if (R31 <= -1) {
                theta = Math.PI / 2;
                psi = phi + Math.atan2(R12, R13);
            } else {
                theta = -Math.PI / 2;
                psi = Math.atan2(-R12, -R13) - phi;
            }
        }

        theta = (theta >= MAX_ELEVATION_ANGLE) ? MAX_ELEVATION_ANGLE : (theta <= MIN_ELEVATION_ANGLE ? MIN_ELEVATION_ANGLE : theta);

        elevation = theta / Math.PI * 180;
        roll = phi / Math.PI * 180;
        angle = psi / Math.PI * 180;
    }

    delta = utils.multiplyMatrixVector(dvecmat, [vx, vy, vz, 0.0]);
    if (cx + delta[0] > 9.9)
        cx = 9.9
    else if (cx + delta[0] < -9.9)
        cx = -9.9
    else
        cx += delta[0];
    if (cy + delta[1] > 4.9)
        cy = 4.9
    else if (cy + delta[1] < 0.1)
        cy = 0.1
    else
        cy += delta[1];
    if (cz + delta[2] > 9.9)
        cz = 9.9
    else if (cz + delta[2] < -9.9)
        cz = -9.9
    else
        cz += delta[2];
}

function drawElement(furniture) {
    //projection matrix
    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
    //normal matrix
    gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
    //world matrix
    gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, utils.transposeMatrix(furniture.worldMatrix));


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, furniture.texture);
    gl.uniform1i(textLocation, 0);

    gl.bindVertexArray(furniture.vao);
    gl.drawElements(gl.TRIANGLES, furniture.indices.length, gl.UNSIGNED_SHORT, 0);

}

//TODO CONTROLLA CHE SIA TUTTO GIUSTO
function updateTransformationMatrices(furniture) {
    updateView(furniture);
    updatePerspective(furniture);
}

function updateView(furniture) {
    if (currCamera == 0) {
        viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);
    } else {
        viewMatrix = utils.invertMatrix(utils.LookAt([cx, cy, cz], furnitures.get(cameraTour[currCamera]).pivot, [0, 1, 0]));
    }
    viewWorldMatrix = utils.multiplyMatrices(viewMatrix, furniture.worldMatrix);
}

function updatePerspective(furniture) {
    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width / gl.canvas.height, 0.01, 2000.0);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
    normalMatrix = utils.invertMatrix(utils.transposeMatrix(furniture.worldMatrix));
}

function switchCamera(currCamera) {
    if (currCamera != 0) {
        //Invert to pass from camera matrix to view matrix
        let posInOrbit = furnitures.get(cameraTour[currCamera]).getOrbitCoordinates();
        cx = posInOrbit[0];
        cy = posInOrbit[1];
        cz = posInOrbit[2];
        //point spotlight to the furniture
        updateSpotlightPosition();
        //turn on the spotlight
        document.getElementById('spot').checked = true;
        spotlight.On = 1.0;
        setTexturePanel(furnitures.get(cameraTour[currCamera]).name);
    } else {
        //set the camera position to the initial point
        cx = initCameraPosition[0];
        cy = initCameraPosition[1];
        cz = initCameraPosition[2];
        spotlight.On = 0.0;
        document.getElementById('spot').checked = false;
        hideTexturePanel();
    }
}

function rotateCameraOnFurniture(dx) {
    furniture = furnitures.get(cameraTour[currCamera]);
    furniture.orbit.angle += (0.3 * dx);

    furniture.orbit.localMatrix =
        utils.multiplyMatrices(
            utils.multiplyMatrices(
                utils.MakeRotateYMatrix(furniture.orbit.angle),
                utils.invertMatrix(furniture.orbit.scale)
            ),
            utils.MakeTranslateMatrix(0.0, 3.0, 3.0)
        );
    let posInOrbit = furniture.getOrbitCoordinates();
    cx = posInOrbit[0];
    cy = posInOrbit[1];
    cz = posInOrbit[2];
}

function updateSpotlightPosition() {
    if (currCamera != 0) {
        furniture = furnitures.get(cameraTour[currCamera]);
        spotlight.position[0] = furniture.spotlightPosition[0];
        spotlight.position[1] = furniture.spotlightPosition[1];
        spotlight.position[2] = furniture.spotlightPosition[2];
        spotlight.targetPosition = furniture.pivot;
    }
}

function sendUniformsToGPU(component) {
    gl.uniform3fv(eyePosHandle, [cx, cy, cz]);
    //ambient light
    gl.uniform4fv(ambientLightHandle, component.ambient);
    //emission
    gl.uniform4fv(materialEmissionHandle, component.emission);
    //brdf
    gl.uniform4fv(diffuseLightHandle, component.diffuse);
    gl.uniform4fv(specularLightHandle, component.specular);
    gl.uniform1f(specShineHandle, component.shine);
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
    gl.uniform4fv(spotlight.colorHandle, spotlight.color);
    gl.uniform3fv(spotlight.positionHandle, spotlight.position);
    gl.uniform3fv(spotlight.targetPositionHandle, spotlight.targetPosition);
    gl.uniform1f(spotlight.decayHandle, spotlight.decay);
    gl.uniform1f(spotlight.targetHandle, spotlight.target);
    gl.uniform1f(spotlight.coneInHandle, spotlight.coneIn);
    gl.uniform1f(spotlight.coneOutHandle, spotlight.coneOut);

    gl.uniform4fv(switchLightsHandle, [ambientON, directON, pointLightON, spotlight.On]);
}

utils.initInteraction();
window.onload = main;


/**
 * Set the camera selection in the GUI
 */
function setGUI() {
    furnituresConfig.forEach(furniture => {
        if (furniture.name != 'Room' && !furniture.name.includes("Lamp") && !furniture.name.includes("Window") && !furniture.name.includes("Fan")) {
            let cameras = document.getElementById("cameras").innerHTML
            cameras += `<input type="radio" name="cameras" onchange='setCamera("${furniture.name}")';"> ${furniture.name} camera <br />`
            document.getElementById("cameras").innerHTML = cameras
        }
    });
}

// Lights function

function toggleAmbient() {
    if (ambientON == false) {
        ambientLightColor = lowLight;
        ambientON = true;
        document.getElementById('ambient').checked = true;
    } else {
        ambientLightColor = [0.0, 0.0, 0.0, 1.0];
        ambientON = false;
        document.getElementById('ambient').checked = false;
    }
}


function toggleDirect() {
    if (directON == false) {
        dirLightColor = coldLight;
        directON = true;
        document.getElementById('direct').checked = true;
    } else {
        dirLightColor = [0.0, 0.0, 0.0, 1.0];
        directON = false;
        document.getElementById('direct').checked = false;
    }
}

function togglePointLight() {
    if (pointLightON == false) {
        pointLightColor = warmLight;
        pointLightON = true;
        document.getElementById('point').checked = true;
    } else {
        pointLightColor = [0.0, 0.0, 0.0, 1.0];
        pointLightON = false;
        document.getElementById('point').checked = false;
    }
}

function toggleSpotLight() {
    if (spotlight.On == 0.0) {
        spotlight.On = 1.0;
        document.getElementById('spot').checked = true;
    } else {
        spotlight.On = 0.0;
        document.getElementById('spot').checked = false;
    }
}

//Camera GUI function

function setCamera(camera) {
    currCamera = cameraTour.indexOf(camera);
    switchCamera(currCamera);
}

// Texture GUI function

function changeTextureOnClick(imageName) {
    changeTexture(furnitures.get(cameraTour[currCamera]), imageName);
}

function changeTexture(furniture, imageName) {
    let image = new Image();
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    modelsDir = baseDir + "models/";

    image.onload = function() {
        furniture.children.forEach(component => {
            if (component.texture && component.currentTextureImageName == component.textureImageName) {
                component.textureImageName = imageName;
                component.currentTextureImageName = imageName;
                setTexture(image, component.texture)
            }
        });
    };

    image.src = modelsDir + furniture.name + "/textures/" + imageName + ".webp";
}

function hideTexturePanel() {
    document.getElementById("textures").style.setProperty("visibility", "hidden");

    //Remove all elements from select
    let sel = document.getElementById('texture-drop-down');
    for (i = sel.length - 1; i >= 0; i--) {
        sel.remove(i);
    }
}

function setTexturePanel(furniture) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        let textureToggle = document.getElementById("textures");
        dropDown = document.getElementById("texture-drop-down");
        htmlText = "";
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200 && JSON.parse(xmlHttp.response).length != 0) {
            textureToggle.style.setProperty("visibility", "visible")
            textures = JSON.parse(xmlHttp.response);
            textures.forEach(texture => {
                htmlText += `<option id="tex" value="${texture}">${texture}</option>`
            });

            dropDown.innerHTML = htmlText;
        } else {
            textureToggle.style.setProperty("visibility", "hidden");
        }
    };
    xmlHttp.open("GET", "/textures/" + furniture);
    xmlHttp.send();
}