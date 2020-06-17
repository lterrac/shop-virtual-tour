#version 300 es

in vec3 in_pos;
in vec3 in_norm;
in vec2 in_uv;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
    gl_Position = in_pos;
}