const height = 500;
const width = 700;

const data = [
	{
		x: 0.5,
		y: 0.5,
		color: 'rgba(123, 100, 50, 1)',
		id: 1,
		msg: '第一个点',
	},
	{
		x: 0.0,
		y: 1.0,
		color: 'rgba(150, 0, 100, 1)',
		id: 2,
		msg: '第二个点',
	},
	{
		x: 0.0,
		y: -1.0,
		color: 'rgba(0, 112, 222, 1)',
		id: 3,
		msg: '第三个点',
	},
	{
		x: -1.0,
		y: -1.0,
		color: 'rgba(100, 112, 100, 1)',
		id: 4,
		msg: '第四个点',
	},
	{
		x: 1.0,
		y: -1.0,
		color: 'rgba(0, 56, 90, 1)',
		id: 5,
		msg: '第五个点',
	},
];

const VSHADER_SOURCE = `
attribute vec4 position;
varying vec4 _color;
attribute vec4 color;
attribute float picking;
void main() {
  gl_Position = position;
  gl_PointSize = 20.0;
  if (bool(picking)) {
    _color = vec4(1.0, 0.0, 0.0, 1.0);
  } else {
    _color = color;
  }
}`;
const FSHADER_SOURCE = `
precision mediump float;  // 表示着色器中配置的 float 对象会占用中等尺寸内存
varying vec4 _color;
void main() {
  float d = distance(gl_PointCoord, vec2(0.5,0.5));
  if(d < 0.5){
    gl_FragColor = _color;
  } else {
    discard;
  }
}`;

window.onload = function () {
	const canvas = getCanvas();
	const tooltip = new Tooltip(canvas.parentElement);
	const windgl = new WindGL(canvas, VSHADER_SOURCE, FSHADER_SOURCE);

	// disable render back face
	windgl.enableCullFace();

	const offScreenFBO = windgl.createFrameBufferObject();
	if (!offScreenFBO) {
		console.log(`创建帧缓存失败`);
		return;
	}

	const SIZE = Float32Array.BYTES_PER_ELEMENT;

	// offscreen buffer bind shader attributes
	const offScreenData = new Float32Array(
		data.reduce((p, c) => {
			const colorArr = Utils.id2color(c.id);
			Utils.pushItems(
				p,
				c.x,
				c.y,
				c.z || -1,
				colorArr[0] / 255,
				colorArr[1] / 255,
				colorArr[2] / 255,
				0.0
			);
			return p;
		}, [])
	);
	windgl
		.bindFramebuffer(offScreenFBO)
		.createBuffer({ data: offScreenData })
		.setPointerAttribute('position', {
			size: 3,
			type: windgl.gl.FLOAT,
			stride: 7 * SIZE,
			offset: 0 * SIZE,
		})
		.setPointerAttribute('color', {
			size: 4,
			type: windgl.gl.FLOAT,
			stride: 7 * SIZE,
			offset: 3 * SIZE,
		})
		.setPointerAttribute('picking', {
			size: 1,
			type: windgl.gl.FLOAT,
			stride: 7 * SIZE,
			offset: 6 * SIZE,
		});

	// 绘入显存
	windgl.gl.drawArrays(windgl.gl.POINTS, 0, data.length);

	// remind reset!
	windgl.bindFramebuffer(null);

	// screen buffer
	const screenData = new Float32Array(
		data.reduce((p, c) => {
			const colorArr = Utils.colorFormat(c.color, 'array');
			Utils.pushItems(
				p,
				c.x,
				c.y,
				c.z || -1,
				colorArr[0] / 255,
				colorArr[1] / 255,
				colorArr[2] / 255,
				1.0
			);
			return p;
		}, [])
	);
	windgl.bindFramebuffer(null);
	windgl
		.createBuffer({ data: screenData })
		.setPointerAttribute('position', {
			size: 3,
			type: windgl.gl.FLOAT,
			stride: 7 * SIZE,
			offset: 0 * SIZE,
		})
		.setPointerAttribute('color', {
			size: 4,
			type: windgl.gl.FLOAT,
			stride: 7 * SIZE,
			offset: 3 * SIZE,
		});

	// 绘入显存
	// clear(gl, [0.0, 0.0, 0.0, 1.0]);
	windgl.gl.drawArrays(windgl.gl.POINTS, 0, data.length);

	canvas.addEventListener('click', e => {
		const x = e.clientX;
		const y = e.clientY;
		const rect = e.target.getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			// 判断是否在物体上
			const xInCanvas = x - rect.left;
			const yInCanvas = rect.bottom - y;
			windgl.bindFramebuffer(offScreenFBO);
			const { pixels } = windgl.readPixels(xInCanvas, yInCanvas);
			windgl.bindFramebuffer(null);
			const index = Utils.color2id(pixels);
			if (index > 0) {
				const text = data.find(item => item.id === index).msg;
				tooltip.setLocation([xInCanvas, e.clientY - rect.top], { text });
			} else {
				tooltip.setLocation();
			}
			windgl
				.createBuffer({
					data: new Float32Array(
						[0.0, 0.0, 0.0, 0.0, 0.0].map((item, idx) => (idx + 1 === index ? 1.0 : 0.0))
					),
				})
				.setPointerAttribute('picking', {
					size: 1,
					type: windgl.gl.FLOAT,
					stride: 0,
					offset: 0,
				});

			// rerender
			windgl.gl.drawArrays(windgl.gl.POINTS, 0, data.length);
		}
	});
	// reset select
	// canvas.addEventListener('mouseleave', e => {
	// 	windgl
	// 		.createBuffer({
	// 			data: new Float32Array([0.0, 0.0, 0.0, 0.0, 0.0]),
	// 		})
	// 		.setPointerAttribute('picking', {
	// 			size: 1,
	// 			type: windgl.gl.FLOAT,
	// 			stride: 0,
	// 			offset: 0,
	// 		});
	// 	tooltip.setLocation();
	// 	windgl.gl.drawArrays(windgl.gl.POINTS, 0, data.length);
	// });
};

