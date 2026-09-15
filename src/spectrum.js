/* Selected single-frequency steady response. Playback never changes frequency.
   Ax is in metres; displayed displacement is X = 100 Ax in centimetres. */
const SpectrumLab=(()=>{
 const B='#1664b7',O='#b84f19',T='#0b746c',V='#8655a3',INK='#536575',GRID='#c4d2df',INPUT=2;
 let p,observer,last=0;
 const $=s=>document.querySelector(s),f=(x,n=2)=>Number(x).toFixed(n);
 const tick=x=>Number.isInteger(x)?String(x):String(Number(x.toFixed(2)));
 function info(a=p,r=a.frequency/a.natural){const z=a.damping,D=1/Math.hypot(1-r*r,2*z*r),phi=Math.atan2(2*z*r,1-r*r),rp=Math.sqrt(1-2*z*z),peak=1/(2*z*Math.sqrt(1-z*z)),lo=Math.sqrt(1-2*z*z-2*z*Math.sqrt(1-z*z)),hi=Math.sqrt(1-2*z*z+2*z*Math.sqrt(1-z*z)),k=(Physics.tau*a.natural)**2;return {r,D,phi,rp,peak,lo,hi,k,Ax:a.force/k*D};}
 function setup(params){
  p=params;const r=p.frequency/p.natural,cases=[[.5,'低频'],[1,'共振'],[2,'高频']],selected=cases.some(([a])=>Math.abs(a-r)<1e-8);
  $('#frequency-strip').innerHTML='';
  const options=cases.map(([a,label])=>'<option value="'+a+'" '+(Math.abs(a-r)<1e-8?'selected':'')+'>'+label+' · '+a+' fₙ</option>').join('');
  $('#experiment-tools').innerHTML='<label class="case-select-label">频率<select id="single-case">'+options+'<option value="manual" '+(!selected?'selected':'')+'>手动设置</option></select></label>'+InstrumentScale.selector(p);
  $('#compact-views').hidden=false;
  $('#compact-views').innerHTML='<section class="compact-panel spectrum-main"><h3>动力放大 D · 峰高与峰宽</h3><canvas id="sweep-gain" role="img" aria-label="固定坐标动力放大曲线与阻尼比参考曲线"></canvas><small id="sweep-stats"></small></section><section class="compact-panel"><h3>幅值谱 · 外力 → 位移</h3><canvas id="sweep-lines" role="img" aria-label="同一频率的外力幅值牛顿与位移幅值厘米"></canvas><small id="sweep-pair"></small></section><section class="compact-panel"><h3>同频时程 · 幅值与相位</h3><canvas id="sweep-wave" role="img" aria-label="双纵轴固定坐标时程，左轴外力牛顿，右轴位移厘米"></canvas><small id="wave-scale-note"></small></section>';
  if(!observer){observer=new ResizeObserver(()=>draw(last));observer.observe($('#compact-views'));}draw(0);
 }
 function surface(id){
  const e=$('#'+id),r=e.getBoundingClientRect(),d=Math.min(3,devicePixelRatio||1);
  if(!r.width||!r.height)return null;
  e.width=Math.round(r.width*d);e.height=Math.round(r.height*d);e.dataset.scale=String(InstrumentScale.limit(p));
  const c=e.getContext('2d');c.scale(d,d);c.font='12px "Microsoft YaHei",sans-serif';c.lineJoin='round';
  // A small canvas must not create negative plot areas or silently lose its axes.
  if(r.height<60||r.width<200){e.dataset.insufficientSpace='true';c.fillStyle=INK;c.fillText('图表空间不足，请展开查看',5,Math.min(16,r.height-2));return null;}
  delete e.dataset.insufficientSpace;return {c,w:r.width,h:r.height};
 }
 function line(c,pts,color,dash=[],width=1.7){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.setLineDash(dash);c.lineWidth=width;c.stroke();c.setLineDash([]);}
 function text(c,value,x,y,color=INK,align='left'){c.fillStyle=color;c.textAlign=align;c.fillText(String(value),x,y);}
 function dot(c,x,y,color){c.fillStyle=color;c.beginPath();c.arc(x,y,3.5,0,7);c.fill();}
 function clip(c,l,top,right,bottom){c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();}
 function verticalTicks(c,values,y,l,right,side='left'){
  for(const value of values){const py=y(value),edge=side==='left'?l:right;
   line(c,[[edge,py],[edge+(side==='left'?-4:4),py]],INK,[],1);
   text(c,tick(value),edge+(side==='left'?-6:6),py+4,INK,side==='left'?'right':'left');
  }
 }
 function horizontalTicks(c,values,x,bottom){for(const value of values){const px=x(value);line(c,[[px,bottom],[px,bottom+4]],INK,[],1);text(c,tick(value),px,bottom+16,INK,'center');}}
 function gain(s,q,L){
  const {c,w,h}=s,l=L>=10000?47:39,right=w-12,top=22,bottom=h-24,x=r=>l+r/3*(right-l),y=d=>bottom-d/L*(bottom-top);
  text(c,'D',2,12);text(c,'f / fₙ',right,12,INK,'right');
  // The analytical frequency samples retain the narrow peak at ζ = .001.
  clip(c,l,top,right,bottom);
  c.fillStyle='#e4eceb';c.fillRect(x(q.lo),top,x(q.hi)-x(q.lo),bottom-top);
  if(bottom-top>=44)line(c,[[l,y(L/2)],[right,y(L/2)]],GRID,[2,3],.7);
  for(const [z,color] of [[.02,V],[.07,O],[.2,T]])line(c,InstrumentScale.ratios(z,3).map(r=>[x(r),y(info({...p,damping:z},r).D)]),color,[3,3],1);
  const ratios=InstrumentScale.ratios(p.damping,3).concat(q.lo,q.hi).filter(r=>r>=0&&r<=3).sort((a,b)=>a-b);
  line(c,ratios.map(r=>[x(r),y(info(p,r).D)]),B,[],2.4);
  line(c,[[x(q.lo),y(q.peak/Math.SQRT2)],[x(q.hi),y(q.peak/Math.SQRT2)]],T,[],3);c.restore();
  line(c,[[l,top],[l,bottom],[right,bottom]],INK,[],1);
  verticalTicks(c,bottom-top>=44?[0,L/2,L]:[0,L],y,l,right);horizontalTicks(c,[0,1,2,3],x,bottom);
  const currentX=x(Math.max(0,Math.min(3,q.r)));dot(c,currentX,y(Math.min(q.D,L)),B);
  if(q.peak>L)text(c,'↑ '+f(q.peak,1),Math.min(right-4,x(q.rp)+7),top+13,B,x(q.rp)+65>right?'right':'left');
  if(q.r>3)text(c,'→',right-12,bottom-7,B);
  const legendWidth=Math.min(174,right-l-50),step=legendWidth/3;
  [[.02,V],[.07,O],[.2,T]].forEach(([z,color],j)=>text(c,'ζ '+tick(z),l+j*step,12,color));
 }
 function spectra(s,q,L){
  const {c,w,h}=s,half=w/2,fullLabels=h>=85,top=20,bottom=h-(fullLabels?32:22),fmax=3*p.natural;
  for(const [j,color,label,amplitude,limit] of [[0,O,'F₀ (N)',p.force,INPUT],[1,B,'X (cm)',100*q.Ax,L]]){
   const l=j*half+(j&&L>=10000?45:37),right=(j+1)*half-10;
   const x=frequency=>l+frequency/fmax*(right-l),y=value=>bottom-value/limit*(bottom-top);
   text(c,label,l-5,12,color);
   if(!fullLabels)text(c,'f (Hz)',right,12,INK,'right');
   line(c,[[l,top],[l,bottom],[right,bottom]],INK,[],1);
   verticalTicks(c,bottom-top>=44?[0,limit/2,limit]:[0,limit],y,l,right);
   const frequencies=right-l>=94?[0,p.natural,2*p.natural,fmax]:[0,fmax];horizontalTicks(c,frequencies,x,bottom);
   if(fullLabels)text(c,'f (Hz)',(l+right)/2,h-1,INK,'center');
   const px=x(Math.max(0,Math.min(fmax,p.frequency))),py=y(Math.min(amplitude,limit));
   line(c,[[px,bottom],[px,py]],color,[],3);dot(c,px,py,color);
   if(amplitude>limit)text(c,'↑',Math.min(right-9,px+5),top+12,color);
   if(p.frequency>fmax)text(c,'→',right-12,bottom-7,color);
  }
 }
 function waves(s,q,L,t){
  const {c,w,h}=s,l=34,right=w-(L>=10000?49:43),top=20,bottom=h-24,cy=(top+bottom)/2;
  const x=time=>l+time/4*(right-l),yf=value=>cy-value/INPUT*(bottom-top)/2,yx=value=>cy-value/L*(bottom-top)/2,X=100*q.Ax;
  text(c,'F (N)',2,12,O);text(c,'x (cm)',w-2,12,B,'right');text(c,'t (s)',(l+right)/2,12,INK,'center');
  line(c,[[l,top],[l,bottom],[right,bottom],[right,top]],INK,[],1);
  line(c,[[l,cy],[right,cy]],GRID,[2,3],1);
  verticalTicks(c,[-INPUT,0,INPUT],yf,l,right);
  verticalTicks(c,[-L,0,L],yx,l,right,'right');horizontalTicks(c,[0,1,2,3,4],x,bottom);
  clip(c,l,top,right,bottom);
  for(const [color,amplitude,phase,y] of [[O,p.force,0,yf],[B,X,q.phi,yx]])line(c,Array.from({length:801},(_,j)=>[x(j/200),y(amplitude*Math.sin(Physics.tau*p.frequency*j/200-phase))]),color);
  c.restore();
  const time=((t%4)+4)%4;line(c,[[x(time),top],[x(time),bottom]],T,[3,3],1);
  dot(c,x(time),yf(InstrumentScale.clamp(p.force*Math.sin(Physics.tau*p.frequency*time),INPUT)),O);
  dot(c,x(time),yx(InstrumentScale.clamp(X*Math.sin(Physics.tau*p.frequency*time-q.phi),L)),B);
  if(X>L){text(c,'↑',right-13,top+12,B);text(c,'↓',right-13,bottom-3,B);}
 }
 function draw(t){
  last=t;if(!p||!$('#sweep-gain'))return;
  const q=info(),L=InstrumentScale.limit(p),X=100*q.Ax,overflow=X>L;
  $('#sweep-stats').textContent='峰 '+f(q.peak,1)+' · 半功率带宽 '+f((q.hi-q.lo)*p.natural,4)+' Hz';
  $('#sweep-pair').textContent='f '+f(p.frequency)+' Hz · F₀ '+f(p.force,1)+' N → X '+f(X)+' cm'+(overflow?' ↑ 超量程':'');
  $('#wave-scale-note').textContent='位移滞后 '+f(q.phi*180/Math.PI,1)+'°'+(overflow?' · ↑ X='+f(X)+' cm 超量程':'');
  $('#wave-scale-note').style.color=overflow?O:'';
  $('#sweep-lines').setAttribute('aria-label','幅值谱，频率 '+f(p.frequency)+' 赫兹，外力幅值 '+p.force+' 牛顿，位移幅值 '+f(X)+' 厘米；外力固定零到2牛顿，位移固定零到'+L+'厘米'+(overflow?'，位移超量程':''));
  // Large displacement ranges need not flatten the dimensionless resonance peak.
  // This mapping depends only on the manually selected range, never on parameters.
  const gainLimit=Math.min(L,600);
  let s=surface('sweep-gain');if(s){$('#sweep-gain').dataset.scale=String(gainLimit);gain(s,q,gainLimit);}
  s=surface('sweep-lines');if(s)spectra(s,q,L);
  s=surface('sweep-wave');if(s)waves(s,q,L,t);
 }
 return {setup,draw,info};
})();

