/* Function to linearly interpolate between a0 and a1
 * Weight w should be in the range [0.0, 1.0]
 */
function interpolate(a0, a1, w) {
    /* // You may want clamping by inserting:
     * if (0.0 > w) return a0;
     * if (1.0 < w) return a1;
     */
    return (a1 - a0) * w + a0;
    /* // Use this cubic interpolation [[Smoothstep]] instead, for a smooth appearance:
     * return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
     *
     * // Use [[Smootherstep]] for an even smoother result with a second derivative equal to zero on boundaries:
     * return (a1 - a0) * ((w * (w * 6.0 - 15.0) + 10.0) * w * w * w) + a0;
     */
}

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Create pseudorandom direction vector
function randomGradient(ix, iy) {
    // No precomputed gradients mean this works for any number of grid coordinates
    let w = 32n;
    let s = w / 2n; // rotation width
    let m = (1n << w) - 1n;

    let a = BigInt(ix) % m;
    let b = BigInt(iy) % m;
    a = (a * 3284157443n) % m;
    b = (b ^ (a << s) | (a >> w - s)) % m;
    b = (b * 1911520717n) % m;
    a = (a ^ (b << s) | (b >> w - s)) % m;
    a = (a * 2048419325n) % m;
    a = Number(a);

    let random = a * (3.14159265 / /* ~(~0u >> 1) */ 2147483648); // in [0, 2*Pi]
    return new Vector2(Math.cos(random), Math.sin(random));
}

// Computes the dot product of the distance and gradient vectors.
function dotGridGradient(ix, iy, x, y) {
    // Get gradient from integer coordinates
    let gradient = randomGradient(ix, iy);

    // Compute the distance vector
    let dx = x - ix;
    let dy = y - iy;

    // Compute the dot-product
    return (dx * gradient.x + dy * gradient.y);
}

// Compute Perlin noise at coordinates x, y
function noise(x, y) {
    // Determine grid cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Determine interpolation weights
    // Could also use higher order polynomial/s-curve here
    let sx = x - x0;
    let sy = y - y0;

    // Interpolate between grid point gradients
    let n0, n1, ix0, ix1, value;

    n0 = dotGridGradient(x0, y0, x, y);
    n1 = dotGridGradient(x1, y0, x, y);
    ix0 = interpolate(n0, n1, sx);

    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    ix1 = interpolate(n0, n1, sx);

    value = interpolate(ix0, ix1, sy);
    return value; // Will return in range -1 to 1. To make it in range 0 to 1, multiply by 0.5 and add 0.5
}

function noiseFBM(x, y, options) {
    let amplitude = options.amplitude;
    let frequency = options.frequency;
    let value = 0;

    for (let i = 0; i < options.octaves; i++) {
        value += amplitude * noise(frequency * x, frequency * y);
        frequency *= options.lacunarity;
        amplitude *= options.gain;
    }

    return value;
}

function mapColors(value) {
    if (value < 0.25) {
        return "#0000ff";
    } else if (value < 0.5) {
        return "#00ff00";
    } else if (value < 0.75) {
        return "#8b4513";
    } else {
        return "#ffffff";
    }
}

const WIDTH = 200;
const HEIGHT = 200;
const STEP = 0.1;

// Properties
let OCTAVES = 8;
let LACUNARITY = 0.5;
let GAIN = 0.5;
// Initial values
let amplitude = 1;
let frequency = 1;
let initialRow = 0;
let initialCol = 0;

const rootDiv = document.getElementById("root");

const configDiv = document.createElement("div");
let h3Config = document.createElement("h3");
h3Config.innerHTML = "Configuration";
configDiv.appendChild(h3Config);

let octavesDiv = document.createElement("div");
let octavesLabel = document.createElement("label");
octavesLabel.htmlFor = "octaves";
octavesLabel.innerHTML = "Octaves: " + OCTAVES;
octavesDiv.appendChild(octavesLabel);
let octavesSlider = document.createElement("input");
octavesSlider.type = "range";
octavesSlider.min = 1;
octavesSlider.max = 10;
octavesSlider.value = OCTAVES;
octavesSlider.oninput = function () {
    OCTAVES = parseInt(this.value);
    octavesLabel.innerHTML = "Octaves: " + OCTAVES;
    drawNoise();
};
octavesDiv.appendChild(octavesSlider);
configDiv.appendChild(octavesDiv);

