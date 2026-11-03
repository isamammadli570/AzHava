import moonPhoto from "@/assets/moon.webp";
import type {MoonView} from "@/helpers/moon";

/**
 * Draws the moon as a lit 3-D sphere with WebGL. The NASA full-moon photo is the surface: a full moon is lit from the
 * front, so the photo is (nearly) pure albedo, and an orthographic look-up maps any turned sphere back onto it.
 *
 * Light follows lunar photometry (Lommel–Seeliger: no darkening towards the edge at full moon, a soft fall-off to the
 * terminator) plus faint earthshine on the night side. One shared WebGL context renders every moon on the page and
 * each result is copied to that moon's own 2-D canvas, so thirty calendar moons cost one context, not thirty.
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
uniform vec3 light;
uniform vec2 libration;
uniform float pixel;
uniform float earthshine;

void main() {
    float radius = length(v);
    float edge = 1.0 - smoothstep(1.0 - pixel * 1.5, 1.0, radius);
    if (radius > 1.0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    vec3 normal = vec3(v, sqrt(max(0.0, 1.0 - radius * radius)));

    // Screen → moon frame: undo the libration.
    vec3 m = normal;
    float cy = cos(libration.x);
    float sy = sin(libration.x);
    m = vec3(cy * m.x + sy * m.z, m.y, -sy * m.x + cy * m.z);
    float cx = cos(libration.y);
    float sx = sin(libration.y);
    m = vec3(m.x, cx * m.y - sx * m.z, sx * m.y + cx * m.z);

    // Points turned just past the photo's edge reuse the edge itself.
    vec2 onPhoto = m.z >= 0.0 ? m.xy : normalize(m.xy);
    vec2 uv = vec2(onPhoto.x, -onPhoto.y) * 0.497 + 0.5;
    vec3 albedo = pow(texture2D(surface, uv).rgb, vec3(2.2));

    float incidence = dot(normal, light);
    float lit = incidence > 0.0 ? 2.0 * incidence / (incidence + normal.z + 0.0001) : 0.0;
    lit = min(lit, 1.25) * smoothstep(-0.02, 0.07, incidence);

    vec3 color = pow(albedo * (lit + earthshine), vec3(1.0 / 2.2));
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

const loadSurface = (gl: WebGLRenderingContext) => {
    const image = new Image();
    image.decoding = "async";
    image.src = moonPhoto;
    void image.decode().then(() => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Mipmaps keep the small calendar moons from shimmering.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

    renderer = {
        gl,
        uniforms: {
            light: gl.getUniformLocation(program, "light"),
            libration: gl.getUniformLocation(program, "libration"),
            pixel: gl.getUniformLocation(program, "pixel"),
            earthshine: gl.getUniformLocation(program, "earthshine"),
        },
    };
    loadSurface(gl);
    return renderer;
};

export const supportsMoonRenderer = (): boolean => getRenderer() !== null;

/** Calls back once the moon photo is on the GPU (at once if it already is); returns an unsubscribe function. */
export const onMoonReady = (listener: () => void): (() => void) => {
    if (surfaceReady) {
        listener();
        return () => {};
    }
    readyListeners.add(listener);
    return () => readyListeners.delete(listener);
};

/** Draws the moon into `target` at its pixel size; false when it cannot (no WebGL or the photo is still loading). */
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
