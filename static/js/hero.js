// Hero background: a slow, warped gradient in the four site colours on black. WebGL 1, no libraries.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var panels = document.querySelectorAll('canvas.cloth');
  for (var i = 0; i < panels.length; i++) mount(panels[i], i);
  function mount(canvas, index) {
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) { canvas.remove(); return; } // the CSS gradient behind the canvas stands in

  var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var fs = [
    'precision mediump float;',
    'uniform vec2 r; uniform float t; uniform vec2 m; uniform float seed; uniform float quiet;',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / r; vec2 p = uv; p.x *= r.x / r.y;',
    // one wave, set at an angle, sliding across. u is the phase.
    // each panel draws its own cloth: angle, wavelength, lean, speed and dye all come from the seed
    '  float h1 = fract(sin(seed * 12.9898) * 43758.5453);',
    '  float h2 = fract(sin(seed * 78.233) * 43758.5453);',
    '  float h3 = fract(sin(seed * 39.425) * 43758.5453);',
    '  float h4 = fract(sin(seed * 93.989) * 43758.5453);',
    '  float h5 = fract(sin(seed * 57.114) * 43758.5453);',
    '  float ang = 0.25 + h1 * 1.25;',
    '  vec2 dir = vec2(cos(ang), sin(ang));',
    '  float wl = 1.7 + h2 * 1.6;',
    '  float lean = 0.3 + h3 * 0.45;',
    '  float speed = (0.18 + h4 * 0.22) * (h5 > 0.5 ? 1.0 : -1.0);',
    '  float u = dot(p, dir) * wl - t * speed + seed;',
    // a slumped fold: a sine with a little second harmonic so the crest leans
    '  float fold  = sin(u) + lean * sin(2.0 * u + 1.0);',
    '  float slope = cos(u) + 2.0 * lean * cos(2.0 * u + 1.0);',
    // where the crest folds over: a bright lip, then a hard shadow where the cloth tucks under itself
    '  float ph = fract((u - 0.9) / 6.2831853);',
    '  float lipd = ph * 34.0; float lip = exp(-lipd * lipd);',
    '  float shd = (ph - 0.07) * 14.0; float tuck = exp(-shd * shd);',
    // light from the left: the rising side is lit, the falling side is in shade
    '  float light = clamp(0.5 + 0.5 * slope + (m.x - 0.5) * 0.15, 0.0, 1.0);',
    '  light = light * (1.0 - 0.85 * tuck) + 0.6 * lip;',
    '  float sheen = pow(light, 10.0);',
    // the weave, faint
    // the mesh follows the surface: threads run along and across the fold, ride up over the crest,
    // and bunch together where the slope is steep, as a woven cloth would when it folds
    '  vec2 perp = vec2(-dir.y, dir.x);',
    '  float along  = dot(p, dir)  + fold * 0.10;',
    '  float across = dot(p, perp) + fold * 0.04;',
    '  float squeeze = 1.0 + 0.9 * max(-slope, 0.0);',
    '  float wu = fract(along * 16.0 * squeeze); float wv = fract(across * 16.0);',
    '  float lineU = smoothstep(0.30, 0.5, abs(wu - 0.5)); float lineV = smoothstep(0.30, 0.5, abs(wv - 0.5));',
    '  float threads = 1.0 - 0.22 * max(lineU, lineV) * (0.4 + 0.6 * light);',
    // dye: emerald in the troughs, sapphire on the crests, a little gold on the very top
    '  vec3 black = vec3(0.045, 0.045, 0.05);',
    '  vec3 emerald = vec3(0.0, 0.41, 0.31); vec3 sapphire = vec3(0.25, 0.44, 0.63); vec3 gold = vec3(0.63, 0.60, 0.38);',
    '  float h = clamp(0.5 + 0.5 * fold / 1.4, 0.0, 1.0);',
    '  vec3 trough = mix(emerald, sapphire, h4);',
    '  vec3 crest  = mix(sapphire, mix(emerald, gold, h2), h5);',
    '  vec3 dye = mix(trough, crest, h);',
    '  dye = mix(dye, gold, smoothstep(0.85, 1.0, h) * (0.2 + 0.4 * h3));',
    '  vec3 c = black + dye * (0.05 + 0.95 * light) * threads + vec3(0.85, 0.88, 0.9) * (sheen * 0.25 + lip * 0.18);',
    // vignette, and a quiet left side where a headline sits
    '  float vig = smoothstep(1.45, 0.3, length(uv - vec2(0.6, 0.5)));',
    '  c = mix(black, c, 0.3 + 0.7 * vig);',
    '  c = mix(c, black, smoothstep(0.55, 0.0, uv.x) * 0.45 * quiet);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('hero shader:', gl.getShaderInfoLog(s)); canvas.remove(); throw new Error('shader'); } return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('hero link:', gl.getProgramInfoLog(prog)); canvas.remove(); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
  var pathSeed = 0; for (var k = 0; k < location.pathname.length; k++) pathSeed = (pathSeed * 31 + location.pathname.charCodeAt(k)) % 997;
  gl.uniform1f(gl.getUniformLocation(prog, 'seed'), index * 2.7 + pathSeed * 0.013);
  gl.uniform1f(gl.getUniformLocation(prog, 'quiet'), canvas.hasAttribute('data-quiet') ? 1.0 : 0.0);

  var mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
  window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth; ty = 1 - e.clientY / window.innerHeight; }, { passive: true });

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    // render at reduced resolution; the gradient is soft and it keeps the fan quiet
    var scale = 0.6 * dpr;
    canvas.width = Math.max(1, Math.floor(w * scale)); canvas.height = Math.max(1, Math.floor(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  var start = performance.now(), visible = true, raf = 0, onscreen = true;
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { onscreen = es[0].isIntersecting; if (onscreen && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } }, { rootMargin: '80px' }).observe(canvas); }
  function frame(now) {
    mx += (tx - mx) * 0.015; my += (ty - my) * 0.015;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, (now - start) / 1000 + 40.0); gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduce && visible && onscreen) raf = requestAnimationFrame(frame);
  }
  size(); window.addEventListener('resize', function () { size(); if (reduce) frame(performance.now()); });
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
  raf = requestAnimationFrame(frame);
  }
})();
