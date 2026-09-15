(()=>{
'use strict';
const $=s=>document.querySelector(s),P=Physics,B='#1664b7',O='#b84f19',G='#8293a3',T='#0b746c';
let idx=0,params={},phase=1,t=0,playing=false,last=0,cache=[],series=[],axis={};
const saved={};
const ACTIVE=[8,0,1,2,3,5];
const lessonNumber=i=>String(ACTIVE.indexOf(i)).padStart(2,'0');

let drag=null,dragDirty=false,detailReady=false,detailDirty=true;
const freeLimit=()=>idx===2&&params.damping<0?Math.max(1.6,Math.ceil(1.5/Math.sqrt(1-params.damping**2)*Math.exp(-params.damping*P.tau*6)*1.08)):1.6;
const cartScale=()=>idx===3?160/(axis.visualMax||axis.max):idx===4?60:Math.min(75,160/axis.max);
function focusLab(on){document.body.classList.remove("show-settings");$("#focus-settings").textContent="参数";document.body.classList.toggle("lab-focus",on);$("#focus-lab").textContent=on?"退出聚焦":"聚焦联动";$("#focus-lab").setAttribute("aria-pressed",String(on));requestAnimationFrame(()=>Workbench.draw(t));}
function focusForPhone(){if(ACTIVE.includes(idx)&&matchMedia("(max-width:780px)").matches)focusLab(true);}
function syncFrequency(){if(idx!==3)return;const input=$("#param-frequency"),fn=Math.sqrt(params.stiffness/params.mass)/P.tau;input.min=Math.min(.01,fn*.1);input.max=Math.max(5*fn,params.frequency);input.step="any";input.value=params.frequency;$("#value-frequency").textContent=f(params.frequency,3)+" Hz";const ends=input.nextElementSibling;ends.firstElementChild.textContent=f(Number(input.min),3)+" Hz";ends.lastElementChild.textContent=f(Number(input.max),3)+" Hz";}
const lesson=()=>LESSONS[idx];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,n=2)=>Number(v).toFixed(n).replace(/\.00$/,'');
const controlMarkup=p=>p.type==='choice'?`<div class="control"><label>${p.label}</label><div class="segments">${p.options.map(([v,label])=>`<button data-param="${p.key}" data-value="${v}" aria-pressed="${String(params[p.key])===String(v)}">${label}</button>`).join('')}</div></div>`:`<div class="control"><label for="param-${p.key}">${p.label}${p.key==='damping'?`<input class="precise-value" id="value-damping" data-number="damping" type="number" min="${p.min}" max="${p.max}" step="0.001" value="${Number(params.damping).toFixed(3)}" aria-label="精确输入阻尼比">`:`<output id="value-${p.key}">${formatParam(p)}</output>`}</label><input id="param-${p.key}" data-range="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-label="${p.label}"><div class="range-ends"><span>${p.ends[0]}</span><span>${p.ends[1]}</span></div></div>`;
function selectLesson(i,scroll=true){
  playing=false;drag=null;dragDirty=false;focusLab(false);if(Object.keys(params).length)saved[idx]={params:{...params}};
  idx=ACTIVE.includes(i)?i:8;params={...lesson().defaults,...saved[idx]?.params};phase=1;t=0;
  $('#title').textContent=lesson().title;$('#scene').textContent=lesson().scene;$('#chapter-label').textContent=`实验 ${lessonNumber(idx)} · ${lesson().name}`;
  document.body.dataset.experiment=idx;$('#focus-settings').hidden=idx!==3;$('#full-views').open=false;$('#full-views').hidden=idx===0||idx===5||idx===8;
  $('#count').textContent=`${ACTIVE.indexOf(idx)+1} / ${ACTIVE.length}`;$('#prev').disabled=idx===ACTIVE[0];$('#next-top').disabled=idx===ACTIVE.at(-1);
  $('#operation-guide').textContent=lesson().task;
  $('#visual-caption').textContent=lesson().caption;$('#chart-note').textContent=lesson().note;$('#model').innerHTML=lesson().model+`<p class="quiet">来源：${esc(lesson().source)}</p>`;$('#advanced').open=false;
  $('#scrub').max=lesson().duration;$('#duration-label').textContent=idx===7?'0—2 个周期':`0—${lesson().duration} s`;
  $('#parameter-controls').innerHTML=lesson().params.filter(p=>!p.advanced&&!p.compactFold).map(controlMarkup).join('')+(lesson().params.some(p=>p.compactFold)?'<details class="extra-controls phase-control"><summary>阶段：稳态 / 启动</summary>'+lesson().params.filter(p=>p.compactFold).map(controlMarkup).join('')+'</details>':'')+(lesson().params.some(p=>p.advanced)?`<details class="extra-controls"><summary>${idx===0?'质量、刚度与外力幅值':idx===3?'结构参数：m · k · ζ':'结构频率与荷载幅值'}</summary>${lesson().params.filter(p=>p.advanced).map(controlMarkup).join('')}</details>`:'');
  renderMenu();prepare();renderPhase();drawFrame();renderSource();
  focusForPhone();if(scroll)window.scrollTo({top:0,behavior:'instant'});
  try{history.replaceState(null,'','#'+idx);}catch{}
}
function formatParam(p){return f(params[p.key]*(p.scale||1),p.scale?0:p.step<.01?3:p.step<.1?2:1)+(p.unit||'');}
function renderMenu(){$('#lab-lesson').innerHTML=ACTIVE.map(i=>'<option value="'+i+'" '+(i===idx?'selected':'')+'>'+lessonNumber(i)+' · '+LESSONS[i].name+'</option>').join('');const links=ACTIVE.map(i=>{const l=LESSONS[i];return `<button data-lesson="${i}" aria-current="${i===idx}">${lessonNumber(i)} · ${l.name}</button>`;}).join('');$('#course-menu').innerHTML=links;$('#side-menu').innerHTML=links;}
function renderPhase(){
 $('#lab-state').textContent=playing?'正在运行':'可调整 · 可暂停';
 $('#play').textContent=playing?'暂停':'开始';
}
function renderSource(){const names=idx<6||idx===8?['Dynamics.m']:idx===6?['Dynamics_MDOF.m']:['Dynamics_MDOF.m','bridge_mode.m','bridge_mode_241011.m','cantilever_beam.html','bridge_vibration.html'];$('#source-select').innerHTML=names.map(n=>`<option>${n}</option>`).join('');$('#source-code').textContent=ORIGINAL_SOURCES[names[0]];$('#code-context').textContent=lesson().source;$('#original-code').open=false;}
function getSample(time){
 switch(idx){
 case 0:return DrivenLab.sample(time,params);
 case 1:{const r=P.free(time,{m:params.mass,x0:(params.amplitude??1)*.01}),ref=P.free(time,{x0:(params.amplitude??1)*.01});return {...r,x:r.x*100,v:r.v*100,a:r.a*100,ref:ref.x*100,values:[r.x*100,ref.x*100]};}
 case 2:{const r=P.free(time,{z:params.damping,x0:(params.amplitude??1)*.01}),ref=P.free(time,{x0:(params.amplitude??1)*.01});return {...r,x:r.x*100,v:r.v*100,a:r.a*100,ref:ref.x*100,values:[r.x*100,ref.x*100]};}
 case 3:{const k=params.stiffness,m=params.mass,fn=Math.sqrt(k/m)/P.tau,c=2*params.damping*Math.sqrt(k*m),ratio=params.frequency/fn,r=P.harmonic(time,{r:ratio,k,m,z:params.damping,rest:params.response==='start'});return {...r,xSI:r.x,vSI:r.v,aSI:r.a,k,m,c,fn,ratio,ma:m*r.a,cv:c*r.v,kx:k*r.x,x:r.x*k,v:r.v*k,values:[r.x*k,r.F]};}
 case 4:{const r=P.pulse(time,{duration:params.duration});return {...r,values:[r.x]};}
 case 5:{const q=SpectrumLab.info(params),r=P.harmonic(time,{r:q.r,z:params.damping,k:q.k,F0:params.force,rest:false});return {...r,xSI:r.x,x:r.x*100,values:[r.x*100,r.F]};}
 case 6:{const r=P.modes(time,{pattern:params.pattern});return {...r,x:r.x1,values:[r.x1,r.x2]};}
 case 7:{const shape=P.beamShape(params.sensor,Number(params.mode),params.support),x=shape*Math.cos(P.tau*time/5);return {x,shape,values:[x]};}
 }
}
function prepare(){
 if(idx!==0)DrivenLab.clear();
 if(idx===8){axis={min:-10,max:10,end:1};detailDirty=false;detailReady=false;Workbench.clear();StructuralView.setup(idx,params,10);StaticLab.setup(params,value=>changeParam('force',value));return;}
 StaticLab.clear();
 if(idx===0){axis={min:-InstrumentScale.limit(params),max:InstrumentScale.limit(params),end:4};detailDirty=false;detailReady=false;Workbench.clear();StructuralView.setup(8,params,axis.max);DrivenLab.setup(params);$('#param-frequency').step='any';$('#param-frequency').value=params.frequency;$('#scrub').max=4;$('#duration-label').textContent='0—4 s';$('#scrub-title').textContent='同步时间';return;}
 if(idx===5){axis={min:-InstrumentScale.limit(params),max:InstrumentScale.limit(params),end:4};detailDirty=false;detailReady=false;Workbench.clear();StructuralView.setup(8,params,axis.max);SpectrumLab.setup(params);const input=$('#param-frequency');input.max=3*params.natural;input.value=params.frequency;input.nextElementSibling.lastElementChild.textContent=f(3*params.natural,2)+' Hz';$('#scrub').max=4;$('#duration-label').textContent='0—4 s';$('#scrub-title').textContent='同步时间';return;}
 if(idx===3)lesson().duration=params.response==='steady'?8:24;
 $('#scrub').max=lesson().duration;$('#duration-label').textContent=idx===7?'0—2 个周期':`0—${lesson().duration} s`;
 const limits=[1.6,1.6,freeLimit(),InstrumentScale.limit(params),2.2,InstrumentScale.limit(params),1.2,1.1];axis={min:-limits[idx],max:limits[idx],end:lesson().duration};
 if(idx===3)axis.visualMax=axis.max;
 series=[{name:idx===7?'测点位移':idx===6?'左边物体':idx===5?'混合后的响应':'当前位移',color:B}];
 if(idx===1||idx===2)series.push({name:idx===1?'原来的 1 kg':'无阻尼基准',color:G,dash:'9 7'});
 if(idx===3)series.push({name:'外力 ÷ 刚度',color:O,dash:'7 6'});
 if(idx===3){series[0].name='位移 kx/F₀';series[1].name='外力 F/F₀';}
 if(idx===6)series.push({name:'右边物体',color:O});
 $('#legend').innerHTML=series.map(s=>`<span><i class="swatch ${s.color===G?'gray':s.color===O?'orange':''}"></i>${s.name}</span>`).join('');
 cache=Array.from({length:801},(_,i)=>({t:i*axis.end/800,...getSample(i*axis.end/800)}));
 const x=v=>64+v/axis.end*552,y=v=>112-v/axis.max*78;
 let grid='';for(let j=-1;j<=1;j++)grid+=`<line x1="64" y1="${y(j*axis.max)}" x2="616" y2="${y(j*axis.max)}" stroke="${j===0?'#b9c9d8':'#e2e9f0'}"/><text x="52" y="${y(j*axis.max)+8}" text-anchor="end">${f(j*axis.max,1)}</text>`;
 for(let j=0;j<=4;j++){const xx=x(j*axis.end/4);grid+=`<line x1="${xx}" y1="34" x2="${xx}" y2="190" stroke="#e7edf3"/><text x="${xx}" y="223" text-anchor="middle">${idx===7?f(j/2,1):f(j*axis.end/4,1)}</text>`;}
 let extra=idx===4?`<rect x="64" y="34" width="${params.duration/axis.end*552}" height="156" fill="${O}" opacity=".10"/>`:'';
 const paths=series.map((s,j)=>{const d=cache.map((a,i)=>`${i?'L':'M'}${f(x(a.t))},${f(y(a.values[j]))}`).join(' ');return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3.2" ${s.dash?`stroke-dasharray="${s.dash}"`:''} ${s.color===G?'':'clip-path="url(#history-clip)"'}/>`;}).join('');
 $('#chart').innerHTML=`<defs><clipPath id="plot-area"><rect x="64" y="30" width="552" height="165"/></clipPath><clipPath id="history-clip"><rect id="history-rect" x="64" y="30" width="0" height="165"/></clipPath></defs>${grid}<text x="64" y="22">${idx<=2?'cm':idx===7?'相对位移':'相对位移'}</text><text x="616" y="22" text-anchor="end">${idx===7?'时间 / 当前周期':'时间 s'}</text><g clip-path="url(#plot-area)">${extra}${paths}</g><line id="time-cursor" x1="64" x2="64" y1="30" y2="192" stroke="${T}" stroke-width="2"/><circle id="time-dot" cx="64" cy="112" r="5" fill="${B}"/>`;
 const chartLabels=$('#chart').querySelectorAll('text');chartLabels[chartLabels.length-2].textContent=idx===5?'N':idx===3?'无量纲':idx<=2?'cm':'相对位移';
 detailDirty=true;detailReady=false;if($("#full-views").open){LabExtension.setup(idx,params,getSample,axis.end,axis.max);detailReady=true;detailDirty=false;}
 Workbench.setup(idx,params,getSample,axis.end,axis.max);$("#scrub-title").textContent="同步时间";StructuralView.setup(idx,params,axis.max);syncFrequency();
}
function spring(x1,x2,y,color=G){const length=x2-x1;let points=`${x1},${y} ${x1+length*.12},${y}`;for(let j=0;j<12;j++)points+=` ${x1+length*(.15+.7*j/11)},${y+(j%2?9:-9)}`;points+=` ${x2-length*.12},${y} ${x2},${y}`;return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;}
function arrow(x,y,v,color,label=''){if(Math.abs(v)<.02)return '';const end=x+Math.sign(v)*Math.min(90,Math.max(12,Math.abs(v))),sign=Math.sign(v);return `<path d="M${x} ${y}H${end}m${-sign*8} -5l${sign*8} 5l${-sign*8} 5" fill="none" stroke="${color}" stroke-width="3"/>${label?`<text x="${x}" y="${y-11}" fill="${color}">${label}</text>`:''}`;}
function apparatus(r){
 if(idx===5)return '';
 if(idx===6){const a=200+r.x1*47,b=437+r.x2*47;return `<path d="M35 60V150M605 60V150" stroke="${G}" stroke-width="6"/><path d="M200 62V154M437 62V154" stroke="#c0ceda" stroke-dasharray="5 6"/>${spring(35,a-27,107)}${spring(a+27,b-27,107)}${spring(b+27,605,107)}<rect x="${a-27}" y="78" width="54" height="58" rx="8" fill="${B}"/><rect x="${b-27}" y="78" width="54" height="58" rx="8" fill="${O}"/><text x="${a}" y="177" text-anchor="middle">左边</text><text x="${b}" y="177" text-anchor="middle">右边</text>`;}
 if(idx===7){const wave=Math.cos(P.tau*t/5),mode=Number(params.mode),shape=s=>P.beamShape(s,mode,params.support);let d='';for(let i=0;i<=120;i++)d+=`${i?'L':'M'}${55+i/120*530},${105-shape(i/120)*wave*52} `;const sensorX=55+params.sensor*530,sensorY=105-r.x*52;return `<line x1="55" x2="585" y1="105" y2="105" stroke="#b6c5d3" stroke-dasharray="8 7"/>${params.support==='simple'?'<path d="M55 109l-15 23h30ZM585 109l-15 23h30Z" fill="#a9bac9"/>':'<path d="M48 43V161" stroke="#8293a3" stroke-width="10"/>'}<path d="${d}" stroke="${B}" stroke-width="6" fill="none"/><line x1="${sensorX}" x2="${sensorX}" y1="39" y2="170" stroke="${T}" stroke-width="1.5" stroke-dasharray="4 6"/><circle cx="${sensorX}" cy="${sensorY}" r="8" fill="${T}" stroke="white" stroke-width="3"/><text x="320" y="194" text-anchor="middle">测点位置 ${f(params.sensor*100,0)}%</text>`;}
 const scale=cartScale(),cx=334+r.x*scale,box=idx===1?45+Math.sqrt(params.mass)*14:58;
 let svg=`<path d="M42 62V150" stroke="${G}" stroke-width="7"/><path d="M40 151H600" stroke="#a3b5c6" stroke-width="2"/><line x1="334" x2="334" y1="48" y2="164" stroke="#abbcc9" stroke-dasharray="5 6"/>`;
 if(r.ref!==undefined){svg+=`<rect x="${334+r.ref*scale-29}" y="77" width="58" height="64" rx="8" stroke="${G}" stroke-dasharray="5 5" fill="#f4f7fa" opacity=".85"/>`;}
 svg+=spring(42,cx-box/2,106)+`<g ${idx<3?'data-drag-cart="true" tabindex="0" role="slider" aria-label="拖动小车设定初始位移；方向键移动，空格释放" aria-valuemin="-1.5" aria-valuemax="1.5" aria-valuenow="'+(params.amplitude??1)+'"':''}><rect x="${cx-box/2}" y="77" width="${box}" height="64" rx="8" fill="${B}"/><circle cx="${cx-17}" cy="146" r="5" fill="${G}"/><circle cx="${cx+17}" cy="146" r="5" fill="${G}"/>${idx<3?`<rect x="${cx-80}" y="20" width="160" height="160" fill="transparent"/>`:""}</g>`;
 if(idx<=2)svg+=arrow(cx,53,r.v*10,T,'速度');
 if(idx===3||idx===4)svg+=arrow(cx,54,r.F*67,O,'外力');
 svg+=`<text x="334" y="191" text-anchor="middle">原来静止的位置</text>`;
 return svg;
}
function drawFrame(){
 if(idx===0){DrivenLab.draw(t);$('#scrub').value=t;$('#time').textContent=f(t)+' s';return;}
 if(idx===5){SpectrumLab.draw(t);$('#scrub').value=t;$('#time').textContent=f(t)+' s';return;}
 if(idx===8){StaticLab.draw();return;}
 const r=getSample(t);$('#apparatus').innerHTML=apparatus(r);const xx=64+t/axis.end*552,yy=112-r.values[0]/axis.max*78;
 $('#time-cursor').setAttribute('x1',xx);$('#time-cursor').setAttribute('x2',xx);$('#time-dot').setAttribute('cx',xx);$('#time-dot').setAttribute('cy',yy);$('#time-dot').style.visibility=Math.abs(r.values[0])>axis.max?'hidden':'visible';$('#history-rect').setAttribute('width',552);
 $('#scrub').value=t;$('#time').textContent=idx===7?f(t/5)+' Tₙ':f(t)+' s';
 let a,b,c;
 if(idx===0){a=['当前位置',f(r.x)+' cm'];b=['当前速度',f(r.v)+' cm/s'];c=['完整往返','1 s'];}
 if(idx===1){a=['当前质量',f(params.mass,1)+' kg'];b=['当前周期',f(Math.sqrt(params.mass))+' s'];c=['原来周期','1 s'];}
 if(idx===2){a=['当前位移',f(r.x)+' cm'];b=['阻尼比',f(params.damping,3)];c=['观察时长',f(t)+' s'];}
 if(idx===3){a=['当前位移',f(r.xSI*100)+' cm'];b=['稳态振幅',f(r.D/r.k*100)+' cm'];c=['位移滞后外力',f(r.phase*180/Math.PI,1)+'°'];}
 if(idx===4){a=['当前位移',f(r.x)+' 倍'];b=['外力状态',t<params.duration?'仍在推动':'已经撤去'];c=['推力持续',f(params.duration,1)+' s'];}
 if(idx===5){const q=SpectrumLab.info(params);a=['当前荷载频率',f(params.frequency,3)+' Hz'];b=['D',f(q.D)];c=['相位滞后',f(q.phi*180/Math.PI,1)+'°'];}
 if(idx===6){a=['左边位移',f(r.x1)];b=['右边位移',f(r.x2)];c=['当前摆法',params.pattern==='one'?'只拉左边':params.pattern==='together'?'同向':'反向'];}
 if(idx===7){a=['测点位移',f(r.x)];b=['此处振幅',f(Math.abs(r.shape))];c=['本阶 / 第1阶频率',f(P.beamFrequency(Number(params.mode),params.support))+' 倍'];}
 $('#readouts').innerHTML=[a,b,c].map(([label,value])=>`<span>${label}<b>${phase===0?'—':value}</b></span>`).join('');
 if(detailReady&&$("#full-views").open)LabExtension.draw({idx,params,t,phase,r,axis});if(idx===5)SpectrumLab.draw(t);else Workbench.draw(t);if(idx<3)StructuralView.draw(r.x);
}
function changeParam(key,value){params[key]=typeof lesson().defaults[key]==='number'?Number(value):value;playing=false;t=0;if(idx===5&&key==='natural')params.frequency=Math.min(params.frequency,3*params.natural);if(idx===5&&key.startsWith('amp')){params.load='custom';document.querySelectorAll('[data-param="load"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value==='custom')));}const p=lesson().params.find(p=>p.key===key);if(p?.type==='choice')document.querySelectorAll(`[data-param="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===String(value))));else if(p){if(key==='damping')$('#value-damping').value=Number(params.damping).toFixed(3);else $('#value-'+key).textContent=formatParam(p);$('#param-'+key).value=params[key];}prepare();drawFrame();renderPhase();}
function frame(now){if(dragDirty){dragDirty=false;prepare();drawFrame();}if(playing){if(last){const dt=Math.min((now-last)/1000,.1)*Number($('#speed').value);t=Math.min(axis.end,t+dt);}drawFrame();if(t>=axis.end){if($("#loop").checked){t=0;last=0;}else{playing=false;renderPhase();}}}last=now;requestAnimationFrame(frame);}
document.addEventListener('click',e=>{
 const preset=e.target.closest('[data-ratio]');if(preset&&idx===3){params.response='steady';document.querySelectorAll('[data-param="response"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value==='steady')));changeParam('frequency',Number(preset.dataset.ratio)*Math.sqrt(params.stiffness/params.mass)/P.tau);playing=true;last=0;renderPhase();focusForPhone();return;}
 if(e.target.closest('#tune-frequency')&&idx===3){const freq=Math.sqrt(params.stiffness/params.mass)/P.tau;changeParam('frequency',freq);$('#param-frequency').value=freq;return;}
 const l=e.target.closest('[data-lesson]');if(l){$('#course-menu').hidden=true;$('#open-menu').setAttribute('aria-expanded','false');selectLesson(Number(l.dataset.lesson));return;}
 const v=e.target.closest('[data-param]');if(v&&phase>0){changeParam(v.dataset.param,v.dataset.value);return;}
});
$('#parameter-controls').addEventListener('toggle',e=>{if(e.target.open){playing=false;renderPhase();}},true);
$('#parameter-controls').addEventListener('input',e=>{if(e.target.dataset.range)changeParam(e.target.dataset.range,e.target.value);});
$('#open-menu').onclick=()=>{const closed=$('#course-menu').hidden;$('#course-menu').hidden=!closed;$('#open-menu').setAttribute('aria-expanded',String(closed));};
$('#prev').onclick=()=>selectLesson(ACTIVE[ACTIVE.indexOf(idx)-1]);$('#next-top').onclick=()=>selectLesson(ACTIVE[ACTIVE.indexOf(idx)+1]);
$('#full-views').addEventListener('toggle',()=>{if($('#full-views').open&&detailDirty){LabExtension.setup(idx,params,getSample,axis.end,axis.max);detailReady=true;detailDirty=false;drawFrame();}});
$('#lab-lesson').onchange=e=>{selectLesson(Number(e.target.value),false);focusForPhone();};
document.addEventListener('change',e=>{if(e.target.id==='driven-case'&&e.target.value!=='manual')changeParam('frequency',Number(e.target.value)*Math.sqrt(params.stiffness/params.mass)/P.tau);if(e.target.id==='display-range')changeParam('displayRange',Number(e.target.value));if(e.target.id==='single-case'&&e.target.value!=='manual')changeParam('frequency',Number(e.target.value)*params.natural);if(e.target.dataset.number){if(e.target.value!==''&&e.target.validity.valid)changeParam(e.target.dataset.number,Number(e.target.value));else e.target.value=Number(params.damping).toFixed(3);}if(e.target.id==='typical-case'&&e.target.value!=='manual'){params.response='steady';changeParam('frequency',Number(e.target.value)*Math.sqrt(params.stiffness/params.mass)/P.tau);}if(e.target.id==='damping-case'&&e.target.value!=='manual')changeParam('damping',Number(e.target.value));});
$('#focus-settings').onclick=()=>{playing=false;const on=document.body.classList.toggle('show-settings');$('#focus-settings').textContent=on?'收起参数':'参数';if(on)document.querySelectorAll('#parameter-controls>details').forEach(d=>d.open=true);else document.querySelectorAll('#parameter-controls>details').forEach(d=>d.open=false);renderPhase();};
$('#focus-lab').onclick=()=>focusLab(!document.body.classList.contains('lab-focus'));
$('#play').onclick=()=>{focusForPhone();if(t>=axis.end){t=0;if(idx===5)SpectrumLab.setup(params);}playing=!playing;last=0;renderPhase();drawFrame();};
$('#reset').onclick=()=>{playing=false;t=0;drawFrame();renderPhase();};
$('#scrub').oninput=e=>{playing=false;t=Number(e.target.value);drawFrame();renderPhase();};
$('#advanced').addEventListener('toggle',()=>{if($('#advanced').open){playing=false;renderPhase();}});$('#original-code').addEventListener('toggle',()=>{if($('#original-code').open){playing=false;renderPhase();}});
$('#source-info').innerHTML='<p>改编自你提供的《课程全部代码与数据.zip》。适合非专业学习者；当前六个实验用于课堂讲授过程中的即时操作，从纯弹性静力开始，围绕质量、刚度、阻尼、共振与单频谱转换展开。</p><p>图中的运动由线性教学模型计算，不是实测桥梁记录。每次改参数会从相同初始条件重新运行；谱转换只播放选定频率的稳态运动，频率保持不变。</p><p>核心来源：Dynamics.m、Dynamics_MDOF.m、bridge_mode.m、bridge_mode_241011.m、cantilever_beam.html、bridge_vibration.html。bridge_demo.m 为静力截面演示，未纳入。</p><p>自由振动包含正负阻尼对比，梁振型频率已定标，启动与稳态分开显示；多频响应保留相位，避免把功率谱直接乘振幅倍率。详细提取清单、原代码与教学说明随交付压缩包提供。</p>';
$('#restore').onclick=()=>{params={};delete saved[idx];selectLesson(idx,false);};
$('#source-select').onchange=e=>{$('#source-code').textContent=ORIGINAL_SOURCES[e.target.value];};
$('#download-source').onclick=()=>{const name=$('#source-select').value,url=URL.createObjectURL(new Blob([ORIGINAL_SOURCES[name]],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const cart=$("#apparatus");
function pointerPosition(e){const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(cart.getScreenCTM().inverse());return pt.x;}
function dragMove(e){if(!drag||e.pointerId!==drag.id)return;params.amplitude=Math.max(-1.5,Math.min(1.5,Math.round((pointerPosition(e)-drag.offset-334)/drag.scale*100)/100));t=0;dragDirty=true;if(idx===0){$("#param-amplitude").value=params.amplitude;$("#value-amplitude").textContent=f(params.amplitude)+" cm";}}
cart.addEventListener('pointerdown',e=>{if(idx===0||idx>2||!e.target.closest('[data-drag-cart]')||e.button!==0)return;e.preventDefault();const r=getSample(t),scale=cartScale();playing=false;t=0;drag={id:e.pointerId,scale,offset:pointerPosition(e)-(334+Math.max(-1.5,Math.min(1.5,r.x))*scale)};cart.setPointerCapture(e.pointerId);dragMove(e);renderPhase();});
cart.addEventListener('pointermove',dragMove);
function endDrag(e,cancel=false){if(!drag||e.pointerId!==drag.id)return;if(!cancel)dragMove(e);drag=null;dragDirty=false;if(cart.hasPointerCapture(e.pointerId))cart.releasePointerCapture(e.pointerId);prepare();t=0;playing=!cancel;last=0;renderPhase();drawFrame();if(!cancel)focusForPhone();}
cart.addEventListener('pointerup',e=>endDrag(e));cart.addEventListener('pointercancel',e=>endDrag(e,true));
cart.addEventListener('keydown',e=>{if(idx===0||idx>2||!e.target.closest('[data-drag-cart]'))return;if(['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){changeParam('amplitude',Math.max(-1.5,Math.min(1.5,(params.amplitude??1)+(e.key==='ArrowRight'?.1:-.1))));cart.querySelector('[data-drag-cart]').focus();}else{playing=true;t=0;last=0;focusForPhone();renderPhase();}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')focusLab(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;renderPhase();}});
window.addEventListener('hashchange',()=>{const n=Number(location.hash.slice(1));if(ACTIVE.includes(n)&&n!==idx)selectLesson(n);});
const n=location.hash?Number(location.hash.slice(1)):8;selectLesson(ACTIVE.includes(n)?n:8,false);requestAnimationFrame(frame);focusForPhone();
})();
