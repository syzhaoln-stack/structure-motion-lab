/* Linear teaching models. SI internally for SDOF; two-mass and beam modes use stated normalized coordinates. */
const Physics = (() => {
  const tau = 2 * Math.PI;
  function free(t, { m=1, k=tau*tau, z=0, x0=1, v0=0 }={}) {
    const w=Math.sqrt(k/m), a=z*w;
    let x,v;
    if(Math.abs(z-1)<1e-8){const b=v0+w*x0,e=Math.exp(-w*t);x=(x0+b*t)*e;v=(b-w*(x0+b*t))*e;}
    else if(z<1){const d=w*Math.sqrt(1-z*z),b=(v0+a*x0)/d,e=Math.exp(-a*t),c=Math.cos(d*t),s=Math.sin(d*t);x=e*(x0*c+b*s);v=e*(-a*(x0*c+b*s)+d*(-x0*s+b*c));}
    else {const s=Math.sqrt(z*z-1),r1=-w*(z-s),r2=-w*(z+s),A=(v0-r2*x0)/(r1-r2),B=x0-A;x=A*Math.exp(r1*t)+B*Math.exp(r2*t);v=r1*A*Math.exp(r1*t)+r2*B*Math.exp(r2*t);}
    return {x,v,a:-2*z*w*v-w*w*x};
  }
  function harmonic(t,{r=1,z=.06,m=1,k=tau*tau,F0=1,rest=true}={}){
    if(z===0&&r===1){if(!rest)throw new RangeError('Undamped resonance has no finite steady state.');const w=Math.sqrt(k/m),A=F0/(2*k),x=A*(Math.sin(w*t)-w*t*Math.cos(w*t)),v=A*w*w*t*Math.sin(w*t),F=F0*Math.sin(w*t);return {x,v,a:(F-k*x)/m,F,D:Infinity,phase:Math.PI/2};}
    const w=Math.sqrt(k/m),om=w*r,den=Math.hypot(1-r*r,2*z*r),D=1/den,phase=Math.atan2(2*z*r,1-r*r),A=F0/k*D;
    let x=A*Math.sin(om*t-phase),v=A*om*Math.cos(om*t-phase);
    if(rest){const h=free(t,{m,k,z,x0:A*Math.sin(phase),v0:-A*om*Math.cos(phase)});x+=h.x;v+=h.v;}
    const F=F0*Math.sin(om*t);return {x,v,a:(F-2*z*Math.sqrt(k*m)*v-k*x)/m,F,D,phase};
  }
  function step(t,{z=.04,w=tau}={}){if(t<0)return {x:0,v:0};const f=free(t,{k:w*w,z});return {x:1-f.x,v:-f.v};}
  function pulse(t,{duration=.5,z=.04}={}){const a=step(t,{z}),b=step(t-duration,{z});return {x:a.x-b.x,v:a.v-b.v,F:t>=0&&t<duration?1:0};}
  function modes(t,{pattern='one',coupling=1}={}){
    const w1=tau*.65,w2=w1*Math.sqrt(1+2*coupling);
    let q1=pattern==='opposite'?0:pattern==='together'?1:.5;
    let q2=pattern==='together'?0:pattern==='opposite'?1:.5;
    q1*=Math.cos(w1*t);q2*=Math.cos(w2*t);
    return {x1:q1+q2,x2:q1-q2,q1,q2,f1:w1/tau,f2:w2/tau};
  }
  const betas=[1.875104068711961,4.694091132974175,7.854757438237612];
  function beamShape(s,n=1,type='simple'){
    if(type==='simple')return Math.sin(n*Math.PI*s);
    const b=betas[n-1],sig=(Math.cosh(b)+Math.cos(b))/(Math.sinh(b)+Math.sin(b));
    const raw=u=>Math.cosh(b*u)-Math.cos(b*u)-sig*(Math.sinh(b*u)-Math.sin(b*u));
    return raw(s)/Math.abs(raw(1));
  }
  function beamFrequency(n=1,type='simple'){return type==='simple'?n*n:(betas[n-1]/betas[0])**2;}
  function filter(t,{natural=1,z=.07,amplitudes=[1,1,1]}={}){
    const ratios=[.5,1,1.8],parts=ratios.map((f,i)=>{const amp=amplitudes[i],r=f/natural,D=1/Math.hypot(1-r*r,2*z*r),phase=Math.atan2(2*z*r,1-r*r);return {f,amp,phase,input:amp*Math.sin(tau*f*t),output:amp*D*Math.sin(tau*f*t-phase),D};});
    return {F:parts.reduce((s,p)=>s+p.input,0),x:parts.reduce((s,p)=>s+p.output,0),parts};
  }
  return {tau,free,harmonic,pulse,modes,beamShape,beamFrequency,filter};
})();
if(typeof module!=='undefined')module.exports=Physics;
