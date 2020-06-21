#version 300 es

precision highp float;

in vec2 fs_uv;
in vec3 fs_normal;
in vec3 fs_pos;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec4 ambientLightColor;
uniform vec4 diffuseLightColor;
uniform vec4 specularLightColor;
uniform float mix_texture;

uniform vec3 dirLightDirection;
uniform vec4 dirLightColor;
uniform vec3 pointLightPos;
uniform vec4 pointLightColor;
uniform float pointLightTarget;
uniform float pointLightDecay;

vec4 diffuseLambert(vec4 lightColor, vec3 normal, vec3 lightDir){
  vec4 lambert = clamp(dot(normal,lightDir),0.0,1.0) * lightColor;
  return lambert;
}

void main() {
  vec4 texture_col = texture(u_texture, fs_uv);
  vec3 normalVec = normalize(fs_normal);
  vec3 pointLightDirection = normalize(pointLightPos-fs_pos);
  vec4 pointLightCol = pointLightColor * pow(pointLightTarget/length(pointLightPos - fs_pos), pointLightDecay);

  //diffuse components
  vec4 diffDirectLight = diffuseLambert(dirLightColor,normalVec,dirLightDirection);
  vec4 diffPointLight =  diffuseLambert(pointLightCol,normalVec,pointLightDirection);

  vec4 diffColor = diffuseLightColor * (1.0 - mix_texture) + texture_col * mix_texture;
  //lambert diffuse
  vec4 diffuse = diffColor * (diffDirectLight + diffPointLight);

  //specular components
  //vec4 specColor = specularLightColor * (1.0 - mix_texture) + texture_col * mix_texture;
  //vec4 specular = [0.0, 0.0, 0.0, 0.0];

  //ambient component
  vec4 ambient = ambientLightColor * texture_col;

  outColor = clamp(ambient + diffuse, 0.0, 1.0);
}