const height = 500;
const width = 700;

window.onload = function () {
	// 着色器语言使用的是GLSL ES语言，所以在 js 中需要将之存放在字符串中，等待调用编译
	// 顶点着色器代码
	const VSHADER_SOURCE = `
	attribute vec4 position;
	attribute float size;
	varying vec4 _color;
	attribute vec4 color;
	void main() {
		gl_Position = position;
		gl_PointSize = size;
		_color = color;
	}`;
	// 片元着色器代码
	const FSHADER_SOURCE = `
	precision mediump float;  // 表示着色器中配置的 float 对象会占用中等尺寸内存
	varying vec4 _color;
	void main() {
		gl_FragColor = _color;
	}`;

	const { gl, program } = webGLinit(VSHADER_SOURCE, FSHADER_SOURCE);

	const data = new Float32Array([
		0.0,
		0.5,
		-1,
		1.0,
		0.0,
		0.0,
		10.0,

		-0.5,
		-0.5,
		-1,
		0.0,
		1.0,
		0.0,
		20.0,

		0.5,
		-0.5,
		-1,
		0.0,
		0.0,
		1.0,
		30.0,
	]);
	const SIZE = data.BYTES_PER_ELEMENT; //数组中每个元素所占的字节数
	const buffer = gl.createBuffer();
	if (!buffer) {
		console.log('创建缓存区失败。');
		return -1;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	const position = gl.getAttribLocation(program, 'position');
	gl.vertexAttribPointer(position, 3, gl.FLOAT, false, SIZE * 7, 0);
	gl.enableVertexAttribArray(position);
	const color = gl.getAttribLocation(program, 'color');
	gl.vertexAttribPointer(color, 3, gl.FLOAT, false, SIZE * 7, SIZE * 3);
	gl.enableVertexAttribArray(color);
	const size = gl.getAttribLocation(program, 'size');
	gl.vertexAttribPointer(size, 1, gl.FLOAT, false, SIZE * 7, SIZE * 6);
	gl.enableVertexAttribArray(size);

	// 设置清空颜色缓冲时的颜色
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// 清空颜色缓冲
	gl.clear(gl.COLOR_BUFFER_BIT);
	// 开始画点
	// gl.drawArrays(gl.POINTS, 0, 3);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
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
