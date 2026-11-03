import moonMap from "@/assets/moon-map.webp";
import moonRelief from "@/assets/moon-relief.webp";
import type {MoonView} from "@/helpers/moon";

/**
 * Draws the moon as a lit 3-D sphere with WebGL, from two NASA maps of the near side (SVS CGI Moon Kit, longitude
 * ±100°): the LRO colour map (2048², the surface) and a slope map made from the LOLA height map (512², the relief).
 * Every point of the visible face, the limb included, comes from its real map position.
 *
 * Light follows lunar photometry (Lommel–Seeliger: the full moon stays bright to its edge) on the relief-perturbed
 * surface, so crater walls and mountains catch the light and cast shade near the terminator, which itself fades
 * softly over the curve; the night side keeps faint earthshine. The sphere is drawn at twice the screen's density
 * for a crisp limb. One shared WebGL context renders every moon on the page and each result is copied to that moon's
 * own 2-D canvas, so thirty calendar moons cost one context, not thirty.
 */

const VERTEX = `
attribute vec2 a;
varying vec2 v;
void main() {
    v = a;
    gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 v;
uniform sampler2D surface;
uniform sampler2D relief;
uniform vec3 light;
uniform vec2 libration;
uniform float pixel;
uniform float earthshine;

const float PI = 3.14159265;
/** Longitude covered by the maps on each side of the central meridian (radians, 100°). */
const float LON_RANGE = 1.74533;
/** Slope of a full-scale relief texel (height over surface distance), exaggerated so the relief reads at this size. */
const float RELIEF = 0.147 * 4.0;

/** Screen frame → moon frame: undo the libration. */
vec3 toMoon(vec3 s) {
    float cy = cos(libration.x);
    float sy = sin(libration.x);
    s = vec3(cy * s.x + sy * s.z, s.y, -sy * s.x + cy * s.z);
    float cx = cos(libration.y);
    float sx = sin(libration.y);
    return vec3(s.x, cx * s.y - sx * s.z, sx * s.y + cx * s.z);
}

void main() {
    float radius = length(v);
    // One pixel of coverage falloff right on the limb: a clean, anti-aliased edge.
    float edge = clamp((1.0 - radius) / pixel + 0.5, 0.0, 1.0);
    if (edge <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    vec2 p = v / max(radius, 1.0);
    vec3 m = toMoon(vec3(p, sqrt(max(0.0, 1.0 - dot(p, p)))));
    vec3 sun = normalize(toMoon(light));
    vec3 eye = toMoon(vec3(0.0, 0.0, 1.0));

    // Moon frame → map: longitude east to the right, latitude north up.
    float longitude = atan(m.x, m.z);
    float latitude = asin(clamp(m.y, -1.0, 1.0));
    vec2 uv = vec2(0.5 + longitude / (2.0 * LON_RANGE), 0.5 - latitude / PI);

    // The map is evened out for science; more contrast brings back the look of the moon in the sky.
    vec3 albedo = pow(texture2D(surface, uv).rgb, vec3(2.2 * 1.4)) * 1.3;

    // Tilt the sphere's normal by the local slopes (east, north) for the relief.
    vec2 slope = (texture2D(relief, uv).rg - 0.5) * 2.0 * RELIEF;
    vec3 east = vec3(cos(longitude), 0.0, -sin(longitude));
    vec3 north = vec3(-sin(longitude) * sin(latitude), cos(latitude), -cos(longitude) * sin(latitude));
    vec3 normal = normalize(m - slope.x * east - slope.y * north);

    // Lommel–Seeliger blended with a little Lambert (a gentle darkening towards the terminator), all on the relief:
    // slopes facing the sun brighten, slopes facing away fall into shade, so craters stand out along the terminator.
    float incidence = max(dot(normal, sun), 0.0);
    float emergence = max(dot(normal, eye), 0.05);
    float lit = mix(2.0 * incidence / (incidence + emergence), 1.5 * incidence, 0.45);
    // Shadow edges on the relief, and the sphere's own terminator softened over a few degrees.
    lit *= smoothstep(0.0, 0.1, dot(normal, sun)) * smoothstep(-0.06, 0.1, dot(m, sun));

    vec3 color = pow(albedo * (min(lit, 1.3) * 1.1 + earthshine), vec3(1.0 / 2.2));
    gl_FragColor = vec4(color * edge, edge);
}`;

type Renderer = {
    gl: WebGLRenderingContext;
    uniforms: Record<"light" | "libration" | "pixel" | "earthshine", WebGLUniformLocation | null>;
};

let renderer: Renderer | null | undefined;
let surfaceReady = false;
const readyListeners = new Set<() => void>();

const compile = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

/** Loads an image into a texture unit with mipmaps (small calendar moons stay calm) and clamped edges. */
const loadTexture = async (gl: WebGLRenderingContext, unit: number, src: string, isSharp: boolean): Promise<void> => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    await image.decode();
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (isSharp) {
        // Towards the limb the map is seen at a grazing angle; anisotropic filtering keeps it sharp there.
        const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
        if (anisotropic) gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number));
    }
};

const loadMaps = (gl: WebGLRenderingContext) => {
    void Promise.all([loadTexture(gl, 0, moonMap, true), loadTexture(gl, 1, moonRelief, false)]).then(() => {
        surfaceReady = true;
        readyListeners.forEach((listener) => listener());
        readyListeners.clear();
    });
};

/** The shared renderer, created on first use; null when WebGL is not available (the disc then falls back to SVG). */
const getRenderer = (): Renderer | null => {
    if (renderer !== undefined) return renderer;
    renderer = null;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false});
    if (!gl) return null;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(program, "surface"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "relief"), 1);

    renderer = {
        gl,
        uniforms: {
            light: gl.getUniformLocation(program, "light"),
            libration: gl.getUniformLocation(program, "libration"),
            pixel: gl.getUniformLocation(program, "pixel"),
            earthshine: gl.getUniformLocation(program, "earthshine"),
        },
    };
    loadMaps(gl);
    return renderer;
};

export const supportsMoonRenderer = (): boolean => getRenderer() !== null;

/** Calls back once both moon maps are on the GPU (at once if they already are); returns an unsubscribe function. */
export const onMoonReady = (listener: () => void): (() => void) => {
    if (surfaceReady) {
        listener();
        return () => {};
    }
    readyListeners.add(listener);
    return () => readyListeners.delete(listener);
};

/** Draws the moon into `target` at its pixel size; false when it cannot (no WebGL or the maps are still loading). */
export const renderMoon = (target: HTMLCanvasElement, view: MoonView, earthshine: number): boolean => {
    const current = getRenderer();
    if (!current || !surfaceReady || target.width === 0) return false;
    const {gl, uniforms} = current;
    const {canvas} = gl;
    if (canvas.width !== target.width || canvas.height !== target.height) {
        canvas.width = target.width;
        canvas.height = target.height;
    }
    gl.viewport(0, 0, target.width, target.height);
    gl.uniform3fv(uniforms.light, view.light);
    gl.uniform2fv(uniforms.libration, view.libration);
    // One pixel of the target, in the shader's -1…1 disc units.
    gl.uniform1f(uniforms.pixel, 2 / target.width);
    gl.uniform1f(uniforms.earthshine, earthshine);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const context = target.getContext("2d");
    if (!context) return false;
    context.clearRect(0, 0, target.width, target.height);
    context.drawImage(canvas as HTMLCanvasElement, 0, 0);
    return true;
};
