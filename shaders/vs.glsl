#version 300 es

in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;

out vec2 fs_uv;
out vec3 fs_normal;
out vec3 fs_pos;

uniform mat4 pMatrix;
uniform mat4 nMatrix; 
uniform mat4 wMatrix;


void main() {
  fs_pos = (wMatrix * vec4(in_position, 1.0)).xyz;
  fs_uv = in_uv;
  fs_normal = (nMatrix * vec4(in_normal, 1.0)).xyz;
  gl_Position = pMatrix * vec4(in_position,1.0);
}