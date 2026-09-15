/* Pure analysis helpers: envelopes, phasors and steady-state transfer functions. */
const DynamicsDiagnostics=(()=>{
 const tau=2*Math.PI;
 function transfer(r,z){return {D:1/Math.hypot(1-r*r,2*z*r),phi:Math.atan2(2*z*r,1-r*r)};}
 function freeEnvelope(t,{m=1,k=tau*tau,z=0,x0=.01,v0=0}={}){if(z>=1)return null;const w=Math.sqrt(k/m),wd=w*Math.sqrt(1-z*z);return Math.hypot(x0,(v0+z*w*x0)/wd)*Math.exp(-z*w*t);}
 function harmonicInfo(p){const m=p.mass,k=p.stiffness,z=p.damping,fn=Math.sqrt(k/m)/tau,wn=tau*fn,omega=tau*p.frequency,r=p.frequency/fn,{D,phi}=transfer(r,z),X=D/k,c=2*z*Math.sqrt(k*m),T=1/p.frequency;return {m,k,z,fn,wn,omega,r,D,phi,X,c,T,delay:phi/omega,forcePeak:T/4,responsePeak:T/4+phi/omega};}
 function components(t,p){const q=harmonicInfo(p),steady=q.X*Math.sin(q.omega*t-q.phi),sv=q.omega*q.X*Math.cos(q.omega*t-q.phi),wd=q.wn*Math.sqrt(1-q.z*q.z),a=q.z*q.wn,A=q.X*Math.sin(q.phi),B=(-q.omega*q.X*Math.cos(q.phi)+a*A)/wd,e=Math.exp(-a*t),transient=e*(A*Math.cos(wd*t)+B*Math.sin(wd*t)),tv=e*((-a*A+wd*B)*Math.cos(wd*t)+(-a*B-wd*A)*Math.sin(wd*t)),envelope=Math.hypot(A,B)*e;
  return {...q,steady,sv,transient,tv,envelope,total:steady+transient,totalVelocity:sv+tv,lower:steady-envelope,upper:steady+envelope};}
 function phasors(p){const q=harmonicInfo(p),real=q.D*(1-q.r*q.r),imag=q.D*2*q.z*q.r;return {...q,spring:[q.D,0],inertia:[-q.r*q.r*q.D,0],damping:[0,imag],sum:[real,imag],resultMagnitude:Math.hypot(real,imag)};}
 return {transfer,freeEnvelope,harmonicInfo,components,phasors};
})();
if(typeof module!=='undefined')module.exports=DynamicsDiagnostics;
