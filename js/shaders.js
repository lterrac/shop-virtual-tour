var shaders = {

    positionAttributeLocation: null,

    normalAttributeLocation: null,

    uvAttributeLocation: null,

    vertexShader: null,

    fragmentShader: null,

    program: null,

    gl: null,

    initProgram: function() {
        this.gl = canvas.gl;
        this.compileShaders();
        this.linkShaders();
        this.getAttributesLocation();
        this.getUniformsLocation();
        this.createVaos();
        this.putAttributesOnGpu();
    },

    /**
     * Compile and load shaders
     */
    compileShaders: function() {
        shaderUrl = "http://127.0.0.1:8000/shaders/";
        utils.loadFiles([shaderUrl + "vertex_shader.glsl", shaderUrl + "fragment_shader.glsl"],
                        shadersText => {
                            this.vertexShader = utils.createShader(this.gl, this.gl.VERTEX_SHADER, shadersText[0]);
                            this.fragmentShader = utils.createShader(this.gl, this.gl.FRAGMENT_SHADER, shadersText[1]);
                        });
    },

    linkShaders: function() {
        this.program = utils.createProgram(this.gl, this.vertexShader, this.fragmentShader);
    },

    getAttributesLocation: function() {
        this.positionAttributeLocation = gl.getAttribLocation(this.program, 'in_pos');
        this.normalAttributeLocation = gl.getAttribLocation(this.program, 'in_norm');
        this.uvAttributeLocation = gl.getAttribLocation(this.program, 'in_uv');
    },

    getUniformsLocation: function() {
        //#TODO
    },

    createVaos: function() {
        models.furnitures.forEach( (name, furniture) => {
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
        furniture.positionBuffer = this.initVbo(furniture.vertices, 3, shaders.positionAttributeLocation);
        furniture.normalBuffer = this.initVbo(furniture.normals, 3, shaders.normalAttributeLocation);
        furniture.uvBuffer = this.initVbo(furniture.uvBuffer, 2, shaders.uvAttributeLocation);

        furniture.indicesBuffer = this.createIndicesBuffer(furniture.indices)

    },

    /**
     * Initialize a Vertex Buffer Object and set the data to be buffered in it.
     * @param {Array} data Data to be buffered
     * @param {Integer} dataSize Dimension of single data (e.g. vertices = 3)
     * @param {AttributeLocation} attributeLocation Pointer to a varible defined in the shaders 
     * @returns {Buffer} Buffer in which data are stored 
     */
    initVbo: function (data, dataSize, attributeLocation) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data).gl.STATIC_DRAW);
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
    createIndicesBuffer: function(indices) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return buffer;
    },


    putAttributesOnGpu: function() {
        //#TODO
    },

    bindVertexArray: function() {
        //#TODO
    },

    sendUniformsToGpU: function() {
        //#TODO
    },

    drawObjects: function() {
        //#TODO
    },
}