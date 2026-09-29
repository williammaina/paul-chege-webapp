(()=>{var b=`#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`,x=`#version 300 es
precision highp float;
out vec4 o;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;      // 0..1, -1 when the pointer has left
uniform float uFade;       // entry fade, 0..1

/* Simplex-ish value noise. Cheap, and at this scale indistinguishable
   from the real thing once it is warped and blurred by the palette. */
vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
                 dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
                 dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q  = uv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.035;

  // Domain warp: noise sampled at coordinates that are themselves noisy.
  // This is what turns flat bands into something that looks like weather.
  vec2 w = vec2(fbm(q * 1.6 + vec2(0.0, t)), fbm(q * 1.6 + vec2(4.7, -t)));
  float n = fbm(q * 2.1 + w * 1.5 + vec2(t * 0.7, 0.0));
  n = n * 0.5 + 0.5;

  /* The first palette had all three stops within a few percent of each
     other, which rendered as flat navy \u2014 technically a shader, visually
     nothing. These are spread far enough apart to actually read. */
  vec3 deep = vec3(0.006, 0.027, 0.058);
  vec3 mid  = vec3(0.055, 0.156, 0.266);
  vec3 lift = vec3(0.122, 0.290, 0.443);
  vec3 col  = mix(deep, mid, smoothstep(0.18, 0.66, n));
  col = mix(col, lift, smoothstep(0.55, 0.96, n));

  // Gold, kept to the crests so it reads as light catching an edge rather
  // than as a colour wash.
  float crest = smoothstep(0.68, 0.99, n);
  col += vec3(0.92, 0.73, 0.30) * crest * 0.46;

  // A second, slower band of gold low on the left, echoing the section
  // below. Anchored to uv so it does not swim with the aspect ratio.
  col += vec3(0.85, 0.66, 0.24) * 0.10 *
         smoothstep(0.55, 0.0, distance(uv, vec2(0.16, 0.12))) *
         (0.6 + 0.4 * sin(uTime * 0.25)) * 1.7;

  // The pointer warms what it passes over. Nothing moves; only the light.
  if (uMouse.x >= 0.0){
    float d = distance(q, uMouse * vec2(uRes.x / uRes.y, 1.0));
    col += vec3(0.95, 0.76, 0.34) * 0.18 * smoothstep(0.45, 0.0, d);
  }

  // Grain. A gradient this large and this dark bands badly without it.
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.016;

  // Darkest at the top, where the sticky header sits over it, lifting
  // toward the horizon \u2014 the same move the dark sections below make.
  col *= mix(0.62, 1.12, smoothstep(0.0, 0.85, uv.y));

  o = vec4(col * uFade, 1.0);
}`;function w(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;let t=document.querySelector(".hero-bg");if(!t)return;let a=document.createElement("canvas");a.className="hero-gl";let e=a.getContext("webgl2",{antialias:!1,alpha:!1,powerPreference:"low-power"});if(!e)return;let s=(h,f)=>{let y=e.createShader(h);if(e.shaderSource(y,f),e.compileShader(y),!e.getShaderParameter(y,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(y));return y},r=e.createProgram();if(e.attachShader(r,s(e.VERTEX_SHADER,b)),e.attachShader(r,s(e.FRAGMENT_SHADER,x)),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(r));e.useProgram(r);let n=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let c=e.getAttribLocation(r,"p");e.enableVertexAttribArray(c),e.vertexAttribPointer(c,2,e.FLOAT,!1,0,0);let o={res:e.getUniformLocation(r,"uRes"),time:e.getUniformLocation(r,"uTime"),mouse:e.getUniformLocation(r,"uMouse"),fade:e.getUniformLocation(r,"uFade")},i=()=>Math.min(devicePixelRatio||1,1.25),l=()=>{let h=Math.max(1,Math.round(t.clientWidth*i())),f=Math.max(1,Math.round(t.clientHeight*i()));a.width===h&&a.height===f||(a.width=h,a.height=f,e.viewport(0,0,h,f),e.uniform2f(o.res,h,f))};t.prepend(a),t.classList.add("hero-gl-on"),l(),new ResizeObserver(l).observe(t);let d=-1,m=-1;t.addEventListener("pointermove",h=>{let f=t.getBoundingClientRect();d=(h.clientX-f.left)/f.width,m=1-(h.clientY-f.top)/f.height},{passive:!0}),t.addEventListener("pointerleave",()=>{d=m=-1});let p=!0;new IntersectionObserver(([h])=>{p=h.isIntersecting},{rootMargin:"80px"}).observe(t);let u=performance.now(),v=0,g=h=>{p&&(v=Math.min(1,v+.02),e.uniform1f(o.time,(h-u)/1e3),e.uniform2f(o.mouse,d,m),e.uniform1f(o.fade,v),e.drawArrays(e.TRIANGLES,0,3)),requestAnimationFrame(g)};requestAnimationFrame(g)}function A(){if(matchMedia("(prefers-reduced-motion: reduce)").matches||!matchMedia("(hover: hover)").matches)return;let t=".btn-gold, .btn-dark, .btn-mpesa, .cart",a=.32,e=1.7,s=null,r=0,n=0,c=0,o=0,i=0,l=()=>{c+=(r-c)*.18,o+=(n-o)*.18,s&&s.style.setProperty("--mag",`${c.toFixed(2)}px, ${o.toFixed(2)}px`),Math.abs(r-c)>.1||Math.abs(n-o)>.1?i=requestAnimationFrame(l):(i=0,!r&&!n&&s&&(s.style.removeProperty("--mag"),s=null))},d=()=>{i||(i=requestAnimationFrame(l))};addEventListener("pointermove",m=>{let u=m.target.closest?.(t)||s;if(!u)return;let v=u.getBoundingClientRect(),g=m.clientX-(v.left+v.width/2),h=m.clientY-(v.top+v.height/2);if(!(Math.abs(g)<v.width/2*e&&Math.abs(h)<v.height/2*e)){r=n=0,d();return}s&&s!==u&&s.style.removeProperty("--mag"),s=u,r=g*a,n=h*a,d()},{passive:!0}),addEventListener("pointerdown",()=>{r=n=0,d()},{passive:!0}),addEventListener("blur",()=>{r=n=0,d()})}function M(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;let t=[...document.querySelectorAll(".ep-grid, .speak-grid")];if(!t.length)return;let a=!1,e=new IntersectionObserver(i=>{a=i.some(l=>l.isIntersecting),a&&!n&&(n=requestAnimationFrame(o))},{rootMargin:"60px"});t.forEach(i=>e.observe(i));let s=window.scrollY,r=0,n=0,c=0;function o(){let i=window.scrollY,l=i-s;s=i,r+=(l-r)*.16;let d=Math.max(-1,Math.min(1,r/58));for(let m of t)m.style.setProperty("--sv",d.toFixed(4));if(Math.abs(r)<.05&&Math.abs(l)<.5?c++:c=0,!a||c>30){for(let m of t)m.style.setProperty("--sv","0");n=0;return}n=requestAnimationFrame(o)}addEventListener("scroll",()=>{c=0,a&&!n&&(n=requestAnimationFrame(o))},{passive:!0})}function E(){if(matchMedia("(prefers-reduced-motion: reduce)").matches||!matchMedia("(hover: hover)").matches||navigator.connection&&navigator.connection.saveData)return;let t=240,a=780,e=new Map;function s(r){if(e.has(r))return e.get(r);let n=[1,2,3].map(o=>`https://i.ytimg.com/vi/${r}/hq${o}.jpg`),c=Promise.all(n.map(o=>new Promise(i=>{let l=new Image;l.onload=()=>i(o),l.onerror=()=>i(null),l.src=o}))).then(o=>o.filter(Boolean));return e.set(r,c),c}document.querySelectorAll(".ep, .ep-hero").forEach(r=>{let n=r.dataset.vid,c=r.querySelector(".ep-frame");if(!n||!c)return;let o=null,i=0,l=0,d=0,m=!1,p=()=>{m=!1,clearTimeout(l),clearInterval(i),o&&o.classList.remove("on")};r.addEventListener("pointerenter",()=>{clearTimeout(l),l=setTimeout(async()=>{let u=await s(n);u.length&&r.matches(":hover")&&(o||(o=document.createElement("span"),o.className="ep-preview",c.appendChild(o)),m=!0,d=0,o.style.backgroundImage=`url("${u[0]}")`,o.classList.add("on"),clearInterval(i),i=setInterval(()=>{if(!m)return clearInterval(i);d=(d+1)%u.length,o.style.backgroundImage=`url("${u[d]}")`},a))},t)}),r.addEventListener("pointerleave",p),r.addEventListener("pointercancel",p)})}function L(){if(matchMedia("(prefers-reduced-motion: reduce)").matches||!matchMedia("(hover: hover)").matches)return;let t=null,a=0,e=.5,s=.5,r=()=>{a=0,t&&(t.style.setProperty("--px",((e-.5)*2).toFixed(3)),t.style.setProperty("--py",((s-.5)*2).toFixed(3)))};addEventListener("pointermove",n=>{let c=n.target.closest?.(".service-card.tilt");if(c!==t&&(t&&(t.style.removeProperty("--px"),t.style.removeProperty("--py")),t=c),!t)return;let o=t.getBoundingClientRect();e=(n.clientX-o.left)/o.width,s=(n.clientY-o.top)/o.height,a||(a=requestAnimationFrame(r))},{passive:!0}),addEventListener("pointerdown",()=>{t&&(t.style.removeProperty("--px"),t.style.removeProperty("--py"),t=null)},{passive:!0})}try{w()}catch{}try{A()}catch{}try{M()}catch{}try{E()}catch{}try{L()}catch{}})();
