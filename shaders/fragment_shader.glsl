#version 300 es

precision mediump float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

out vec4 out_col;

void main() {
    out_col = vec4(0.0,1.0,0.5, 1);
}