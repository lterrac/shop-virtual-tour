var camera = {
    /**
     * Camera position and rotation iables
     */
    cx: 0.0,
    cy: 0.0,
    cz: 0.0,
    elevation: 0.01,
    angle: 0.01,
    roll: 0.01,

    /**
     * Set limit to camera angles
     * #TODO Design choice to discuss
     * Should we remove this and use quaternions?
     */
    elevationRange: Math.PI / 2,
    angleRange: Math.PI / 2,
    rollRange: Math.PI / 2,

    /**
     * Rotation iables for quaternions
     * #TODO should we keep them or not?
     */
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    rvx: 0.0,
    rvy: 0.0,
    rvz: 0.0,

    /**
     * Compute the new camera position and rotation
    */
    cameraMovement: function () { },
};
