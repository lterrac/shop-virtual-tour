var canvas = {

    //TODO Find a way to use this if possible
    // canvas: document.getElementById("main_canvas"),

    // canvasWidth: this.canvas.clientWidth,

    // canvasHeigth: this.canvas.clientHeigth,

    // aspect: this.canvasWidth / this.canvasHeigth,

    // gl: this.canvas.getContext("webgl2"),
    
    canvas: null,

    canvasWidth: null,

    canvasHeigth: null,

    aspect: null,

    gl: null,

    init: async function() {        
        this.canvas = document.getElementById("main_canvas");
        console.log(this.canvas);
        
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
        this.gl.clearColor(0, 0, 0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
    },
}