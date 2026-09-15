/* Harmonic external force and physical displacement, never kx on the x axis. */
const DrivenLab=(()=>{
 const B='#1664b7',O='#b84f19',G='#8296a8',$=s=>document.querySelector(s);let p=null,last=0,observer;
 const fmt=(v,n=2)=>(Math.abs(v)<.5*10**-n?0:v).toFixed(n);
 function info(a){const m=a.mass,k=a.stiffness,z=a.damping,wn=Math.sqrt(k/m),fn=wn/Physics.tau,w=Physics.tau*a.frequency,r=w/wn,c=2*z*Math.sqrt(k*m),D=1/Math.hypot(1-r*r,2*z*r),phase=Math.atan2(c*w,k-m*w*w),X=a.force===0?0:a.force/k*D;return {m,k,z,c,wn,fn,w,r,D,phase,X,Xcm:X*100};}
 function sample(t,a){const q=info(a),s=a.force===0?{x:0,v:0,a:0,F:0,D:q.D,phase:q.phase}:Physics.harmonic(t,{m:q.m,k:q.k,z:q.z,r:q.r,F0:a.force,rest:false});return {...s,xSI:s.x,vSI:s.v,aSI:s.a,x:100*s.x,v:100*s.v,a:100*s.a,ma:q.m*s.a,cv:q.c*s.v,kx:q.k*s.x,values:[100*s.x,s.F]};}
 function surface(id){const el=$('#'+id);if(!el)return null;const {width:w,height:h}=el.getBoundingClientRect();if(w<1||h<1)return null;const d=Math.min(3,window.devicePixelRatio||1);el.width=Math.round(w*d);el.height=Math.round(h*d);const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);c.font='12px "Segoe UI","Microsoft YaHei",sans-serif';c.lineJoin='round';return {el,c,w,h};}
 function line(c,pts,color=G,dash=[]){c.beginPath();pts.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=1.6;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 function dot(c,x,y,color=O){c.fillStyle=color;c.beginPath();c.arc(x,y,3.5,0,Physics.tau);c.fill();}
 function axes(s,L){const {c,w,h}=s,l=38,right=w-16,top=19,bottom=h-25,x=v=>l+(v+L)/(2*L)*(right-l),y=v=>bottom-(v+2)/4*(bottom-top);
  c.fillStyle='#536575';c.textAlign='left';c.fillText('外力 F / N',2,12);c.textAlign='right';c.fillText('位移 x / cm',w-2,h-2);
  for(const v of [-2,0,2]){line(c,[[l,y(v)],[right,y(v)]],v===0?G:'#dce5ed');line(c,[[l-3,y(v)],[l,y(v)]],G);c.textAlign='right';c.fillText(String(v),l-6,y(v)+4);}
  line(c,[[l,top],[l,bottom],[right,bottom]],G);line(c,[[x(0),top],[x(0),bottom]],G);
  for(const v of [-L,0,L]){line(c,[[x(v),bottom],[x(v),bottom+4]],G);c.textAlign=v<0?'left':v>0?'right':'center';c.fillText(v<0?'−'+L:String(v),x(v),bottom+16);}
  return {l,right,top,bottom,x,y};
 }
 function setup(a){p=a;last=0;const host=$('#compact-views');host.hidden=false;const q=info(p),cases=[[.1,'低频 · 0.1 fₙ'],[1,'共振 · f = fₙ'],[3,'高频 · 3 fₙ']],chosen=cases.some(([r])=>Math.abs(q.r-r)<1e-8);
  $('#experiment-tools').innerHTML=`<label class="case-select-label">工况<select id="driven-case">${cases.map(([r,label])=>`<option value="${r}" ${Math.abs(q.r-r)<1e-8?'selected':''}>${label}</option>`).join('')}<option value="manual" ${chosen?'':'selected'}>手动频率</option></select></label><label class="range-choice">x量程<select id="display-range" aria-label="位移轴固定量程，单位厘米">${InstrumentScale.levels.map(L=>`<option value="${L}" ${InstrumentScale.limit(p)===L?'selected':''}>±${L} cm</option>`).join('')}</select></label>`;
  $('#frequency-strip').innerHTML=`<p class="driven-info">fₙ = ${fmt(q.fn,3)} Hz　·　滞后 φ = ${fmt(q.phase*180/Math.PI,1)}°</p>`;
  host.innerHTML='<section class="compact-panel"><h3>外力 F 与位移 x · 同一段时间</h3><canvas id="driven-wave" role="img" aria-label="外力牛顿与位移厘米的同步时程，左右轴单位不同"></canvas><small>橙：外力 F（左轴）；蓝：位移 x（右轴）</small></section><section class="compact-panel driven-main"><h3>外力 F—位移 x</h3><canvas id="driven-cart" role="img" aria-label="周期外力驱动的弹簧小车"></canvas><canvas id="driven-orbit" role="img" aria-label="横轴真实位移厘米，纵轴外力牛顿的周期轨迹"></canvas><div id="driven-values"></div><small id="driven-note"></small></section>';
  if(!observer){observer=new ResizeObserver(()=>draw(last));observer.observe(host);}draw(0);
 }
 function draw(t){last=t;if(!p||!$('#driven-orbit'))return;const q=info(p),s=sample(t,p),L=InstrumentScale.limit(p),over=q.Xcm>L;
  const a=surface('driven-orbit');if(a){const {c,el}=a,{l,right,top,bottom,x,y}=axes(a,L);el.dataset.scale=L;el.dataset.xUnit='cm';el.dataset.yUnit='N';el.dataset.xAmplitude=q.Xcm;el.setAttribute('aria-label',`位移x负${L}至正${L}厘米，外力F负2至正2牛顿；真实振幅${fmt(q.Xcm)}厘米`);
   c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();line(c,[[x(-L),y(-p.stiffness*L/100)],[x(L),y(p.stiffness*L/100)]],'#b6c3cd',[4,3]);
   line(c,Array.from({length:361},(_,j)=>{const phase=j/360*Physics.tau;return [x(q.Xcm*Math.sin(phase-q.phase)),y(p.force*Math.sin(phase))];}),B);c.restore();dot(c,x(InstrumentScale.clamp(s.x,L)),y(s.F));
   if(over){c.fillStyle=O;c.textAlign='right';c.fillText('→ 超出x量程',right,top+12);}
  }
  const wave=surface('driven-wave');if(wave){const {c,w,h,el}=wave,l=33,right=w-(L>=10000?52:44),top=19,bottom=h-24,cy=(top+bottom)/2,x=time=>l+time/4*(right-l),fy=F=>cy-F/2*(bottom-top)/2,xy=cm=>cy-cm/L*(bottom-top)/2;el.dataset.scale=L;
   c.fillStyle=O;c.textAlign='left';c.fillText('F / N',1,11);c.fillStyle=B;c.textAlign='right';c.fillText('x / cm',w-1,11);
   for(const v of [-1,0,1]){const py=cy-v*(bottom-top)/2;line(c,[[l,py],[right,py]],v===0?G:'#dce5ed');c.fillStyle=O;c.textAlign='right';c.fillText(String(v*2),l-5,py+4);c.fillStyle=B;c.textAlign='left';c.fillText(String(v*L),right+5,py+4);}
   line(c,[[l,top],[l,bottom],[right,bottom],[right,top]],G);c.fillStyle='#536575';for(let n=0;n<=4;n++){line(c,[[x(n),bottom],[x(n),bottom+3]],G);c.textAlign='center';c.fillText(n===4?'4 s':String(n),x(n),bottom+15);}
   c.save();c.beginPath();c.rect(l,top,right-l,bottom-top);c.clip();for(const [color,fn] of [[O,v=>fy(v.F)],[B,v=>xy(v.x)]])line(c,Array.from({length:601},(_,j)=>[x(j/150),fn(sample(j/150,p))]),color);line(c,[[x(t),top],[x(t),bottom]],'#0b746c',[3,3]);c.restore();
  }
  const cart=surface('driven-cart');if(cart){const {c,w,h}=cart,origin=w*.52,cx=origin+InstrumentScale.clamp(s.x,L)/L*w*.27,cy=h*.55,end=cx-13;line(c,[[14,cy-16],[14,cy+16]],G);line(c,[[origin,4],[origin,h-3]],'#b6c3cd',[3,3]);let pts=[[14,cy],[22,cy]];for(let j=0;j<14;j++)pts.push([22+(end-30)*j/13,cy+(j%2?5:-5)]);pts.push([end,cy]);line(c,pts,B);c.fillStyle=B;c.fillRect(cx-13,cy-12,26,25);const tip=cx+s.F/2*w*.15;line(c,[[cx,cy-17],[tip,cy-17]],O);if(Math.abs(s.F)>.02){const sign=Math.sign(s.F);line(c,[[tip-sign*5,cy-20],[tip,cy-17],[tip-sign*5,cy-14]],O);}c.fillStyle=O;c.textAlign='left';c.fillText('F',Math.min(w-12,Math.max(3,tip+4)),11);}
  $('#driven-values').innerHTML=`<span>x <b>${fmt(s.x)} cm</b></span><span>F <b>${fmt(s.F)} N</b></span><span>振幅 X <b>${fmt(q.Xcm)} cm</b></span>`;
  $('#driven-note').textContent=over?`↑ X=${fmt(q.Xcm)} cm，手动选大量程`:'灰线：静力 F=kx；蓝线：周期加载稳态';
 }
 return {info,sample,setup,draw,clear(){p=null;}};
})();
if(typeof module!=='undefined')module.exports=DrivenLab;
