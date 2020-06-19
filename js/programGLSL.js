var shadersGLSL = {

    positionAttributeLocation: null,

    // normalAttributeLocation: null,

    // uvAttributeLocation: null,

    vertexShader: null,

    fragmentShader: null,

    program: null,

    gl: null,

    initialize: async function (gl) {
        this.gl = gl;

        await this.compileShaders();

        this.getAttributesLocation();

        this.getUniformsLocation();
        this.createVaos();
        this.putAttributesOnGpu();
    },

    /**
     * Compile and load shaders
     */
    compileShaders: async function () {
        var path = window.location.pathname;
        var page = path.split("/").pop();
        baseDir = window.location.href.replace(page, '');
        shaderDir = baseDir+"shaders/";
        await utils.loadFiles([shaderDir + 'vertex_shader.glsl', shaderDir + 'fragment_shader.glsl'], function (shaderText) {
            var vertexShader = utils.createShader(this.gl, this.gl.VERTEX_SHADER, shaderText[0]);
            console.log(vertexShader);
            var fragmentShader = utils.createShader(this.gl, this.gl.FRAGMENT_SHADER, shaderText[1]);
            this.program = utils.createProgram(this.gl, vertexShader, fragmentShader);
      
          });
          gl.useProgram(program);
    },

    getAttributesLocation: function () {
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'in_pos');
        // this.normalAttributeLocation = this.gl.getAttribLocation(this.program, 'in_norm');
        // this.uvAttributeLocation = this.gl.getAttribLocation(this.program, 'in_uv');
    },

    getUniformsLocation: function () {
        this.matrixLocation = this.gl.getUniformLocation(this.program, "matrix");
    },

    createVaos: function () {
        models.furnitures.forEach((furniture) => {
            this.createVao(furniture)
        });
    },

    /**
     * Create Vertex Array Object associated with a single furniture
     * @param {Object} furniture 
     */
    createVao: function (furniture) {
        var gl = this.gl;

        //Create and enable Vertex Array Object
        furniture.vao = gl.createVertexArray();
        gl.bindVertexArray(furniture.vao);

        //Create VBO for vertices, normals and uv textures

        furniture.positionBuffer = this.initVbo(vertices, 3, this.positionAttributeLocation);
        //furniture.positionBuffer = this.initVbo(furniture.vertices, 3, this.positionAttributeLocation);
        // furniture.normalBuffer = this.initVbo(furniture.normals, 3, shadersGLSL.normalAttributeLocation);
        // furniture.uvBuffer = this.initVbo(furniture.textureCoordinates, 2, shadersGLSL.uvAttributeLocation);

        furniture.indicesBuffer = this.createIndicesBuffer(indices)
    },

    /**
     * Initialize a Vertex Buffer Object and set the data to be buffered in it.
     * @param {Array} data Data to be buffered
     * @param {Integer} dataSize Dimension of single data (e.g. vertices = 3)
     * @param {AttributeLocation} attributeLocation Pointer to a varible defined in the shaders 
     * @returns {Buffer} Buffer in which data are stored 
     */
    initVbo: function (data, dataSize, attributeLocation) {
        var gl = this.gl;
        var buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attributeLocation);

        //binds the buffer bound to gl.ARRAY_BUFFER to a vertex attribute of the current Vertex Buffer Object and specifies its layout.
        var normalized = false;
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(attributeLocation, dataSize, gl.FLOAT, normalized, stride, offset);

        return buffer;
    },

    /**
     * Initialize indices buffer
     * @param {Array} indices Indices array
     */
    createIndicesBuffer: function (indices) {
        var gl = this.gl;
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return buffer;
    },


    putAttributesOnGpu: function () {
        //#TODO
    },

    bindVertexArray: function () {
        //#TODO
    },

    sendUniformsToGpU: function () {
        //#TODO
    },

    drawObjects: function () {
        models.furnitures.forEach(furniture => {

            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            var perspectiveMatrix = utils.MakePerspective(90, this.gl.canvas.width/this.gl.canvas.height, 0.1, 100.0);//*****NEW*****//
            var viewMatrix = utils.MakeView(0.5, 0.0, 1.0, 0.0, -30.0);//*****NEW*****//
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
            
            this.gl.uniformMatrix4fv(this.matrixLocation, this.gl.FALSE, utils.transposeMatrix(projectionMatrix)); 
            this.gl.bindVertexArray(furniture.vao);
            
            this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
        });
    },
}