var models = {

    furnituresName: [
        'bed',
    ],

    furnitures: {
        'bed': null,
    },

    gl: null,

    /**
     * Load models from file
     */
    loadModels: function () {
        this.furnituresName.forEach(furnitureName => {
            this.loadModel(furnitureName);
            this.createVao(furnitureName);
        });
    },

    /**
     * Load a single model in memory
     * @param {String} furnitureName 
     */
    loadModel: function (furnitureName) {
        furnitureUrl = "http://127.0.0.1:8000/models/" + furnitureName + "/" + furnitureName;
        utils.get_json(furnitureUrl + ".json",
            model => {
                //Extract model's data
                this.furnitures[furnitureName] = {};
                this.furnitures[furnitureName].model = model;
                this.furnitures[furnitureName].vertices = model.meshes[0].vertices;
                this.furnitures[furnitureName].indices = [].concat.apply([], model.meshes[0].faces)
                this.furnitures[furnitureName].textureCoordinates = model.meshes[0].texturecoords[0];
                this.furnitures[furnitureName].normals = model.meshes[0].normals;
                this.furnitures[furnitureName].texture = canvas.gl.createTexture();

                var texture = this.furnitures[furnitureName].texture;
                this.gl = canvas.gl;
                var gl = this.gl;

                //Create and set texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);

                var image = new Image();
                //Done for security reason
                image.crossOrigin = "anonymous";
                image.src = furnitureUrl + ".png";

                image.onload = function () {
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    gl.generateMipmap(gl.TEXTURE_2D);
                };
            });
    },

    /**
     * Create Vertex Array Object associated with a single furniture
     * @param {String} furnitureName 
     */
    createVao: function (furnitureName) {
        var gl = this.gl;
        var furniture = this.furnitures[furnitureName];

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
    
    /**
     * Updates the object local and world matrices, the View and the perspetcive matrix
    */
    updateTransformationMatrices: function () {
        //#TODO Review 
        this.updateModels();
        this.updateView();
        this.updatePerspective();
    },

    /**
     * Update local and world matrices
     */
    updateModels: function () {
        //#TODO
    },

    /**
     * Update view matrix
     */
    updateView: function () {
        //#TODO
    },

    /**
     * Update perspective matrix
     */
    updatePerspective: function () {
        //#TODO
    },
}