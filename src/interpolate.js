const width = 700;
const height = 500;

window.onload = () => {
	const VSHADER_SOURCE = `
  attribute vec4 position;
  attribute float size;
  varying vec4 _color;  // varying 实现内插
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

	const data = createPoints(10, 20, [0, -1]);
	const SIZE = data.mutilData.BYTES_PER_ELEMENT; //数组中每个元素所占的字节数
	const buffer = gl.createBuffer();
	if (!buffer) {
		console.log('创建缓存区失败。');
		return -1;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data.mutilData, gl.STATIC_DRAW);
	const position = gl.getAttribLocation(program, 'position');
	gl.vertexAttribPointer(position, 3, gl.FLOAT, false, SIZE * 7, 0);
	gl.enableVertexAttribArray(position);
	const color = gl.getAttribLocation(program, 'color');
	gl.vertexAttribPointer(color, 3, gl.FLOAT, false, SIZE * 7, SIZE * 3);
	gl.enableVertexAttribArray(color);
	const size = gl.getAttribLocation(program, 'size');
	gl.vertexAttribPointer(size, 1, gl.FLOAT, false, SIZE * 7, SIZE * 6);
	gl.enableVertexAttribArray(size);

	// 绘制缓存区中画的多个顶点
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.POINTS, 0, 200);
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

function createPoints(row, col, offset = [0, 0]) {
	const position = [];
	const color = [];
	const size = [];
	const mutilData = [];
	for (let r = 0; r < row; r++) {
		for (let c = 0; c < col; c++) {
			// 原始计算公式
			// const x = (-(width / 2) + (width / (col - 1)) * c) / (width / 2);
			// 化简
			const x = -1 + (2 * c) / (col - 1) + offset[0];
			const y = -1 + (2 * r) / (row - 1) + offset[1];
			const z = -1;
			pushItems(position, x, y, z);
			pushItems(color, (x + 1) / 2, (y + 1) / 2, (z + 1) / 2);
			pushItems(size, ((c + r) * 10) / (col + row));
			pushItems(
				mutilData,
				x,
				y,
				z,
				(x + 1) / 2,
				(y + 1) / 2,
				(z + 1) / 2,
				((c + r) * 10) / (col + row)
			);
		}
	}
	return {
		position: new Float32Array(position),
		color: new Float32Array(color),
		size: new Float32Array(size),
		mutilData: new Float32Array(mutilData),
	};
}

function pushItems(target, ...items) {
	Array.prototype.push.apply(target, items);
	return target;
}