function getCanvas() {
	let canvas = document.querySelector('#webgl');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.setAttribute('id', 'webgl');
		canvas.setAttribute('height', '500');
		canvas.setAttribute('width', '700');
		document.body.appendChild(canvas);
	}
	return canvas;
}

class WindGL {
	constructor(canvas, VSHADER_SOURCE, FSHADER_SOURCE) {
		// preserveDrawingBuffer 保存缓存区数据，不设置 readPixels 读不到数据
		const gl =
			canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
			canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
		const program = gl.createProgram();
		const vShader = gl.createShader(gl.VERTEX_SHADER);
		const fShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vShader, VSHADER_SOURCE);
		gl.shaderSource(fShader, FSHADER_SOURCE);
		gl.compileShader(vShader);
		gl.compileShader(fShader);
		gl.attachShader(program, vShader);
		gl.attachShader(program, fShader);
		gl.linkProgram(program);
		gl.useProgram(program);
		this.gl = gl;
		this.program = program;
		return this;
	}
	createFrameBufferObject() {
		const gl = this.gl;
		// add texture
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		// add renderBuffer
		const renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		// create framebuffer
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
		// check status
		const res = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		// reset
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		if (res === gl.FRAMEBUFFER_COMPLETE) {
			return framebuffer;
		} else {
			return null;
		}
	}
	createBuffer(options) {
		const gl = this.gl;
		const { target = gl.ARRAY_BUFFER, data, usage = gl.STATIC_DRAW } = options;
		const buffer = gl.createBuffer();
		if (!buffer) {
			console.log('创建缓存区失败');
			return this;
		}
		gl.bindBuffer(target, buffer);
		if (data) {
			gl.bufferData(target, data, usage);
		}
		return this;
	}
	setPointerAttribute(attribute, options) {
		const gl = this.gl;
		const { size, type, normalized = false, stride = 0, offset = 0 } = options;
		const attributeIndex = gl.getAttribLocation(this.program, attribute);
		gl.vertexAttribPointer(attributeIndex, size, type, normalized, stride, offset);
		gl.enableVertexAttribArray(attributeIndex);
		return this;
	}
	bindFramebuffer(fbo) {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
		return this;
	}
	clear(color) {
		const gl = this.gl;
		gl.clearColor(...Utils.colorFormat(color, 'array'));
		gl.clear(gl.COLOR_BUFFER_BIT);
		return this;
	}
	enableCullFace() {
		this.gl.enable(this.gl.CULL_FACE);
		return this;
	}
	readPixels(x, y) {
		const gl = this.gl;
		const pixels = new Uint8Array(4);
		gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
		return {
			pixels,
		};
	}
}

