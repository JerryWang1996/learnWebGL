const height = 500;
const width = 700;

window.onload = function () {
	// 着色器语言使用的是GLSL ES语言，所以在 js 中需要将之存放在字符串中，等待调用编译
	// 顶点着色器代码
	const VSHADER_SOURCE = `
	void main() {
		gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
		gl_PointSize = 10.0;
	}`;
	// 片元着色器代码
	const FSHADER_SOURCE = `
	void main() {
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }`;

	// // 绘制圆点
	// const FSHADER_SOURCE = `
	// #ifdef GL_ES
	// precision mediump float;
	// #endif
	// void main() {
	// float d = distance(gl_PointCoord, vec2(0.5,0.5));
	//   if(d < 0.5){
	//     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	//   } else {
	//     discard;
	//   }
	// }`;

	const { gl } = webGLinit(VSHADER_SOURCE, FSHADER_SOURCE);
	// 设置清空颜色缓冲时的颜色
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// 清空颜色缓冲
	gl.clear(gl.COLOR_BUFFER_BIT);
	// 开始画点
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
	// 获取 canvas 对象
	const canvas = getCanvas();
	// 创建 WebGL 对象
	const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	// 创建渲染程序
	const program = gl.createProgram();
	// 创建顶点着色器 Vertex shader
	const vShader = gl.createShader(gl.VERTEX_SHADER);
	// 创建片元着色器 Fragment shader
	const fShader = gl.createShader(gl.FRAGMENT_SHADER);
	// shader 容器与着色器代码绑定
	gl.shaderSource(vShader, VSHADER_SOURCE);
	gl.shaderSource(fShader, FSHADER_SOURCE);
	// 将 GLSE 语言编译成浏览器可用代码
	gl.compileShader(vShader);
	gl.compileShader(fShader);
	// 将着色器添加到程序上
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);

	// 测试链接之前重新编译
	// const FSHADER_SOURCE_TEST = `
	// void main() {
	// 	gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
	// }`;
	// gl.shaderSource(fShader, FSHADER_SOURCE_TEST);
	// gl.compileShader(fShader);
	// gl.attachShader(program, fShader);

	// 链接程序，在链接操作执行以后，可以任意修改 shader 的源代码，对 shader 重新编译不会影响整个程序，除非重新链接程序
	gl.linkProgram(program);
	// 加载并使用链接好的程序
	gl.useProgram(program);

	// 测试链接之后重新编译
	// const FSHADER_SOURCE_TEST = `
	// void main() {
	// 	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	// }`;
	// gl.shaderSource(fShader, FSHADER_SOURCE_TEST);
	// gl.compileShader(fShader);
	// gl.attachShader(program, fShader);

	return {
		gl,
		program,
	};
}
