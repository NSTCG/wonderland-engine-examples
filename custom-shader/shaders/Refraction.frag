#include "lib/Compatibility.frag"

/* With "shader features" you can let the editor know that this
 * shader supports toggleable variations.
 *
 * Any feature declaration needs to define a symbol like so:
 * #define FEATURE_<FeatureName>
 *
 * When you activate feature "FEATURE_FOO" in the editor,
 * it will define "FOO" such that you can check its presence */
#define FEATURE_TEXTURED
#define USE_VIEW_POSITION
#define USE_POSITION_WORLD
#define USE_NORMAL
#define USE_TEXTURE_COORDS /* provides fragTextureCoords */
#define USE_MATERIAL_ID /* provides fragMaterialId */

/* The shader may use optional features that supply it with
 * additional information */
// #define USE_VIEW_POSITION
// uniform highp vec3 viewPositionWorld;

// #define USE_LIGHTS
// #if NUM_LIGHTS > 0
// #include "lib/Lights.frag"
// #endif

/* To read vertex shader output, declare the desired values
 * here before including Inputs.frag. Only request the data
 * you really need for improved performance.
 * For a list of all values, check Inputs.frag. */

#include "lib/Inputs.frag"
#include "lib/Textures.frag"
#include "lib/Materials.frag"
#include "lib/Math.glsl"
#include "lib/CoordinateSystems.glsl"

/* This structure is essential. Wonderland Editor will look
 * for it and parse the material properties to generate UI
 * from it.
 * If a uint property ends with "*Texture", it will be regarded
 * as a texture, only 2D textures are currently supported. */
struct Material {
    mediump uint skyboxTexture;
    mediump float eta;
    mediump uint useRefraction;
};

highp vec2 rescaleUV(highp vec2 uv, highp vec2 size) {
    /* Rescale and intercept uv to reduce the seam from
     * missing bound and compression error. */
    return (uv*(size - vec2(1.0)) + vec2(0.5))/size;
}

/* Wonderland Engine does some material packing magic and
 * automatically generates the matching unpacking code
 * if it finds this snippet in a shader. */
Material decodeMaterial(uint matIndex) {
    {{decoder}}
    return mat;
}

void main() {
    Material mat = decodeMaterial(fragMaterialId);
    //vec3 dir = normalize(fragPositionWorld - viewPositionWorld);
    vec3 dir = normalize(fragPositionWorld - viewPositionWorld);
    vec3 normal = normalize(fragNormal);

    vec3 reflected;
    if(mat.useRefraction > 0u) {
        reflected = refract(dir, normal, mat.eta);
    } else {
        reflected = reflect(dir, normal);
    }
    highp vec2 uv = cartesianToEquirectangular(reflected);
    vec3 color = textureAtlas(mat.skyboxTexture, uv).rgb;
    outColor = vec4(color, 1.0);
}
