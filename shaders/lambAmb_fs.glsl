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
//direct light
uniform vec3 dirLightDirection;
uniform vec4 dirLightColor;
//point light
uniform vec3 pointLightPos;
uniform vec4 pointLightColor;
uniform float pointLightTarget;
uniform float pointLightDecay;
//spotlights
uniform vec4 spotLight0Color;
uniform vec3 spotLight0Pos;
uniform vec3 spotLight0Dir;
uniform float spotLight0Decay;
uniform float spotLight0Target;
uniform float spotLight0ConeIn;
uniform float spotLight0ConeOut;

vec4 diffuseLambert(vec4 lightColor, vec3 normal, vec3 lightDir){
  vec4 lambert = clamp(dot(normal,lightDir),0.0,1.0) * lightColor;
  return lambert;
}

vec4 compSpotLightColor(vec4 lightColor,vec3 pos, vec3 lightDir,float decay, float target, float coneIn, float coneOut){
  float cosOut = cos(radians(spotLight0ConeOut / 2.0));
	float cosIn = cos(radians(spotLight0ConeOut * spotLight0ConeIn / 2.0));
  vec3 direction = normalize(pos - fs_pos);
  float cosAngle = dot(direction, lightDir);

  vec4 res = lightColor * pow(target / length(pos - fs_pos), decay) *
						clamp((cosAngle - cosOut) / (cosIn - cosOut), 0.0, 1.0);

  return res;
}

vec4 compPoinLightColor(vec4 lightColor,vec3 lightPos, float decay, float target){
  vec4 res = lightColor * pow(target/length(lightPos - fs_pos), decay);
  return res;
}

void main() {
  vec4 texture_col = texture(u_texture, fs_uv);
  vec3 normalVec = normalize(fs_normal);

  vec3 pointLightDirection = normalize(pointLightPos-fs_pos);
  vec4 pointLightCol = compPoinLightColor(pointLightColor, pointLightPos, pointLightDecay, pointLightTarget);
  vec4 spotLight0Col = compSpotLightColor(spotLight0Color,spotLight0Pos,spotLight0Dir,spotLight0Decay,spotLight0Target,spotLight0ConeIn,spotLight0ConeOut);
  //diffuse components
  vec4 diffDirectLight = diffuseLambert(dirLightColor,normalVec,dirLightDirection);
  vec4 diffPointLight =  diffuseLambert(pointLightCol,normalVec,pointLightDirection);
  vec4 diffSpotLight0 = diffuseLambert(spotLight0Col,normalVec,spotLight0Dir);

  vec4 diffColor = diffuseLightColor * (1.0 - mix_texture) + texture_col * mix_texture;
  //lambert diffuse
  vec4 diffuse = diffColor * (diffDirectLight + diffPointLight + diffSpotLight0);

  //specular components
  //vec4 specColor = specularLightColor * (1.0 - mix_texture) + texture_col * mix_texture;
  //vec4 specular = [0.0, 0.0, 0.0, 0.0];

  //ambient component
  vec4 ambient = ambientLightColor * texture_col;

  outColor = clamp(ambient + diffuse, 0.0, 1.0);
}