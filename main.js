'use strict';

let gl;
let model_color;                     
let model_color_c;                          
let model_vertex;              
let model_texture;               
let model_projection_matrix; 
let texture_map_unit;
let texture_buffer;   
let vertex_buffer;              
let index_buffer;                            
let rotator;       

let is_frame = false;
let distance = 9;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 }


// draws surface using indexes, vertices and textures
function draw_surface() {
    const index_num = 80;
    const indexes = [];
    const vertices = [];
    const textures = [];
    
    let projection = m4.perspective(Math.PI/distance, 2, 2, 12);
    let point_to_zero = m4.translation(0, 0, -10);
    let accumulation = m4.multiply(point_to_zero, rotate_matrix(deviceOrientation.alpha, deviceOrientation.beta, deviceOrientation.gamma));
    let view_projection = m4.multiply(projection, accumulation);
    
    resize_canvas(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(model_projection_matrix, false, view_projection);
    gl.uniform1i(texture_map_unit, 0);

     for (let i = 0; i<=index_num; i++) {
        for (let j = 0; j<=index_num; j++) {
            let u = (i/index_num)*Math.PI*4;
            let v = (j/index_num)*Math.PI*2;

            let x = -(2/15)*Math.cos(u)*(3*Math.cos(v) - 
            30*Math.sin(u) + 90*Math.pow(Math.cos(u), 4)*Math.sin(u) -
            60*Math.pow(Math.cos(u), 6)*Math.sin(u) +
            5*Math.cos(u)*Math.cos(v)*Math.sin(u));

            let y = -(1/15)*Math.sin(u)*(3*Math.cos(u) - 
            3*Math.pow(Math.cos(u), 2)*Math.cos(v) - 
            48*Math.pow(Math.cos(u), 4)*Math.cos(v) +
            48*Math.pow(Math.cos(u), 6)*Math.cos(v) -
            60*Math.sin(u) + 5*Math.cos(u)*Math.cos(v)*Math.sin(u) -
            5*Math.pow(Math.cos(u), 3)*Math.cos(v)*Math.sin(u) -
            80*Math.pow(Math.cos(u), 5)*Math.cos(v)*Math.sin(u) +
            80*Math.pow(Math.cos(u), 7)*Math.cos(v)*Math.sin(u) );

            let z = (2/15)*(3+5*Math.cos(u)*Math.sin(u))*Math.sin(v);

            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            textures.push(i/index_num);
            textures.push(j/index_num);
        }
    }

    for (let i = 0; i<index_num; i++) {
        for (let j = 0; j<index_num; j++) {
            const i0 = i*(index_num+1)+j;
            const i1 = i0+(index_num+1);
            indexes.push(i0);
            indexes.push(i1);
            indexes.push(i0+1);
            indexes.push(i0+1);
            indexes.push(i1);
            indexes.push(i1+1);
        }
    }


    gl.uniform4fv(model_color, [0.1, 0.2, 0.7, 1]);
    gl.uniform1f(model_color_c, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STREAM_DRAW);

    if (is_frame) {
        gl.disableVertexAttribArray(model_texture);
        gl.vertexAttrib2f(model_texture, 0.0, 0.0);
        gl.uniform1f(model_color_c, 1.0);
        gl.drawElements(gl.LINES, indexes.length, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.enableVertexAttribArray(model_texture);
        gl.bindBuffer(gl.ARRAY_BUFFER, texture_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);
        gl.vertexAttribPointer(model_texture, 2, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.TRIANGLES, indexes.length, gl.UNSIGNED_SHORT, 0);
    }

    gl.lineWidth(3);
    draw_primitive(gl.LINES, [1, 0, 0, 1], [-4, 0, 0, 4, 0, 0]);
    draw_primitive(gl.LINES, [0, 1, 0, 1], [0, -4, 0, 0, 4, 0]);
    draw_primitive(gl.LINES, [0, 0, 1, 1], [0, 0, -4, 0, 0, 4]);
    gl.lineWidth(1);

}


// draws primitive using vertices
function draw_primitive(type, color, vertices, texture_coords) {
    gl.uniform4fv(model_color, color);
    gl.uniform1f(model_color_c, 0.0);

    gl.enableVertexAttribArray(model_vertex);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.vertexAttribPointer(model_vertex, 3, gl.FLOAT, false, 0, 0);

    if (texture_coords) {
        gl.enableVertexAttribArray(model_texture);
        gl.bindBuffer(gl.ARRAY_BUFFER, texture_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_coords), gl.STREAM_DRAW);
        gl.vertexAttribPointer(model_texture, 2, gl.FLOAT, false, 0, 0);
    } else {
        gl.disableVertexAttribArray(model_texture);
        gl.vertexAttrib2f(model_texture, 0.0, 0.0);
        gl.uniform1f(model_color_c, 1.0);
    }
    gl.drawArrays(type, 0, vertices.length/3);
}


// calculates coordinates for matrix rotation
function rotate_matrix(alpha, beta, gamma) {
    const c = Math.PI/180;
    const x0 = Math.cos(beta? beta*c: 0);
    const y0 = Math.cos(gamma? gamma*c: 0);
    const z0 = Math.cos(alpha? alpha*c: 0);
    const x1 = Math.sin(beta? beta*c: 0);
    const y1 = Math.sin(gamma? gamma*c: 0);
    const z1 = Math.sin(alpha? alpha*c: 0);

    return [
        z0*y0 - z1*x1*y1, -x0*z1, y0*z1*x1 + z0*y1, 0,
        y0*z1 + z0*x1*y1, z0*x0, -x0*y1, 0,
        -x0*y1, x1, x0*y0, 0,
        0, 0, 0, 1
    ];
}


// sets size for canvas
function resize_canvas(canvas) {
    const pixel_ratio = window.devicePixelRatio;
    const {width, height} = canvas.getBoundingClientRect();
    const w = Math.round(width*pixel_ratio);
    const h = Math.round(height*pixel_ratio);
    const resize = canvas.width !== w || canvas.height !== h;

    if (resize) {
        canvas.width = w;
        canvas.height = h;
    }

    return resize;
}


// gets texture image(white photo)
function get_image() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = "https://www.marazzigroup.com/media/Marazzi_Grande_Solid_Color_Look_M38G.jpg.400x0_q500.jpg";
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    
    img.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        draw_surface();
    });
}


