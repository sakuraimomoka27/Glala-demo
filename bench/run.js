(()=>{
const $=id=>document.getElementById(id),frame=document.querySelector("iframe"),out=document.querySelector("output");
function ready(){if(frame.contentWindow.Room){$("start").disabled=false;out.textContent="准备就绪。"}}
frame.addEventListener("load",ready);ready();
$("start").onclick=()=>{
 const game=frame.contentWindow,doc=frame.contentDocument,data=structuredClone(game.ASHEN_CONTENT);
 const mode=$("mode").value,burst=mode==="burst",shadow=mode==="shadow",label=burst?"钢岩群杀":shadow?"残影寻敌":"百敌满载",seconds=Number($("duration").value);
 const level={...data.levels.find(l=>l.count===100)},hero={...data.characters.find(c=>c.id==="glala"),hp:2000};
 if(burst){level.front=level.rear="trial_guard";level.positions=Array.from({length:100},(_,i)=>(2.8+(i%11)*.1).toFixed(1)).join(",");level.dropChance=1;level.bonusChance=.35}
 if(shadow){for(const row of data.monsters)row.hp=99999}
 const machine=shadow?"hecate":"atlas",bag=game.AshenLoot.emptyBag(),tester={disc:[],ownedSummons:[machine],summon:machine};
 if(burst){const sample={uid:"bench-weight",kind:"echo",slot:"armor",weight:8,rank:0,stats:[{stat:"waveDamage",value:60,series:"钢岩"}]};tester.disc.push(sample.uid);bag.items.push(sample)}
 bag.selected="glala";bag.heroes={glala:tester};game.Profile={bag,hero:tester,changed(){},flush(){}};
 const view=game.BattleView,draw=view.draw,loot=game.AshenLoot,collect=loot.collect,gaps=[],costs=[];
 let first,last,waveEnd,best,dropCount=0,bursts=0,mismatch=0,effects=0,arrows=0,shadePeak=0,shadeHits=0,nextJump=0,nextWave=false,done=false;
 const toggle=on=>{for(const id of ["start","mode","duration"])$(id).disabled=on;$("cancel").disabled=!on};
 function finish(msg){if(done)return;done=true;game.Room.stop();view.draw=draw;loot.collect=collect;
   document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",interrupt);toggle(false);out.textContent=msg}
 const interrupt=()=>finish("已中断，不计为通过。"),visibility=()=>{if(document.hidden)interrupt()};
 $("cancel").onclick=interrupt;toggle(true);
 doc.querySelector("#lobby").hidden=true;doc.querySelector("#battle").hidden=false;doc.querySelector("#stage-name").textContent=label;
 const key=(type,code)=>doc.querySelector("#scene").dispatchEvent(new game.KeyboardEvent(type,{code,bubbles:true}));
 function wave(){if(done)return;nextWave=false;waveEnd=undefined;best=undefined;
   game.Room.open(data,hero,level,()=>{});key("keydown",burst||shadow?"Space":"KeyA");if(shadow)key("keyup","Space")}
   loot.collect=(bag,item)=>{dropCount++;if(!best||loot.compare(item,best)>0)best=item;return collect(bag,item)};
 const p95=a=>a.slice().sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
 view.draw=state=>{
   const now=performance.now();draw(state);const cost=performance.now()-now;first??=now;
   if(last!==undefined&&last-first>=2000){gaps.push(now-last);costs.push(cost)}
   last=now;effects=Math.max(effects,state.effects.length);arrows=Math.max(arrows,state.arrows.length);
   if(shadow){const shades=state.titan?.shades||[];shadePeak=Math.max(shadePeak,shades.length);shadeHits=state.titan?.shadeHits||0;
     if(state.player.grounded && !state.player.windup && state.player.stamina>=18 && now>=nextJump){nextJump=now+1000;key("keydown","Space");key("keyup","Space")}}
   if(burst&&state.finished&&waveEnd===undefined){waveEnd=now;bursts++;
     if(state.kills!==100||!best||!doc.getElementById("loot-ticker").textContent.includes("最高："+best.tierName+" · "+best.name))mismatch++}
   if(now-first>=2000+seconds*1000&&gaps.length){const total=gaps.reduce((a,b)=>a+b,0),fps=1000*gaps.length/total,p=p95(gaps);
     finish((fps>=30&&p<=50&&(!burst||bursts>0&&!mismatch)&&(!shadow||shadePeak===2&&shadeHits>0)?"达标":"未达标")+" · "+label+" · "+(total/1000).toFixed(1)+" 秒 · "+gaps.length+" 帧\n平均 "+fps.toFixed(1)+" FPS · 帧间隔 P95 "+p.toFixed(1)+" ms · >50 ms："+gaps.filter(v=>v>50).length+" 帧 · 绘制提交 P95 "+p95(costs).toFixed(1)+" ms\n百敌群杀 "+bursts+" 轮 · 掉落 "+dropCount+" 件 · 最高品质提示错误 "+mismatch+" 次 · 特效峰值 "+effects+" · 箭矢峰值 "+arrows+(shadow?" · 残影峰值 "+shadePeak+" · 残影命中 "+shadeHits:"")+"\n"+navigator.userAgent);return}
   if(burst&&waveEnd!==undefined&&!nextWave&&now-waveEnd>=700){nextWave=true;queueMicrotask(wave)}
   if(!burst&&state.finished){finish("中断：角色提前倒下。");return}
   const msg=label+" · "+Math.max(0,Math.floor((now-first-2000)/1000))+" / "+seconds+" 秒 · 已群杀 "+bursts+" 轮";
   if(out.textContent!==msg)out.textContent=msg;
 };
 wave();document.addEventListener("visibilitychange",visibility);window.addEventListener("blur",interrupt);
};
})();
