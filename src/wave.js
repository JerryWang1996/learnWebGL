const width = 700;
const height = 500;

window.onload = () => {
	const VSHADER_SOURCE = `
  attribute vec4 position;
	attribute float size;
	varying vec4 _color;	// 内插
	attribute vec4 color;
	void main() {
		gl_Position = position;
		gl_PointSize = size;
		_color = color;
	}`;
	const FSHADER_SOURCE = `
  precision mediump float;  // 表示着色器中配置的 float 对象会占用中等尺寸内存
	varying vec4 _color;
	void main() {
		gl_FragColor = _color;
		// 圆点
    // float d = distance(gl_PointCoord, vec2(0.5,0.5));
    //   if(d < 0.5){
    //     gl_FragColor = _color;
    //   } else {
    //     discard;
    //   }
	}`;

	const { gl, program } = webGLinit(VSHADER_SOURCE, FSHADER_SOURCE);

	let start = 1;

	render();

	function render() {
		const data = createPoints(start);

		const SIZE = data.BYTES_PER_ELEMENT;
		const buffer = gl.createBuffer();
		if (!buffer) {
			console.log('创建缓存区失败。');
			return -1;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, 'position');
		gl.vertexAttribPointer(position, 3, gl.FLOAT, false, SIZE * 8, 0);
		gl.enableVertexAttribArray(position);
		const color = gl.getAttribLocation(program, 'color');
		gl.vertexAttribPointer(color, 4, gl.FLOAT, false, SIZE * 8, SIZE * 3);
		gl.enableVertexAttribArray(color);
		const size = gl.getAttribLocation(program, 'size');
		gl.vertexAttribPointer(size, 1, gl.FLOAT, false, SIZE * 8, SIZE * 7);
		gl.enableVertexAttribArray(size);

		// draw
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.POINTS, 0, data.length / 8);

		start--;

		// 逐帧渲染
		requestAnimationFrame(render);
	}
};

function getCanvas() {
	let canvas = document.querySelector('body>#webgl');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.setAttribute('id', 'webgl');
		canvas.setAttribute('height', '500');
		canvas.setAttribute('width', '700');
		document.body.appendChild(canvas);
	}
	return canvas;
}

function webGLinit(VSHADER_SOURCE, FSHADER_SOURCE) {
	const canvas = getCanvas();
	const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
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
	return {
		gl,
		program,
	};
}

function createPoints(gap) {
	//波动最大幅度 10px;
	const max = 10;
	const n = 100;
	const m = 10;
	const data = [];
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < m; j++) {
			const deg = i * 7 - j * 20 + gap;
			const x = webglX(-(width / 2) - 200 + i * ((width + 4000) / n) + j * 20);
			const y = webglY(-(height / 2) + Math.sin((Math.PI * deg) / 180) * (max + j * 3) + j * 20);
			const z = -1;
			pushItems(data, x, y, z, (9 - j) / m, j / m, (9 - j) / m, 1, 4 - j / 4);
		}
	}
	return new Float32Array(data);
}

function webglX(num) {
	return num / (width / 2);
}

function webglY(num) {
	return num / (height / 2);
}

function pushItems(target, ...items) {
	Array.prototype.push.apply(target, items);
	return target;
}
