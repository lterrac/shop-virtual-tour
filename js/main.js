/**
 * GLSL reference and program
 */
var program;
var gl;
var rotation = (Quaternion.ONE); 

// control vars camera movement
var cx = 0.5;
var cy = 2.0;
var cz = 1.0;
var currCamera;
var cameraTour;

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
var lastMouseX = -100, lastMouseY = -100;

/**
 * Texture map
 */
var textures = new Map();

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
        initCoords: utils.MakeTranslateMatrix(3.0, 0.6, - 2.5),
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
        initCoords: utils.MakeTranslateMatrix(3.0, 0.0, - 5.5),
        initScale: utils.MakeScaleMatrix(0.01),
        initRotation: utils.MakeRotateXMatrix(-90),
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

    getOrbitCoordinates() {
        return [this.orbit.worldMatrix[3] / this.orbit.worldMatrix[15], this.orbit.worldMatrix[7] / this.orbit.worldMatrix[15], this.orbit.worldMatrix[11] / this.orbit.worldMatrix[15]];
    }

    updateWorldMatrix(matrix) {
        if (matrix) {
            console.log("a " + this.name);
            // a matrix was passed in so do the math
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
            console.log("b " + this.name);

            // no matrix was passed in so just copy.
            utils.copy(this.localMatrix, this.worldMatrix);
        };

        var worldMatrix = this.worldMatrix;

        // process the orbit
        if (this.orbit) {
            this.orbit.updateWorldMatrix(worldMatrix);
        }

        // now process all the children
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
 * Root of scene graph
 */
var root;

/**
 * Initialize the program and start drawing the scene
 */
async function main() {
    console.log("start program");

    getCanvas();

    await initializeProgram();

    await loadModels();

    setGraphRoot();


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

    currCamera = 0;
    cameraTour = ['FreeCamera'];


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

    let furniture = new Furniture();
    furnitures.set(furnitureConfig.name, furniture);
    furniture.name = furnitureConfig.name;
    cameraTour.push(furnitureConfig.name);
    //local matrix of root object node
    furniture.localMatrix = utils.multiplyMatrices(
        utils.multiplyMatrices(
            utils.multiplyMatrices(
                furnitureConfig.initCoords
                , furnitureConfig.initRotation
            )
            , furnitureConfig.initScale
        )
        , model.rootnode.transformation
    );

    //Create orbit
    let orbit = new Furniture();
    orbit.name = furnitureConfig.name + " orbit";
    orbit.localMatrix = utils.multiplyMatrices(
        utils.multiplyMatrices(
            utils.MakeTranslateMatrix(0.0, 2.0, 3.0),
            utils.MakeRotateYMatrix(0)
        ),
        utils.identityMatrix()
    );
    furniture.orbit = orbit;

    model.rootnode.children.forEach(parsedChildren => {
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
            // gl.activeTexture(gl.TEXTURE0);
            // gl.bindTexture(gl.TEXTURE_2D, texture);
            // gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            //     new Uint8Array([0, 0, 255, 255]));

            
            if (textures.has(component.textureImageName)){
                console.log("existing texture " + component.textureImageName);
                
                setTexture(textures.get(component.textureImageName),texture);
            } else {
                console.log("new texture " + component.textureImageName);
                
                let image = new Image();
                var path = window.location.pathname;
                var page = path.split("/").pop();
                baseDir = window.location.href.replace(page, '');
                modelsDir = baseDir + "models/";

                image.onload = function() {
                    console.log("new " + component.textureImageName);
                    
                    setTexture(image, texture);
                    textures.set(component.textureImageName, image);
                };
    
                image.src = modelsDir + furniture.name + "/" + component.textureImageName; 
    
                
    
            }
            component.texture = texture;
        }
    });

    console.log("cached images ");
    console.log(textures);
}

function setTexture(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
}

function setGraphRoot() {
    root = furnitures.get('Room');


    furnitures.delete('Room');
    furnitures.forEach(furniture => {
        furniture.setParent(root);
    });
    //Init world matrix
    root.updateWorldMatrix();
    worldMatrix = root.worldMatrix;

    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width / gl.canvas.height, 0.01, 2000.0);
}

function drawScene() {

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   

    dynamicCamera();
    //Draw the room
    root.updateWorldMatrix(worldMatrix);

    updateTransformationMatrices(root);
    
    sendUniformsToGPU();

    root.children.filter(children => children.indices)
        .forEach(component => {
            drawElement(component);
        });

    furnitures.forEach(furniture => {
        updateTransformationMatrices(furniture);
        furniture.children.forEach(component => {
        
            sendUniformsToGPU();
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
    cx += delta[0];
    cy += delta[1];
    cz += delta[2];    
}

function drawElement(furniture) {
    //projection matrix
    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
    //normal matrix
    gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(normalMatrix));
    //world matrix
    gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, utils.transposeMatrix(worldMatrix));


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, furniture.texture);
    gl.uniform1i(textLocation, 0);

    gl.bindVertexArray(furniture.vao);
    gl.drawElements(gl.TRIANGLES, furniture.indices.length, gl.UNSIGNED_SHORT, 0);

}

//TODO CONTROLLA CHE SIA TUTTO GIUSTO
function updateTransformationMatrices(furniture) {
    updateView(furniture);
    updatePerspective();
}

function updateView(furniture) {
    if (cameraTour[currCamera] === 'FreeCamera') {
        viewMatrix =  utils.MakeView(cx, cy, cz, elevation, angle);
    } else {
        //Invert to pass from camera matrix to view matrix
        viewMatrix = utils.invertMatrix(utils.LookAt(furnitures.get(cameraTour[currCamera]).getOrbitCoordinates(), furnitures.get(cameraTour[currCamera]).getWorldCoordinates(), [0, 1, 0]));
    }

    viewWorldMatrix = utils.multiplyMatrices(viewMatrix, furniture.worldMatrix);
}

function updatePerspective() {
    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width / gl.canvas.height, 0.01, 2000.0);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
    normalMatrix = utils.invertMatrix(utils.transposeMatrix(worldMatrix));
}

function switchCamera() {
    currCamera = (currCamera + 1) % (furnitures.size + 1);
}

function sendUniformsToGPU() {
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

}
utils.initInteraction();
window.onload = main;
