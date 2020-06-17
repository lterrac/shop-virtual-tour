#version 300 es

in vec3 in_pos;
in vec3 in_norm;
in vec2 in_uv;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
    gl_Position = vec4(in_pos, 1.0);
    fs_uv = in_uv;
    fs_norm = in_norm; 
    fs_pos = in_pos;
}