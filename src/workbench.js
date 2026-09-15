/* A shared, compact instrument panel. Canvas coordinates use CSS pixels on every phone. */
const Workbench=(()=>{
 const $=s=>document.querySelector(s),B='#1664b7',O='#b84f19',G='#92a0ae',T='#0b746c',V='#7951a8';
 let state=null,lastT=0,observer;const fmt=(v,n=2)=>Number(v).toFixed(n);
 const panel=(id,title,note='')=>`<section class="compact-panel"><h3>${title}</h3><canvas id="${id}" aria-label="${title}" role="img"></canvas>${note?`<small>${note}</small>`:''}</section>`;
 function setup(i,p,sample,end,limit){
  const host=$('#compact-views');state={i,p,sample,end,limit,range:InstrumentScale.limit(p)};lastT=0;
  $('#focus-lab').hidden=i>4;host.hidden=i>4;
  const cases=i===2?[[-.04,'负阻尼：增长'],[0,'无阻尼：保持'],[.08,'正阻尼：衰减']]:[[.1,'准静力 · r = 0.1'],[1,'共振 · r = 1'],[5,'高频 · r = 5']],current=i===2?p.damping:i===3?p.frequency/(Math.sqrt(p.stiffness/p.mass)/Physics.tau):0,selected=cases.some(([v])=>Math.abs(v-current)<1e-7);
  $('#experiment-tools').innerHTML=i===2||i===3?`<label class="case-select-label">${i===2?'阻尼':'典型工况'}<select id="${i===2?'damping-case':'typical-case'}">${cases.map(([v,name])=>`<option value="${v}" ${Math.abs(v-current)<1e-7?'selected':''}>${name}</option>`).join('')}<option value="manual" ${!selected?'selected':''}>当前手动设置</option></select></label>`:'';
  if(i===3){$('#experiment-tools').insertAdjacentHTML('beforeend',InstrumentScale.selector(p));const q=DynamicsDiagnostics.harmonicInfo(p);state.q=q;$('#frequency-strip').innerHTML=`<span>外力频率 f<b>${fmt(p.frequency,3)} Hz</b></span><span>结构固有频率 fₙ<b>${fmt(q.fn,3)} Hz</b></span><span>频率比 f/fₙ<b>${fmt(q.r,2)}</b></span>`;}
  else $('#frequency-strip').innerHTML=i===2?`<p class="damping-state ${p.damping<0?'growing':''}">ζ = ${fmt(p.damping,3)} · ${p.damping<0?'负阻尼：能量流入，轨迹向外扩展':p.damping===0?'无阻尼：机械能保持':p.damping<1?'正阻尼：能量流出，轨迹向内收缩':'强阻尼：不再往返振荡'}<span>拖开小车，松手释放</span></p>`:i<2?'<p class="drag-instruction">用手指或鼠标拖开蓝色小车，松手后观察。</p>':'';
  if(i>4){host.innerHTML='';return;}
  const count=Math.max(801,Math.min(24001,Math.ceil(end*Math.max(p.frequency||1,i===3?state.q.fn:1)*48)+1));
  state.data=Array.from({length:count},(_,j)=>{const t=end*j/(count-1);return {t,...sample(t)};});
  state.timePeak=i===3?Math.max(1.2,...state.data.map(a=>Math.abs(a.x)))*1.1:limit;state.forcePeak=i===3?state.range:1;
  if(i===3){const q=state.q;state.ring=Array.from({length:361},(_,j)=>{const theta=j/360*Physics.tau;return {x:q.D*Math.sin(theta-q.phi),y:Math.sin(theta)};});
   host.innerHTML=panel('compact-time','动力放大系数 D（倍）',`${q.D>state.range?'↑ 超量程，手动选大量程 · ':''}D=${fmt(q.D,2)} · φ=${fmt(q.phi*180/Math.PI,1)}°`)+`<div class="compact-pair">${panel('compact-orbit','外力—位移 · 迟滞曲线',p.response==='start'?'蓝：稳态；灰：启动；点：当前':'灰线：静力关系；x静=F₀/k')}${panel('compact-force','力的平衡','ma + cv + kx = F（N）')}</div>`;
  }else{host.innerHTML=panel('compact-time',i===4?'荷载、位移与撤力包络':'位移时程与包络',i===4?'橙：荷载　蓝：位移　绿：包络':'蓝：位移　绿：包络　灰：基准')+`<div class="compact-pair">${panel('compact-orbit',i===2?'位移与弹簧力、阻尼力':'位移与弹簧力',i===2?'蓝：−kx；绿：−cv。外力已撤去':'蓝：弹簧力 −kx；外力已撤去')}<section class="compact-panel state-numbers"><h3>同一时刻的状态</h3><div id="compact-values"></div><small>${i===2?'实际阻尼力 = −cv':i===4?'撤力后仍保留位移和速度':'松手时初速度为零'}</small></section></div>`;}
  if(!observer){observer=new ResizeObserver(()=>{if(state)draw(lastT);});observer.observe(host);}draw(0);
 }
 function surface(id){const el=$('#'+id);if(!el)return null;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return null;const dpr=Math.min(3,window.devicePixelRatio||1),w=r.width,h=r.height;if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}const c=el.getContext('2d');c.textBaseline='alphabetic';c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.font='12px "Segoe UI","Microsoft YaHei",sans-serif';c.lineJoin='round';return {c,w,h,el,dpr};}
 function line(c,points,color,dash=[]){c.beginPath();points.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=1.8;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 function dot(c,x,y,color=O){c.fillStyle=color;c.beginPath();c.arc(x,y,4,0,Physics.tau);c.fill();}
 function arrow(c,x,y,dx,dy){line(c,[[x-5*dx+3*dy,y-5*dy-3*dx],[x,y],[x-5*dx-3*dy,y-5*dy+3*dx]],'#8296a8');}
 function gainAxes(surface,p,q,L){
  const {c,w,h,el}=surface,l=38,right=w-14,short=h<75,top=short?9:23,bottom=h-24,domain=5,x=r=>l+r/domain*(right-l),y=d=>bottom-d/L*(bottom-top);
  el.dataset.scale=String(L);el.setAttribute('aria-label',`动力放大系数：横轴频率比0至5，纵轴D为0至${L}倍，当前${fmt(q.D,2)}倍`);
  c.fillStyle='#536575';c.textAlign='left';if(!short)c.fillText('D / 倍',l,12);c.textAlign='right';c.fillText('频率比 r = f/fₙ',right,12);
  for(const v of [0,L/2,L]){const py=y(v);line(c,[[l,py],[right,py]],'#dce5ed');line(c,[[l-4,py],[l,py]],'#8296a8');c.textAlign='right';if(!short||v!==L/2)c.fillText(String(v),l-7,py+4);}
  line(c,[[l,top-4],[l,bottom],[right+5,bottom]],'#8296a8');arrow(c,l,top-4,0,-1);arrow(c,right+5,bottom,1,0);
  for(let r=0;r<=domain;r++){line(c,[[x(r),bottom],[x(r),bottom+4]],'#8296a8');c.textAlign='center';c.fillText(String(r),x(r),bottom+18);}
  c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();
  for(const z of [.02,.2])line(c,InstrumentScale.ratios(z,domain).map(r=>[x(r),y(DynamicsDiagnostics.transfer(r,z).D)]),'#c3cfd9',[3,3]);
  line(c,InstrumentScale.ratios(p.damping,domain).map(r=>[x(r),y(DynamicsDiagnostics.transfer(r,p.damping).D)]),B);
  line(c,[[x(1),top],[x(1),bottom]],'#93a9bd',[3,3]);c.restore();
  dot(c,x(Math.min(q.r,domain)),y(Math.min(q.D,L)),O);
  const peak=DynamicsDiagnostics.transfer(Math.sqrt(1-2*p.damping*p.damping),p.damping).D;
  c.fillStyle=O;c.textAlign='left';if(peak>L)c.fillText('↑ 峰 '+fmt(peak,1),x(1)+6,top+12);
  if(q.r>domain){c.textAlign='right';c.fillText('→ r='+fmt(q.r,1),right,bottom-7);}
 }
 function orbitAxes(surface,s,L){
  const {c,w,h,el}=surface,l=19,right=w-19,top=24,bottom=h-24,cx=(l+right)/2,cy=(top+bottom)/2,fx=(right-l)/2,fy=(bottom-top)/2;
  const x=v=>cx+v/L*fx,y=v=>cy-v/1.25*fy;
  el.dataset.scale=String(L);el.setAttribute('aria-label',`外力位移曲线：横轴x除以静位移，范围负${L}至正${L}；纵轴F除以外力幅值，刻度负1、0、正1，均无量纲`);
  line(c,[[l-4,cy],[right+5,cy]],'#8296a8');arrow(c,right+5,cy,1,0);
  line(c,[[cx,bottom],[cx,top-5]],'#8296a8');arrow(c,cx,top-5,0,-1);
  c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();
  line(c,[[x(-1),y(-1)],[x(1),y(1)]],G,[3,3]);line(c,state.ring.map(a=>[x(a.x),y(a.y)]),B);c.restore();
  dot(c,x(InstrumentScale.clamp(s.x,L)),y(s.F));
  c.fillStyle='#536575';
  for(const v of [-L,0,L]){line(c,[[x(v),cy-3],[x(v),cy+3]],'#8296a8');c.textAlign=v<0?'left':v>0?'right':'right';c.fillText(v<0?'−'+L:v>0?'+'+L:'0',x(v)+(v===0?-5:0),cy+16);}
  for(const v of [-1,1]){line(c,[[cx-3,y(v)],[cx+3,y(v)]],'#8296a8');c.textAlign='right';c.fillText(v<0?'−1':'+1',cx-6,y(v)+4);}
  c.textAlign='left';c.fillText('F/F₀',3,12);c.textAlign='right';c.fillText('x/x静',w-3,h-3);
 }
 function forceAxes(surface,s,L){
  const {c,w,h,el}=surface,l=8,right=w-8,cx=(l+right)/2,half=(right-l)/2,top=15,bottom=h-19,row=(bottom-top)/4,x=v=>cx+InstrumentScale.clamp(v,L)/L*half;
  el.dataset.scale=String(L);el.setAttribute('aria-label',`四项力共用牛顿标尺，负${L}至正${L}，中线为零，正值向右，负值向左`);
  line(c,[[cx,top-3],[cx,h-23]],'#b5c4d0',[2,3]);
  [['惯性 ma',s.ma,V],['阻尼 cv',s.cv,T],['弹性 kx',s.kx,B],['外力 F',s.F,O]].forEach(([label,v,color],j)=>{
   const py=top+j*row;c.fillStyle=color;c.textAlign='left';c.fillText(label,2,py-5);c.textAlign='right';c.fillText((Math.abs(v)>L?'›':'')+fmt(v,1),w-2,py-5);
   line(c,[[l,py],[right,py]],'#dce5ed');line(c,[[cx,py],[x(v),py]],color);dot(c,x(v),py,color);
  });
  const axis=h-23;line(c,[[l,axis],[right,axis]],'#8296a8');c.fillStyle='#536575';
  for(const v of [-L,0,L]){line(c,[[x(v),axis-3],[x(v),axis+3]],'#8296a8');c.textAlign=v<0?'left':v>0?'right':'center';c.fillText(v<0?'−'+L:v>0?'+'+L:'0',x(v),axis+16);}
 }
 function freeForces(surface,s,p,i,limit,data){
  const {c,w,h,el}=surface,k=Physics.tau**2,m=i===1?p.mass:1,z=i===2?p.damping:0,damping=2*z*Math.sqrt(k*m),L=Math.max(1,Math.ceil(k*limit/100)),l=25,right=w-15,top=24,bottom=h-24,cx=(l+right)/2,cy=(top+bottom)/2,x=v=>cx+v/limit*(right-l)/2,y=v=>cy-v/L*(bottom-top)/2;
  el.setAttribute('aria-label',`位移与作用力：横轴位移厘米，纵轴力牛顿；蓝线弹簧恢复力负kx${i===2?'，绿线阻尼力负cv':''}`);
  line(c,[[l,cy],[right+4,cy]],'#8296a8');arrow(c,right+4,cy,1,0);line(c,[[cx,bottom],[cx,top-4]],'#8296a8');arrow(c,cx,top-4,0,-1);
  c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();line(c,[[x(-limit),y(k*limit/100)],[x(limit),y(-k*limit/100)]],B);
  if(i===2)line(c,data.map(a=>[x(a.x),y(-damping*a.v/100)]),T);
  dot(c,x(s.x),y(-k*s.x/100),B);if(i===2)dot(c,x(s.x),y(-damping*s.v/100),T);c.restore();
  c.fillStyle='#536575';for(const v of [-limit,0,limit]){line(c,[[x(v),cy-3],[x(v),cy+3]],'#8296a8');c.textAlign=v<0?'left':'right';c.fillText(v===0?'0':fmt(v,1),x(v)+(v===0?-4:0),cy+16);}
  for(const v of [-L,L]){line(c,[[cx-3,y(v)],[cx+3,y(v)]],'#8296a8');c.textAlign='right';c.fillText(String(v),cx-5,y(v)+4);}
  c.textAlign='left';c.fillText('力 / N',1,12);c.textAlign='right';c.fillText('x / cm',w-2,h-3);
 }
 function draw(t){lastT=t;if(!state||state.i>4)return;const {i,p,sample,end,limit,data,q}=state,s=sample(t),time=surface('compact-time');
  if(time&&i===3)gainAxes(time,p,q,state.range);
  if(time&&i!==3){const {c,w,h}=time,l=37,r=w-9,top=10,bottom=h-19,peak=state.timePeak,x=t=>l+t/end*(r-l),y=v=>bottom-(v+peak)/(2*peak)*(bottom-top);
   const cacheKey=w+'x'+h+'@'+time.dpr;if(!state.timeCache||state.timeCache.key!==cacheKey){
   c.fillStyle='#536575';c.textAlign='right';c.fillText(fmt(peak,peak>=10?0:1),l-4,top+4);c.fillText('0',l-4,y(0)+4);c.textAlign='left';c.fillText('0',l,bottom+15);c.textAlign='right';c.fillText(end+' s',r,bottom+15);line(c,[[l,y(0)],[r,y(0)]],'#d0dae4');
   c.save();c.beginPath();c.rect(l,top,r-l,bottom-top);c.clip();
   if(i===1||i===2)line(c,data.map(a=>[x(a.t),y(a.ref)]),G,[4,3]);
   if(i===3||i===4)line(c,data.map(a=>[x(a.t),y(a.F)]),O,[4,3]);
   if(i<3&&p.damping!==1&&(i!==2||p.damping<1)){for(const sign of [-1,1])line(c,data.map(a=>[x(a.t),y(sign*DynamicsDiagnostics.freeEnvelope(a.t,{m:i===1?p.mass:1,z:i===2?p.damping:0,x0:(p.amplitude??1)*.01})*100)]),T,[4,3]);}
   if(i===4){const start=sample(p.duration),z=.04,wn=Physics.tau,R=Math.hypot(start.x,(start.v+z*wn*start.x)/(wn*Math.sqrt(1-z*z)));for(const sign of [-1,1])line(c,data.filter(a=>a.t>=p.duration).map(a=>[x(a.t),y(sign*R*Math.exp(-z*wn*(a.t-p.duration)))]),T,[4,3]);}
   line(c,data.map(a=>[x(a.t),y(a.x)]),B);c.restore();const bg=document.createElement('canvas');bg.width=time.el.width;bg.height=time.el.height;bg.getContext('2d').drawImage(time.el,0,0);state.timeCache={key:cacheKey,bg};}else c.drawImage(state.timeCache.bg,0,0,w,h);c.save();c.beginPath();c.rect(l,top,r-l,bottom-top);c.clip();line(c,[[x(t),top],[x(t),bottom]],T);dot(c,x(t),y(s.x),B);c.restore();}
  const orbit=surface('compact-orbit');if(orbit&&i===3)orbitAxes(orbit,s,state.range);
  else if(orbit&&i<3)freeForces(orbit,s,p,i,limit,data);
  else if(orbit){const {c,w,h}=orbit,size=Math.min(w-18,h-14),cx=w/2,cy=h/2,factor=size/2,xl=limit,vl=Math.max(1,...data.map(a=>Math.abs(a.v)))*1.12;
   const pts=data.map(a=>[cx+a.x/xl*factor,cy-a.v/vl*factor]),xx=cx+s.x/xl*factor,yy=cy-s.v/vl*factor;
   line(c,[[cx-factor,cy],[cx+factor,cy]],'#d4dee7');line(c,[[cx,cy-factor],[cx,cy+factor]],'#d4dee7');c.save();c.beginPath();c.rect(cx-factor,cy-factor,2*factor,2*factor);c.clip();line(c,pts,B);c.restore();dot(c,xx,yy);c.fillStyle='#536575';c.textAlign='left';c.fillText('v',4,12);c.textAlign='right';c.fillText('x',w-3,h-2);}
  if(i===3){const force=surface('compact-force');if(force)forceAxes(force,s,state.range);}
  else{const vals=$('#compact-values'),m=i===1?p.mass:1,x=i===4?s.x/Physics.tau**2:s.x/100,v=i===4?s.v/Physics.tau**2:s.v/100,z=i===2?p.damping:0,energy=.5*m*v*v+.5*Physics.tau**2*x*x;vals.innerHTML=`<span>x <b>${fmt(s.x)} ${i===4?'倍':'cm'}</b></span><span>v <b>${fmt(s.v)} ${i===4?'倍/s':'cm/s'}</b></span><span>${i===2?'−cv':'E'} <b>${i===2?fmt(-2*z*Math.sqrt(m*Physics.tau**2)*v,3)+' N':fmt(energy*1000,2)+' mJ'}</b></span>`;}
 }
 return {setup,draw,clear(){state=null;}};
})();
