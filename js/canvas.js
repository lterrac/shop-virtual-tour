var canvasUtils = {
        
    canvas: null,

    canvasWidth: null,

    canvasHeigth: null,

    aspect: null,

    gl: null,

    initialize: function() {
        this.canvas = document.getElementById("main_canvas");
        
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeigth = this.canvas.clientHeigth;
        this.aspect = this.canvasWidth / this.canvasHeigth;
        
        this.gl = this.canvas.getContext("webgl2");
    },

    getCanvas: function () {

        if (!this.gl) {
            console.error("GL context not opened");
            return;
        }

        //Set the canvas
        utils.resizeCanvasToDisplaySize(this.canvas);
        this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeigth);
        this.gl.clearColor(0.85, 0.85, 0.85, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
    },
}