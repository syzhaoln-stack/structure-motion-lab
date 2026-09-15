/* Elastic equilibrium: external force is held after drag release; no time integration. */
const StaticLab=(()=>{
 const B='#1664b7',O='#b84f19',G='#8296a8',$=s=>document.querySelector(s);
 let p=null,onForce=null,drag=null,observer=null;
 const state=({force,stiffness})=>({F:force,k:stiffness,x:force/stiffness,kx:force});
 const fmt=v=>(Math.abs(v)<.00005?0:v).toFixed(2);
 function surface(id){const el=$('#'+id),r=el.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,3),c=el.getContext('2d');el.width=Math.round(r.width*d);el.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);c.font='12px "Segoe UI","Microsoft YaHei",sans-serif';c.lineWidth=1.5;return {el,c,w:r.width,h:r.height};}
 function line(c,points,color=G,dash=[]){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 function arrow(c,x,y,end,color){if(Math.abs(end-x)<.1)return;line(c,[[x,y],[end,y]],color);const s=Math.sign(end-x);line(c,[[end-5*s,y-3],[end,y],[end-5*s,y+3]],color);}
 function geometry(w){return {origin:w*.53,scale:w*.28/10};}
 function draw(){if(!p||!$('#elastic-apparatus'))return;const q=state(p),a=surface('elastic-apparatus'),{c,w,h,el}=a,{origin,scale}=geometry(w),cx=origin+q.x*100*scale,cy=h*.55;
  c.fillStyle='#536575';c.textAlign='left';c.fillText('外力 F',5,14);c.textAlign='right';c.fillStyle=O;c.fillText(fmt(q.F)+' N',w-5,14);
  line(c,[[20,cy-26],[20,cy+26]],G);line(c,[[origin,cy-34],[origin,cy+35]],'#b9c8d5',[4,4]);
  const points=[[20,cy],[32,cy]],end=cx-14;for(let j=0;j<14;j++)points.push([32+(end-44)*j/13,cy+(j%2?7:-7)]);points.push([end,cy]);line(c,points,B);
  c.fillStyle=B;c.fillRect(cx-14,cy-22,28,44);c.fillStyle='white';c.textAlign='center';c.fillText('↔',cx,cy+4);
  arrow(c,cx,cy-30,cx+q.F/2*w*.18,O);arrow(c,origin,cy+32,cx,B);
  c.textAlign='left';c.fillStyle=B;c.fillText('位移 x',5,h-7);c.textAlign='right';c.fillText(fmt(q.x*100)+' cm',w-5,h-7);
  el.setAttribute('aria-valuenow',fmt(q.x*100));el.setAttribute('aria-valuetext',`位移${fmt(q.x*100)}厘米，外力${fmt(q.F)}牛顿`);
  $('#elastic-values').innerHTML=`<span>刚度 k<b>${p.stiffness} N/m</b></span><span>位移 x<b>${fmt(q.x*100)} cm</b></span><span>外力 F<b>${fmt(q.F)} N</b></span>`;
  const a2=surface('elastic-curve'),ctx=a2.c,W=a2.w,H=a2.h,l=40,r=W-18,top=22,bottom=H-28,x=v=>l+(v+10)/20*(r-l),y=v=>bottom-(v+2)/4*(bottom-top);
  ctx.fillStyle='#536575';ctx.textAlign='left';ctx.fillText('外力 F / N',4,13);ctx.textAlign='right';ctx.fillText('位移 x / cm',W-3,H-3);
  for(const v of [-2,-1,0,1,2]){line(ctx,[[l,y(v)],[r,y(v)]],v===0?G:'#dce5ed');ctx.textAlign='right';ctx.fillText(String(v),l-7,y(v)+4);line(ctx,[[l-3,y(v)],[l,y(v)]],G);}
  line(ctx,[[l,top],[l,bottom],[r,bottom]],G);line(ctx,[[x(0),top],[x(0),bottom]],G);
  for(const v of [-10,-5,0,5,10]){line(ctx,[[x(v),bottom],[x(v),bottom+4]],G);ctx.textAlign='center';ctx.fillText(String(v),x(v),bottom+17);}
  ctx.save();ctx.beginPath();ctx.rect(l,top,r-l,bottom-top);ctx.clip();line(ctx,[[x(-10),y(-.1*p.stiffness)],[x(10),y(.1*p.stiffness)]],B);ctx.restore();
  line(ctx,[[l,y(q.F)],[x(q.x*100),y(q.F)],[x(q.x*100),bottom]],O,[3,3]);ctx.fillStyle=O;ctx.beginPath();ctx.arc(x(q.x*100),y(q.F),4,0,Math.PI*2);ctx.fill();
 }
 function setFromPointer(e){const el=$('#elastic-apparatus'),rect=el.getBoundingClientRect(),g=geometry(rect.width),cm=(e.clientX-rect.left-drag.offset-g.origin)/g.scale;onForce(Math.max(-2,Math.min(2,Math.round(cm/100*p.stiffness*100)/100)));}
 function setup(params,changeForce){p=params;onForce=changeForce;const host=$('#compact-views');host.hidden=false;$('#experiment-tools').innerHTML='';$('#frequency-strip').innerHTML='<p class="static-intro">纯弹性静力 · <b>kx = F</b></p>';
  if(!$('#elastic-apparatus'))host.innerHTML='<section class="compact-panel elastic-model"><h3>拖动受力端 · 外力保持加载</h3><canvas id="elastic-apparatus" role="slider" tabindex="0" aria-label="拖动弹簧受力端，方向键调整外力" aria-valuemin="-10" aria-valuemax="10"></canvas><div id="elastic-values"></div><small>松手后保持平衡；虚线是未变形位置。</small></section><section class="compact-panel"><h3>外力 F—位移 x</h3><canvas id="elastic-curve" role="img" aria-label="外力位移直线，横轴负10至10厘米，纵轴负2至2牛顿"></canvas><small>横：位移 x（cm）；纵：外力 F（N）。</small></section>';
  if(!observer){observer=new ResizeObserver(draw);observer.observe(host);
   host.addEventListener('pointerdown',e=>{if(!p||e.target.id!=='elastic-apparatus'||e.button!==0)return;e.preventDefault();const rect=e.target.getBoundingClientRect(),g=geometry(rect.width),q=state(p);drag={id:e.pointerId,offset:e.clientX-rect.left-g.origin-q.x*100*g.scale};host.setPointerCapture(e.pointerId);});
   host.addEventListener('pointermove',e=>{if(p&&drag&&e.pointerId===drag.id)setFromPointer(e);});
   const end=e=>{if(drag&&e.pointerId===drag.id){drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}};
   host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);
   host.addEventListener('keydown',e=>{if(p&&e.target.id==='elastic-apparatus'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();onForce(Math.max(-2,Math.min(2,Math.round((p.force+(e.key==='ArrowRight'?.05:-.05))*100)/100)));}});
  }draw();
 }
 return {state,setup,draw,clear(){p=null;drag=null;}};
})();
if(typeof module!=='undefined')module.exports=StaticLab;
