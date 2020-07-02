#version 300 es

precision highp float;

in vec2 fs_uv;
in vec3 fs_normal;
in vec3 fs_pos;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec3 eyePos;
uniform vec4 ambientLightColor;
uniform vec4 diffuseLightColor;
uniform vec4 specularLightColor;
uniform float specShine;
uniform vec2 specularType;
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
uniform vec4 spotLightColor;
uniform vec3 spotLightPos;
uniform vec3 spotLightTargetPos;
uniform float spotLightDecay;
uniform float spotLightTarget;
uniform float spotLightConeIn;
uniform float spotLightConeOut;

//type of lights
vec4 compSpotLightColor(vec4 lightColor,vec3 lightPos, vec3 lightDir,float decay, float target, float coneIn, float coneOut){
  float cosOut = cos(radians(spotLightConeOut / 2.0));
	float cosIn = cos(radians(spotLightConeOut * spotLightConeIn / 2.0));
  vec3 direction = normalize(lightPos - fs_pos);
  float cosAngle = dot(direction, lightDir);

  vec4 res = lightColor * pow(target / length(lightPos - fs_pos), decay) *
						clamp((cosAngle - cosOut) / (cosIn - cosOut), 0.0, 1.0);

  return res;
}

vec4 compPointLightColor(vec4 lightColor,vec3 lightPos, float decay, float target){
  vec4 res = lightColor * pow(target/length(lightPos - fs_pos), decay);
  return res;
}

//BRDFs
vec4 diffuseLambert(vec4 lightColor, vec3 normal, vec3 lightDir){
  vec4 lambert = clamp(dot(normal,lightDir),0.0,1.0) * lightColor;
  return lambert;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normal, vec3 eyedir){
  // Phong
	vec3 reflection = -reflect(lightDir, normal);
	vec4 specularPhong = lightCol * pow(max(dot(reflection, eyedir), 0.0), specShine);
	return (specularPhong *  specularType.x);
}

void main() {
  vec4 texture_col = texture(u_texture, fs_uv);
  vec3 normalVec = normalize(fs_normal);
  vec3 eyedirVec = normalize(eyePos - fs_pos);
  vec3 spotLightDir = normalize(spotLightTargetPos - spotLightPos);

  //direct
  vec3 dirLightRelDir = dirLightDirection;
  //point light
  vec3 pointLightRelDir = normalize(pointLightPos - fs_pos);
  vec4 pointLightCol = compPointLightColor(pointLightColor, pointLightPos, pointLightDecay, pointLightTarget);
  //spotlight
  vec4 spotLightCol = compSpotLightColor(spotLightColor,spotLightPos,spotLightDir,spotLightDecay,spotLightTarget,spotLightConeIn,spotLightConeOut);
  vec3 spotLightRelDir = normalize(spotLightPos - fs_pos);

  //diffuse components
  vec4 diffDirectLight = diffuseLambert(dirLightColor,normalVec,dirLightRelDir);
  vec4 diffPointLight =  diffuseLambert(pointLightCol,normalVec,pointLightRelDir);
  vec4 diffSpotLight = diffuseLambert(spotLightCol,normalVec,spotLightDir);

  vec4 diffColor = diffuseLightColor * (1.0 - mix_texture) + texture_col * mix_texture;
  vec4 diffuse = diffColor * (diffDirectLight + diffPointLight + diffSpotLight);

  //specular components

  vec4 specDirectLight = compSpecular(dirLightRelDir, dirLightColor, normalVec, eyedirVec);
  vec4 specPointLight = compSpecular(pointLightRelDir, pointLightCol, normalVec, eyedirVec);
  vec4 specSpotLight = compSpecular(spotLightRelDir, spotLightCol, normalVec, eyedirVec);
  
  vec4 specular = (specDirectLight + specPointLight + specSpotLight) * specularLightColor;

  //ambient component
  vec4 ambient = ambientLightColor * texture_col;

  outColor = clamp(ambient + diffuse + specular, 0.0, 1.0);
}