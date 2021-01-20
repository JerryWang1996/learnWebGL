const height = 500;
const width = 700;

window.onload = function () {
	const VSHADER_SOURCE = `
  attribute vec4 a_Position;
	attribute float a_PointSize;
	void main() {
		gl_Position = a_Position;
		gl_PointSize = a_PointSize;
	}`;
	const FSHADER_SOURCE = `
  precision mediump float;  // 表示着色器中配置的 float 对象会占用中等尺寸内存
	uniform vec4 vColor;
	void main() {
		gl_FragColor = vColor;
  }`;

	const { gl, program } = webGLinit(VSHADER_SOURCE, FSHADER_SOURCE);
	// 获取变量
	const aPosition = gl.getAttribLocation(program, 'a_Position');
	// 更改变量方法一
	gl.vertexAttrib3f(aPosition, 0.0, 0.0, 0.0);
	// // 更改变量方法二
	// const p = new Float32Array([1.0, 1.0, 1.0]);
	// gl.vertexAttrib3fv(aPosition, p);

	// vertexAttrib3fv 这个函数是典型的GLSL语法命名规范
	// vertexAttrib 函数功能
	// 3：对应需要传3个参数，或者是几维向量
	// f：表示参数是float类型
	// v：表示传入的为一个vector变量，可选，支持数组和散列两种形式

	// aPointSize 同上
	const aPointSize = gl.getAttribLocation(program, 'a_PointSize');
	gl.vertexAttrib1f(aPointSize, 20.0);
	const vColor = gl.getUniformLocation(program, 'vColor');
	gl.uniform4f(vColor, 1.0, 1.0, 1.0, 1.0);
	// gl.uniform4fv(vColor, new Float32Array([1.0, 0.0, 0.0, 1.0]));

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.POINTS, 0, 1);
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
