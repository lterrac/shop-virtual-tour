var models = {

    furnituresName: [
        'bed',
    ],

    furnitures: new Map(),

    gl: null,

    /**
     * Load models from file
     */
    loadModels: async function () {
        this.furnituresName.forEach(furnitureName => {
            await this.loadModel(furnitureName);
        });
    },

    /**
     * Load a single model in memory
     * @param {String} furnitureName 
     */
    loadModel: async function (furnitureName) {
        furnitureUrl = "http://127.0.0.1:8000/models/" + furnitureName + "/" + furnitureName;
        await utils.get_json(furnitureUrl + ".json",
            model => {
                //Extract model's data
                this.furnitures.set(furnitureName, {});
                this.furnitures.get(furnitureName).model = model;
                this.furnitures.get(furnitureName).vertices = model.meshes[0].vertices;
                this.furnitures.get(furnitureName).indices = [].concat.apply([], model.meshes[0].faces)
                this.furnitures.get(furnitureName).textureCoordinates = model.meshes[0].texturecoords[0];
                this.furnitures.get(furnitureName).normals = model.meshes[0].normals;
                // this.furnitures.get(furnitureName).texture = canvas.gl.createTexture();

                // var texture = this.furnitures.get(furnitureName).texture;
                // this.gl = canvas.gl;
                // var gl = this.gl;

                // //Create and set texture
                // gl.activeTexture(gl.TEXTURE0);
                // gl.bindTexture(gl.TEXTURE_2D, texture);

                // var image = new Image();
                // //Done for security reason
                // image.crossOrigin = "anonymous";
                // image.src = furnitureUrl + ".png";

                // image.onload = function () {
                //     gl.bindTexture(gl.TEXTURE_2D, texture);
                //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                //     gl.generateMipmap(gl.TEXTURE_2D);
                // };
            });
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