let lacunarityDiv = document.createElement("div");
let lacunarityLabel = document.createElement("label");
lacunarityLabel.htmlFor = "lacunarity";
lacunarityLabel.innerHTML = "Lacunarity: " + LACUNARITY;
lacunarityDiv.appendChild(lacunarityLabel);
let lacunaritySlider = document.createElement("input");
lacunaritySlider.type = "range";
lacunaritySlider.min = 0.1;
lacunaritySlider.max = 2;
lacunaritySlider.step = 0.1;
lacunaritySlider.value = LACUNARITY;
lacunaritySlider.oninput = function () {
    LACUNARITY = parseFloat(this.value);
    lacunarityLabel.innerHTML = "Lacunarity: " + LACUNARITY;
    drawNoise();
}
lacunarityDiv.appendChild(lacunaritySlider);
configDiv.appendChild(lacunarityDiv);

let gainDiv = document.createElement("div");
let gainLabel = document.createElement("label");
gainLabel.htmlFor = "gain";
gainLabel.innerHTML = "Gain: " + GAIN;
gainDiv.appendChild(gainLabel);
let gainSlider = document.createElement("input");
gainSlider.type = "range";
gainSlider.min = 0.1;
gainSlider.max = 2;
gainSlider.step = 0.1;
gainSlider.value = GAIN;
gainSlider.oninput = function () {
    GAIN = parseFloat(this.value);
    gainLabel.innerHTML = "Gain: " + GAIN;
    drawNoise();
}
gainDiv.appendChild(gainSlider);
configDiv.appendChild(gainDiv);

let amplitudeDiv = document.createElement("div");
let amplitudeLabel = document.createElement("label");
amplitudeLabel.htmlFor = "amplitude";
amplitudeLabel.innerHTML = "Initial Amplitude: " + amplitude;
amplitudeDiv.appendChild(amplitudeLabel);
let amplitudeSlider = document.createElement("input");
amplitudeSlider.type = "range";
amplitudeSlider.min = 0.1;
amplitudeSlider.max = 2;
amplitudeSlider.step = 0.1;
amplitudeSlider.value = amplitude;
amplitudeSlider.oninput = function () {
    amplitude = parseFloat(this.value);
    amplitudeLabel.innerHTML = "Initial Amplitude: " + amplitude;
    drawNoise();
}
amplitudeDiv.appendChild(amplitudeSlider);
configDiv.appendChild(amplitudeDiv);

let frequencyDiv = document.createElement("div");
let frequencyLabel = document.createElement("label");
frequencyLabel.htmlFor = "frequency";
frequencyLabel.innerHTML = "Initial Frequency: " + frequency;
frequencyDiv.appendChild(frequencyLabel);
let frequencySlider = document.createElement("input");
frequencySlider.type = "range";
frequencySlider.min = 0.1;
frequencySlider.max = 2;
frequencySlider.step = 0.1;
frequencySlider.value = frequency;
frequencySlider.oninput = function () {
    frequency = parseFloat(this.value);
    frequencyLabel.innerHTML = "Initial Frequency: " + frequency;
    drawNoise();
}
frequencyDiv.appendChild(frequencySlider);
configDiv.appendChild(frequencyDiv);

rootDiv.appendChild(configDiv);

let h3Map = document.createElement("h3");
h3Map.innerHTML = "Color Map";
rootDiv.appendChild(h3Map);

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
rootDiv.appendChild(canvas);

let mouseDown = false;
canvas.addEventListener("mousedown", function () { mouseDown = true; });
canvas.addEventListener("mouseup", function () { mouseDown = false; });

canvas.addEventListener("mousemove", function (event) {
    if (mouseDown) {
        let diffCol = event.movementX;
        let diffRow = event.movementY;

        initialCol -= diffCol;
        initialRow -= diffRow;

        drawNoise();
    }
});

const ctx = canvas.getContext("2d");

function drawNoise() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let row = initialRow; row < initialRow + HEIGHT; row++) {
        for (let col = initialCol; col < initialCol + WIDTH; col++) {
            let nrow = row * STEP;
            let ncol = col * STEP;

            let value = noiseFBM(ncol, nrow, { frequency: frequency, amplitude: amplitude, octaves: OCTAVES, gain: GAIN, lacunarity: LACUNARITY });

            value = value * 0.5 + 0.5;
            let color = mapColors(value);

            let idx = ((row - initialRow) * WIDTH + (col - initialCol)) * 4;
            image.data[idx + 0] = parseInt(color.substring(1, 3), 16);
            image.data[idx + 1] = parseInt(color.substring(3, 5), 16);
            image.data[idx + 2] = parseInt(color.substring(5, 7), 16);
        }
    }

    ctx.putImageData(image, 0, 0);
}