class Tooltip {
	constructor(container) {
		const hash = Date.now();
		const tooltip = document.createElement('div');
		tooltip.classList = [`tooltip${hash}`];
		tooltip.style.position = 'absolute';
		tooltip.style.opacity = 0;
		tooltip.style.background = `#0f0`;
		tooltip.style.pointerEvents = `none`;
		container.appendChild(tooltip);
		this.tooltip = tooltip;
		this.container = container;
		return this;
	}
	setLocation(location, options = {}) {
		const { text, offset = [0, 0] } = options;
		if (location) {
			while (this.tooltip.hasChildNodes()) {
				this.tooltip.removeChild(this.tooltip.firstChild);
			}
			const textNode = document.createTextNode(text);
			this.tooltip.appendChild(textNode);
			const { top, left } = this.calcFitLocation(location);
			this.tooltip.style.opacity = 1;
			this.tooltip.style.top = `${top + offset[1]}px`;
			this.tooltip.style.left = `${left + offset[0]}px`;
		} else {
			this.tooltip.style.opacity = 0;
		}
		return this;
	}
	calcFitLocation(location) {
		const [x, y] = location;
		const containerRect = this.container.getBoundingClientRect();
		const rect = this.tooltip.getBoundingClientRect();
		let calcLeft = undefined;
		let calcTop = undefined;
		if (x > rect.width && x + rect.width / 2 < containerRect.width) {
			calcLeft = x - rect.width / 2;
		} else if (x <= rect.width) {
			calcLeft = x;
		} else if (x + rect.width / 2 >= containerRect.width) {
			calcLeft = x - rect.width;
		}
		if (y > 2 * rect.height && y < containerRect.height) {
			calcTop = y - rect.height;
		} else {
			calcTop = y;
		}
		return {
			left: calcLeft,
			top: calcTop,
		};
	}
}

class Utils {
	static id2color(i, target = []) {
		target[0] = (i + 1) & 255;
		target[1] = ((i + 1) >> 8) & 255;
		target[2] = (((i + 1) >> 8) >> 8) & 255;
		return target;
	}
	static color2id(color) {
		const [i1, i2, i3] = color;
		// id = 1 is no picked
		const index = i1 + i2 * 256 + i3 * 65536 - 1;
		return index;
	}
	// 颜色转换
	static colorFormat(color, format) {
		const reHex3 = /^#([0-9a-f]{3})$/;
		const reHex6 = /^#([0-9a-f]{6})$/;
		const reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
		const reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
		const reRgbaInteger = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
		const reRgbaPercent = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
		const reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
		const reHslaPercent = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
		let result = undefined;
		let output = undefined;
		// 归一化
		switch (true) {
			case reHex3.test(color): {
				let num = parseInt(reHex3.exec(color)[1], 16);
				result = [
					((num >> 8) & 0xf) | ((num >> 4) & 0x0f0),
					((num >> 4) & 0xf) | (num & 0xf0),
					((num & 0xf) << 4) | (num & 0xf),
					1,
				];
				break;
			}
			case reHex6.test(color): {
				let num = parseInt(reHex6.exec(color)[1], 16);
				result = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff, 1];
				break;
			}
			case reRgbInteger.test(color): {
				let num = reRgbInteger.exec(color);
				result = [num[1], num[2], num[3], 1];
				break;
			}
			case reRgbPercent.test(color): {
				let num = reRgbPercent.exec(color);
				const r = 255 / 100;
				result = [num[1] * r, num[2] * r, num[3] * r, 1];
				break;
			}
			case reRgbaInteger.test(color): {
				let num = reRgbaInteger.exec(color);
				result = [num[1], num[2], num[3], num[4]];
				break;
			}
			case reRgbaPercent.test(color): {
				let num = reRgbaPercent.exec(color);
				const r = 255 / 100;
				result = [num[1] * r, num[2] * r, num[3] * r, num[4]];
				break;
			}
			case reHslPercent.test(color): {
				let num = reHslPercent.exec(color);
				result = [num[1], num[2] * 2.55, num[3] * 2.55, 1];
				break;
			}
			case reHslaPercent.test(color): {
				let num = reHslaPercent.exec(color);
				result = [num[1], num[2] * 2.55, num[3] * 2.55, num[4]];
				break;
			}
		}
		if (!result) {
			return undefined;
		}
		result = result.map(item => Number(item).toFixed(0));
		switch (format) {
			// case 'hex3': {
			// 	output = `#${result[0].toString(16)[0]}${result[1].toString(16)[0]}${result[2].toString(16)[0]}`;
			// }
			case 'hex': {
				output = `#${result[0].toString(16)}${result[1].toString(16)}${result[2].toString(16)}`;
				break;
			}
			case 'rgb': {
				output = `rgb(${result[0]},${result[1]},${result[2]})`;
				break;
			}
			case 'rgba': {
				output = `rgba(${result[0]},${result[1]},${result[2]},${result[3]})`;
				break;
			}
			case 'hsl': {
				output = `hsl(${result[0]},${((result[1] * 100) / 255).toFixed(0)}%,${(
					(result[2] * 100) /
					255
				).toFixed(2)}%)`;
				break;
			}
			case 'hsla': {
				output = `hsl(${result[0]},${((result[1] * 100) / 255).toFixed(0)}%,${(
					(result[2] * 100) /
					255
				).toFixed(2)}%,${result[3]})`;
				break;
			}
			case 'array': {
				output = result;
				break;
			}
			default: {
				output = `rgba(${result[0]},${result[1]},${result[2]},${result[3]})`;
			}
		}
		return output;
	}
	static pushItems(target, ...items) {
		Array.prototype.push.apply(target, items);
		return target;
	}
}
