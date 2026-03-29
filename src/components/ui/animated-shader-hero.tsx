'use client';

import React, { useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

const useShaderBackground = (isDark: boolean) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    const fragmentSrc = UNIFIED_SHADER;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentSrc);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const isDarkLoc = gl.getUniformLocation(program, 'isDark');

    let active = true;

    const loop = (now: number) => {
      if (!active) return;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, now * 1e-3);
      gl.uniform1f(isDarkLoc, isDarkRef.current ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop(0);
    window.addEventListener('resize', resize);

    return () => {
      active = false;
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return canvasRef;
};

const Hero: React.FC<HeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  buttons,
  className = ""
}) => {
  const { theme } = useTheme();
  const canvasRef = useShaderBackground(theme === 'dark');

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain touch-none"
        style={{ background: 'black' }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
        {trustBadge && (
          <div className="mb-8 animate-hero-fade-down">
            <div className="flex items-center gap-2 px-6 py-3 bg-orange-500/10 backdrop-blur-md border border-orange-300/30 rounded-full text-sm">
              {trustBadge.icons && (
                <div className="flex">
                  {trustBadge.icons.map((icon, index) => (
                    <span key={index} className="text-orange-300">{icon}</span>
                  ))}
                </div>
              )}
              <span className="text-orange-100">{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div className="text-center space-y-6 max-w-5xl mx-auto px-4">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent animate-hero-fade-up [animation-delay:0.2s]">
              {headline.line1}
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent animate-hero-fade-up [animation-delay:0.4s]">
              {headline.line2}
            </h1>
          </div>

          <div className="max-w-3xl mx-auto animate-hero-fade-up [animation-delay:0.6s]">
            <p className="text-lg md:text-xl lg:text-2xl text-orange-100/90 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          {buttons && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-hero-fade-up [animation-delay:0.8s]">
              {buttons.primary && (
                <button
                  onClick={buttons.primary.onClick}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25"
                >
                  {buttons.primary.text}
                </button>
              )}
              {buttons.secondary && (
                <button
                  onClick={buttons.secondary.onClick}
                  className="px-8 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-300/30 hover:border-orange-300/50 text-orange-100 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  {buttons.secondary.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// UNIFIED SHADER: Molten Core + Aurora Streaks + Conflict Grid/Hotspots
// =====================================================================
const UNIFIED_SHADER = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform float isDark;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

// --- Noise functions ---
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=0.,a=1.;mat2 m=mat2(1.6,.8,-.8,1.6);for(int i=0;i<5;i++){t+=a*noise(p);p=m*p;a*=.5;}return t;}
float fbm3(vec2 p){float t=0.,a=.5;for(int i=0;i<3;i++){t+=a*noise(p);p*=2.;a*=.4;}return t;}

// --- Grid (map coordinates) ---
float grid(vec2 uv,float s){
  vec2 g=abs(fract(uv*s)-.5);
  return smoothstep(.02,.0,min(g.x,g.y));
}

void main(void){
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float r=length(uv);
  float globe=smoothstep(1.3,.15,r);

  // === LAYER 1: Deep atmosphere + turbulent haze ===
  float haze=fbm(uv*2.+vec2(T*.08,-T*.05));
  float haze2=fbm(uv*3.5+vec2(-T*.12,T*.06)+10.);
  col+=vec3(.10,.025,.008)*haze*globe;
  col+=vec3(.07,.018,.004)*haze2*globe;

  // === LAYER 2: Molten core lava underlay ===
  vec2 motion=vec2(T*.1,T*.04);
  vec2 lq=uv*3.;
  float ln1=fbm3(lq+motion);
  float ln2=fbm3(lq*2.-motion);
  float lava=ln1+ln2*.5;
  // Hot color ramp: black -> deep red -> orange -> yellow -> white-hot
  vec3 lc=mix(vec3(.08,0,0),vec3(.7,.18,0),smoothstep(.3,.45,lava));
  lc=mix(lc,vec3(.95,.45,0),smoothstep(.5,.6,lava));
  lc=mix(lc,vec3(1.,.85,.3),smoothstep(.7,.78,lava));
  // Radial mask — strongest near center
  float lavaMask=smoothstep(.9,.1,r)*globe*.35;
  col+=lc*lavaMask;

  // === LAYER 3: Aurora streaks ===
  vec2 shake=vec2(sin(T*1.2)*.003,cos(T*2.1)*.003);
  vec2 ap=(uv+shake)*mat2(6.,-4.,4.,6.);
  float auroraFbm=2.+fbm3(ap+vec2(T*5.,0.))*.5;
  vec3 auroraCol=vec3(0);
  for(float i=0.;i<12.;i++){
    vec2 v=ap+cos(i*i+(T+ap.x*.08)*.025+i*vec2(13.,11.))*3.5;
    v+=vec2(sin(T*3.+i)*.003,cos(T*3.5-i)*.003);
    float tailNoise=fbm3(v+vec2(T*.5,i))*.3*(1.-i/12.);
    // Dual palette: warm amber + cool teal
    vec3 ac=vec3(
      .15+.35*sin(i*.3+T*.4),
      .25+.4*cos(i*.25+T*.5),
      .55+.35*sin(i*.35+T*.3)
    );
    // Mix in warm tones
    ac=mix(ac,vec3(.8,.35,.08),.3+.2*sin(i));
    float contribution=exp(sin(i*i+T*.8))/length(max(v,vec2(v.x*auroraFbm*.015,v.y*1.5)));
    float thinness=smoothstep(0.,1.,i/12.)*.5;
    auroraCol+=ac*contribution*(1.+tailNoise*.8)*thinness;
  }
  col+=tanh(pow(auroraCol/80.,vec3(1.5)))*globe;

  // === LAYER 4: Grid lines (map coordinates) ===
  float g1=grid(uv+vec2(T*.02,0.),.8)*.04*globe;
  float g2=grid(uv*1.5+vec2(0.,T*.01),1.2)*.02*globe;
  col+=vec3(.4,.2,.1)*g1;
  col+=vec3(.2,.25,.35)*g2;

  // === LAYER 5: Conflict hotspot nodes ===
  for(float i=0.;i<7.;i++){
    float seed=i*1.618+.5;
    vec2 center=vec2(cos(seed*4.+T*.1)*.6,sin(seed*3.+T*.08)*.4);
    float d=length(uv-center);
    float pulse=.5+.5*sin(T*1.5+i*2.);
    float glow=(.005+.003*pulse)/d;
    vec3 hc=mix(vec3(1.,.3,.05),vec3(.9,.1,.02),fract(seed));
    col+=hc*glow*globe*.6;
  }

  // === LAYER 6: Comets / streaks ===
  float breathing=1.-.15*(sin(T*.2)*.5+.5);
  vec2 suv=uv*breathing;
  for(float i=1.;i<10.;i++){
    float phase=i*1.3+T*.35;
    vec2 offset=vec2(cos(phase+i)*.15,sin(phase*.7+i*i)*.1);
    suv+=offset*.1;
    vec2 p=suv;
    float d=length(p);
    col+=.005/d*(cos(sin(i)*vec3(.8,1.5,2.5))+1.)*globe;
    float b=noise(i+p+haze*1.7);
    col+=.006*b/length(max(p,vec2(b*p.x*.03,p.y)))*globe;
  }

  // === LAYER 7: Vignette + color grade ===
  col*=1.-r*r*.5;
  // Theme-aware grading
  vec3 darkGrade=col*vec3(1.05,.88,.75);
  vec3 lightGrade=col*vec3(.9,.85,.95);
  col=mix(lightGrade,darkGrade,isDark);

  O=vec4(col,1);
}`;

export default Hero;
