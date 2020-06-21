#version 300 es

precision mediump float;

in vec2 fs_uv;
in vec3 fs_normal;
in vec3 fs_pos;

out vec4 outColor;

uniform sampler2D u_texture;

void main() {

  outColor = texture(u_texture, fs_uv);
}