// initializes vertices, textures, colors
async function initGL() {
    let p = createProgram(gl, vertexShaderSource, fragmentShaderSource );
    gl.useProgram(p);

    model_vertex = gl.getAttribLocation(p, "vertex");
    model_texture = gl.getAttribLocation(p, "texCoord");
    model_projection_matrix = gl.getUniformLocation(p, "ModelViewProjectionMatrix");
    model_color = gl.getUniformLocation(p, "color");
    model_color_c = gl.getUniformLocation(p, "fColorCoef");
    texture_map_unit = gl.getUniformLocation(p, "u_texture");

    vertex_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();
    texture_buffer = gl.createBuffer();

    get_image();
    gl.enable(gl.DEPTH_TEST);
}



// creates and runs program
function createProgram(gl, shader_vertex, shader_fragment) {
    let shader_v = gl.createShader(gl.VERTEX_SHADER);
    let shader_f = gl.createShader(gl.FRAGMENT_SHADER);
    
    gl.shaderSource(shader_v, shader_vertex);
    gl.compileShader(shader_v);
    if (!gl.getShaderParameter(shader_v, gl.COMPILE_STATUS)) 
        throw new Error("Error " + gl.getShaderInfoLog(shader_v));
    
    gl.shaderSource(shader_f, shader_fragment);
    gl.compileShader(shader_f);
    if (!gl.getShaderParameter(shader_f, gl.COMPILE_STATUS)) 
        throw new Error("Error " + gl.getShaderInfoLog(shader_f));
    
    let p = gl.createProgram();
    gl.attachShader(p, shader_v);
    gl.attachShader(p, shader_f);
    gl.linkProgram(p);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) 
        throw new Error("Error " + gl.getProgramInfoLog(p));

    return p;
}


// event listener for program
async function init() {
    let canvas;
    
    window.addEventListener('deviceorientation', (e) => {
        deviceOrientation.alpha = e.alpha;
        deviceOrientation.beta = e.beta;
        deviceOrientation.gamma = e.gamma;
        draw_surface()
    })
    
    try {
        canvas = document.getElementById("draw");
        gl = canvas.getContext("webgl");
        if (!gl) throw "";
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Error</p>";
        document.getElementById('block').hidden = true;
        return;
    }

    try {
        await initGL();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Error</p>";
        document.getElementById('block').hidden = true;
        return;
    }

    rotator = new TrackballRotator(canvas, draw_surface, 0);
    draw_surface();
}

function showFrame(){
    is_frame = !is_frame;
    draw()
}