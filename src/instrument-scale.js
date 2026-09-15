/* Only the explicit range control changes the comparison scale. */
const InstrumentScale=(()=>{
 const levels=[10,50,600,1200,2000,20000];
 const limit=p=>levels.includes(Number(p.displayRange))?Number(p.displayRange):10;
 const clamp=(x,L)=>Math.max(-L,Math.min(L,x));
 function ratios(z,max=5){const peak=Math.sqrt(Math.max(0,1-2*z*z)),values=Array.from({length:1001},(_,j)=>max*j/1000);for(let j=-240;j<=240;j++){const r=peak+j*z/20;if(r>=0&&r<=max)values.push(r);}values.push(1,peak);return [...new Set(values)].sort((a,b)=>a-b);}
 const selector=p=>`<label class="range-choice">固定量程<select id="display-range" aria-label="固定量程，仅手动改变">${levels.map(v=>`<option value="${v}" ${limit(p)===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
 return {levels,limit,clamp,ratios,selector};
})();
if(typeof module!=='undefined')module.exports=InstrumentScale;
