"use strict";
globalThis.Room = (() => {
const byId = id => document.getElementById(id);
const keys = new Set(), step = JumpPhysics.step;
let active = false, character, level, loadout, player, enemies, arrows, effects;
let started, finished, kills, buffer, clock=0, rewards, roller, onFinish, catalog, total;
let last=0, accumulator=0, session=0, renderFrames=0, renderTime=0, trialBoot,fallDrops=[];
let titan=null,jumpStartKills=0,featuredDrop=null;
let roomGrowth,pendingIncome,awardKills=false,defeatCause="";
let options={},settledResult,guardianEnemy,exitReady=false, floorHeight=0,summonDrops=[];
let panelLocked=false;
let observatory=null,elementBoss=null,roomPlatforms=[];
let inStreet=false,mooring,waterWait=0;
let tourTile=null;
let sentinels=[];
let cameraKick=null, hitPauseTicks=0;
const struckThisDescent=new Set();
const entrance=()=>options.door?.scene==="krosos"?options.door:null;
const gorge=()=>options.door?.scene==="gorge"?options.door:null;
const landscape=()=>entrance()||gorge();
function dryDeck(x){
 const route=landscape();
 return !route||inStreet||route.decks.some(deck=>x>=deck.left-.001&&x<=deck.right+.001);
}
let paused=false, reboundFromFront=false, trialComplete=false;
const isTrial=()=>!options.onResolve && Boolean(level.trialRule && level.trialRule!=="none");
const multiGoal=()=>level.trialRule==="multi" || level.trialRule==="dual" && !!loadout.wave;
function syncPause(){
  byId("pause-layer").hidden=!paused;
  byId("pause").textContent=paused?"继续":"暂停";
  byId("pause").disabled=finished;
}
function setPaused(value){
  if(!active || finished || paused===value)return;
  paused=value;keys.clear();buffer=0;accumulator=0;last=0;syncPause();
  const token=++session;
  if(!paused){screenCanvas.focus();requestAnimationFrame(t=>frame(t,token))}
}
function updateTrial(){
  if(!isTrial())return;
  byId("trial-task").textContent=(trialComplete?"✓ 已达成 · ":"本场目标 · ")+
    (loadout.kind && !["wind","earth"].includes(loadout.kind)?"用主位能力和跳跃清除守卫":multiGoal()?"一次跳跃击杀至少 "+(level.trialKills||2)+" 名敌人":"从前排借力，落地前踩中后排");
}
function report(msg){ byId("report").textContent=msg; }
function reset(override) {
  cameraKick=null;hitPauseTicks=0;
  settledResult=null;exitReady=false;floorHeight=0;panelLocked=false;defeatCause="";
  struckThisDescent.clear();
  byId("leave").textContent=options.routeNumber?"撤离本关…":"撤离结算";
  last=0;accumulator=0;
  keys.clear(); buffer=0; started=false; finished=false; paused=false; kills=0; rewards=[]; renderFrames=0;renderTime=0;
  reboundFromFront=false;trialComplete=false;jumpStartKills=0;syncPause();
  total=level.count;
  inStreet=!!(entrance()&&options.startStreet);waterWait=0;
  if(inStreet){total=0;exitReady=true}
  if(isTrial()||options.bossDrill){
    if(override)trialBoot=override;
    override=trialBoot;
  }
  fallDrops=[];featuredDrop=null;summonDrops=[];if(byId("machine-drop"))byId("machine-drop").hidden=true;
  if(character.id==="glala"){
    const test=options.practice?(override===level.trialBoot1&&override?"mnemosyne":override===level.trialBoot2&&override?"atlas":catalog.summons.find(s=>s.id===override)?.id||options.trialSummon||(isTrial()?"mnemosyne":null)):null;
    loadout=Loadout.resolve(catalog,character,null,true,{},test?{summon:test,sampleWeight:test==="atlas"?8:0}:{});
  }else loadout=Loadout.resolve(catalog,character,override || character.boot,!override);
  const status=Growth.status(Profile.hero,catalog);
  awardKills=!!(options.onResolve && !options.practice && Profile.slot);
  roomGrowth={levelStart:status.level,levelEnd:status.level,xp:0,killGold:0,hpGain:0,staminaGain:0};
  pendingIncome={xp:0,gold:0,count:0,x:0};
  options.onProgress?.(status,null);
  const select=byId("trial-titan");if(select?.options && options.practice)select.value=loadout.titan?.id||"";
  if(options.practice && byId("trial-instructions"))byId("trial-instructions").textContent=(options.bossDrill?level.description:loadout.titan?.abilityText||level.description)+(loadout.kind==="earth"?" 演练装载 8 点额外负重。":"");
  const windControl=byId("wind-control");if(windControl){
    windControl.hidden=!loadout.extraJumps;
    windControl.textContent="；空中可再跳 "+loadout.extraJumps+" 次"+(loadout.rebound?"，按住命中可借力":"");
  }
   titan=(loadout.kind||loadout.bladeDamage)&&globalThis.TitanCombat ? TitanCombat.create(loadout,options.loopBiome?Infinity:options.door?.width):null;
  player={x:3.3,y:0,vy:0,dir:1,hp:Math.min(loadout.maxHp??character.hp,options.hp??loadout.maxHp??character.hp),landAge:1,airAge:0,motionTime:0,airJumps:loadout.extraJumps||0,stamina:Math.min(loadout.staminaMax,options.stamina??loadout.staminaMax),grace:0,windup:0,grounded:true,bonus:true,wave:true};
  const positions=level.positions ? level.positions.split(/[,，]/).map(Number) : undefined;
  if(inStreet)player.x=entrance().streetStart+1.5;
  const authored=gorge()?.authored?gorge():null;
  if(authored){player.x=authored.start.x;player.y=floorHeight=authored.start.y;exitReady=total===0}
  player.fallPeakY=player.y;
  mooring={x:player.x,y:player.y};
  const order=level.formation?.split(/[,，]/).map(s=>s.trim());
  enemies=Array.from({length:total},(_,i)=>{
    const row=catalog.monsters.find(m=>m.id===(order?order[i%order.length]:i%3===1?level.rear:level.front));
    let x=positions?.[i] ?? (total===3?(entrance()?[6.6,34.8,72.1]:[6.1,8.5,13.1])[i]:5.5+(i+.5)/total*13.3);
    // Shared rift formations still use compact-room coordinates. Translate the
    // three authored spawn marks only for this particular campaign landscape.
    if(!authored&&gorge()&&level.id==="ember_pass"&&x===[5.8,9,13.4][i])x=gorge().spawnX[i];
    const hp=Math.max(1,Math.round(row.hp*(options.hpScale??1)));
    const machine=catalog.summons?.find(s=>s.boss===row.id);
    const humanScale=gorge()?(row.kind==="guard"||row.kind==="bow"):entrance()&&["sentry","archer"].includes(row.id);
    const headHeight=humanScale?FieldCombat.profile(row.id,row.kind).head:undefined;
    const baseY=authored?.actors[i]?.y||0;
    const supports=baseY?authored.platforms:landscape()?.decks;
    const homeDeck=supports?.find(d=>Math.abs((d.y||0)-baseY)<.015&&x>=d.left&&x<=d.right);
    return {...row,poseOffset:(i*3)%8,headHeight,homeDeck,baseY,machine,name:machine?.name||row.name,hp,speed:row.speed*(options.speedScale??1),x,depth:total>18?(i%3)*2-2:0,max:hp,aim:2.8+(i%13)*.21};
  });
  sentinels=FieldCombat.mechanisms(authored?.hazards);
  globalThis.FieldArt?.preload(enemies,sentinels);
  guardianEnemy=enemies.find(e=>e.kind==="bell");
  tourTile=null;
  if(entrance()&&options.loopBiome){
    const d=entrance(),water=options.loopBiome==="water";
    d.loopBiome=options.loopBiome;
    const start=water?0:d.streetStart,end=water?d.streetStart:d.width;
    tourTile={start,length:end-start,
      platforms:d.platforms.filter(p=>p.left>=start&&p.left<end),
      decks:water?d.decks.slice():[],foes:water?enemies.map(e=>({...e})):[]};
    if(water)d.platforms=d.platforms.filter(p=>p.left<end);
  }
  if(gorge()&&options.loopBiome==="gorge"){
    const d=gorge();d.loopBiome="gorge";d.width=d.arenaStart;
    d.decks=d.decks.filter(p=>p.left<d.width);
    tourTile={start:0,length:d.width,platforms:d.platforms.slice(),decks:d.decks.slice(),foes:enemies.map(e=>({...e})),route:d.route.slice()};
  }
  for(const e of enemies)if(e.kind==="bell"){e.phase="armored";e.phaseTime=e.period??2.8;GuardianCombat.attach(e)}
  observatory=(options.bossDrill||level.id==="forge_throne"&&options.door)
    ?enemies.find(e=>e.machine?.id==="atlas"&&e.guard?.key==="earth"):null;
  roomPlatforms=options.door?.platforms||[];
  elementBoss=(options.bossDrill||options.door)?enemies.find(e=>e.guard&&ElementFrame.supported(e)):null;
  if(elementBoss){
    const x=elementBoss.x;
    if(!authored)roomPlatforms=[...roomPlatforms,{left:x-4.4,right:x-3.1,y:.92,art:"pier"},{left:x-2.9,right:x-1.65,y:1.87,art:"arch"},
      {left:x-1.48,right:x-.48,y:2.78,art:"truss"}]
      .filter(p=>p.left>=0).sort((a,b)=>b.y-a.y);
    ElementFrame.mount(elementBoss);
    elementBoss.guard.frame.platforms=roomPlatforms;
    if(options.bossDrill)byId("trial-instructions").textContent="借残台登膝甲，再跃上腕甲和肩背，破绽时落击"+elementBoss.guard.frame.cfg.site+"。";
  }
  if(observatory){
    roomPlatforms=[...GuardianCombat.bridge,...roomPlatforms].sort((a,b)=>b.y-a.y);
    GuardianCombat.mountAtlas(observatory,roomPlatforms);
    observatory.phaseTime=4.2;
    if(options.bossDrill)byId("trial-instructions").textContent="从左侧断桥登上双轨炮，随炮臂升高，跃击开启的肩核。";
  }
   globalThis.AtlasArt?.configure(!!observatory);
   globalThis.CombatArt?.preloadPlumes();
   globalThis.EffectLibrary?.preload();
   if(options.door?.scene==="krosos")globalThis.KrososArt?.preload();
   if(gorge())globalThis.GorgeArt?.preload();
  if(elementBoss)globalThis.ElementArt?.configure(elementBoss);
  arrows=[]; effects=[];syncHud();updateTrial();report((loadout.titan?.name||loadout.boot?.name||"格拉拉")+" · 总负重 "+Number(loadout.weight.toFixed(2))+" · 向右移动，空格跳跃。");
  byId("finish").hidden=true;byId("loot-ticker").textContent="";byId("perf").textContent="";
  const token=++session;requestAnimationFrame(t=>frame(t,token));
}
function syncHud(){
 byId("hp").textContent=Math.ceil(player.hp)+" / "+(loadout.maxHp??character.hp);
 byId("kills").textContent=kills+" / "+total;
 options.vitals?.(player.hp,loadout.maxHp??character.hp,player.stamina,loadout.staminaMax,titan?.state.shield||0);
}
function spend(cost) {
 if(player.stamina+1e-7<cost)return false;
 player.stamina=Math.max(0,player.stamina-cost);return true;
}
// hit() is shared by direct stomps, waves and machine attacks. Combine one impact's
// pickups before the room can settle, so a crowd does not cause one save per enemy.
function creditKills(){
  if(!pendingIncome.count)return true;
  let gain;
  try{gain=Growth.grant(Profile,catalog,pendingIncome.xp,pendingIncome.gold)}
  catch(error){report(error.message);setPaused(true);return false}
  roomGrowth.xp+=gain.xp;roomGrowth.killGold+=gain.killGold;roomGrowth.levelEnd=gain.levelEnd;
  roomGrowth.hpGain+=gain.hpGain;roomGrowth.staminaGain+=gain.staminaGain;
  loadout.maxHp+=gain.hpGain;loadout.staminaMax+=gain.staminaGain;
  player.hp=Math.min(loadout.maxHp,player.hp+gain.hpGain);
  player.stamina=Math.min(loadout.staminaMax,player.stamina+gain.staminaGain);
  const x=pendingIncome.x/pendingIncome.count;
  if(gain.killGold)fx("coin",x,.4,"+"+gain.killGold,"#f7ca68",Math.min(3,pendingIncome.count));
  if(gain.levelEnd>gain.levelStart){
    fx("num",player.x,player.y+1.55,"等级 "+gain.levelEnd+"　生命 +"+gain.hpGain+"　体力 +"+gain.staminaGain,"#f5db92");
  }
  pendingIncome={xp:0,gold:0,count:0,x:0};
  options.onProgress?.(Growth.status(Profile.hero,catalog),gain);syncHud();
  return true;
}
function fx(kind,x,y,txt="",color="#ffd98b",radius=1.25){
 if(effects.length>=96)effects.splice(effects[0]===featuredDrop?1:0,1);
 const effect={kind,x,y,txt,color,radius,age:0,life:kind==="projectileHit"?.20:kind==="wave"?.32:kind==="impact"?.22:kind==="strike"?.23:kind==="coin"?.42:.82};
 if(kind==="clip")effect.life=globalThis.EffectLibrary?.clips[txt]?.seconds??.32;
 effects.push(effect);return effect;
}
function holdMotion(seconds){
 hitPauseTicks=Math.max(hitPauseTicks,Math.ceil(seconds/step));
}
// Overlapping hits take the strongest kick and longest hold rather than stacking.
function impulse(power,dir,hold=0,axis="hit"){
 if(hold)holdMotion(hold);
 const amplitude=axis==="hit" ? power*1.2 : power;
 if(!cameraKick || cameraKick.power*(1-cameraKick.age/cameraKick.life)<=amplitude){
   cameraKick={power:amplitude,dir:dir||1,axis,age:0,life:Math.min(.24,.09+power*.018)};
 }
}
function takeoffFeedback(surface){
 const loadFraction=Math.max(0,Math.min(1,(loadout.weight-4)/8));
 const airborne=surface==="air";
 // A full load kicks up a plume twice as wide as a light load.
 const groundSize=.34983*(1+loadFraction);
 const surfaceScale=airborne ? .60 : surface==="armor" ? .82 : 1;
 const size=groundSize*surfaceScale;
 const cloud=fx("takeoffCloud",player.x,player.y,surface,"",size);
 cloud.dir=player.dir;cloud.life=airborne ? .32 : .43;
}
function groundDustRadius(dropHeight,weight){
 // Equivalent drop in metres for an unequipped (4-weight) Glala.
 const weightedDrop=dropHeight*weight/4;
 if(weightedDrop>=3.7)return 1.055;
 if(weightedDrop>=2.4)return .79;
 return .5275;
}
function landingFeedback(speed,y,surface,heavy=false){
 const fall=Math.min(1,Math.max(0,(speed-3)/11));
 const mass=Math.min(1,Math.max(0,(loadout.weight-4)/8));
 let size=.79+.39*fall+.34*mass;
 if(surface==="ground")size=groundDustRadius(Math.max(0,player.fallPeakY-y),loadout.weight);
 if(surface==="enemy")size*=.82;
 if(surface==="armor")size*=.70;
 if(surface==="core")size+=.24;
 // A stomp can pass through a defeated target onto the ground a few ticks later.
 // Soften the camera kick on that second contact.
 const settling=surface==="ground" && player.motionTime-player.strikeAt<.12;
 const cloud=fx("landingCloud",player.x,y,surface,"",size);
 cloud.dir=player.dir;
 cloud.life=surface==="ground" ? .36+.16*size : .29+.10*size;
 if(surface==="ground")impulse((2+3.8*fall+2*mass)*(settling ? .46 : 1),player.dir,0,"drop");
 else{
   // Hold the contact pose for two or three 60 Hz frames, even with shake disabled.
   player.strikeAt=player.motionTime;
   holdMotion((heavy?3:2)/60);
 }
}
function burst(style,x,y,dir=1,scale=1){
 // Neighbours in the same wave share particles; a blocked or lethal blow
 // always gets its own mark. The hit location is in room coordinates.
 if(!["wound","block","core","stomp","armor"].includes(style) &&
   effects.some(e=>e.kind==="burst"&&e.txt===style&&e.age<.045&&Math.abs(e.x-x)<.78&&Math.abs(e.y-y)<.6))return;
 const e=fx("burst",x,y,style,"",scale);
 e.dir=dir||1;e.life=style==="core"?.37:style==="burn"?.20:.27;
}
function end(win){
 if(finished||!creditKills())return;finished=true;syncPause();Profile.flush();
 if(!win && options.routeNumber)return; // Draw the final campaign frame before showing the defeat record.
 byId("leave").textContent="查看结算";
 let saveError;
 if(options.onResolve){try{settledResult=options.onResolve(outcome())}catch(error){saveError=error.message}}
 byId("perf").textContent="战斗结束 · "+(total-kills)+" 名敌人存活";
 byId("finish").hidden=false;
 if(saveError){report(saveError);return}
 report(win?"房间已肃清 · 查看战利品。":options.onResolve?"挑战失败 · 本房战利品已失落。":options.practice?"练习结束。":"战斗失败 · 已获得的装备保留。");
}
function hurt(source,attack,dir=player.dir*-1,contactY){
 if(player.grace>0||finished)return;
 const bodyHeight=landscape() ? .55 : .85;
 const y=Number.isFinite(contactY)?Math.max(player.y,Math.min(player.y+bodyHeight,contactY)):player.y+bodyHeight*.53;
 if(titan?.absorb()){
   const actorScale=landscape() ? .55 : 1;
   player.grace=.35;
   fx("clip",player.x,player.y+15*actorScale/SCALE,"shieldBreak","",59*actorScale/SCALE);
   burst("block",player.x,y,dir,.64);impulse(1.8,dir,.025);
   DropSound.contact?.("block");fx("num",player.x,player.y+1.05,"格挡","#e6c97a");return
 }
 const dmg=(options.damageScale??1)*(1-(loadout.defense||0));player.hp=Math.max(0,player.hp-dmg);player.grace=1.25;syncHud();fx("num",player.x,player.y+1.05,"-"+Number(dmg.toFixed(2)),"#ff8c83");
 player.hurtAt=clock;player.hurtDir=dir;burst("wound",player.x,y,dir);
 impulse(player.hp===0?5:3.6,dir,.042);DropSound.contact?.("wound");
 if(player.hp===0){defeatCause=[source,attack].filter(Boolean).join(" · ");end(false)}
}
function hit(enemy,value,drops,showNumber=true,breached=false,contactStyle="stomp",point){
 if(enemy.hp<=0)return;
 if(enemy.guard?.rig&&!breached){
   if(point)burst("armor",point.x,point.y,point.dir||player.dir,.65);
   return;
 }
 if(enemy.kind==="bell")value=Math.max(1,Math.round(value*(enemy.phase==="weak"?1.7:.65)));
 if(enemy.guard?.frame&&!breached)value=Math.min(value,Math.max(1,Math.ceil(enemy.max*.08)));
 enemy.hitAt=clock;enemy.hitSide=point?.dir||(enemy.x>=player.x?1:-1);
 enemy.hp=Math.max(0,enemy.hp-value);if(showNumber)fx("num",enemy.x,enemy.guard?GuardianCombat.height(enemy,SCALE)+.25:enemy.baseY+.85,"-"+value);
 const contactX=point?.x??enemy.x;
 const contactY=point?.y??(enemy.guard?enemy.guard.lift+.85:(enemy.baseY||0)+(enemy.headHeight||JumpPhysics.headHeight)*.60);
 burst(contactStyle,contactX,contactY,point?.dir||enemy.hitSide,breached?1.25:1);
 if(contactStyle!=="stomp" && !breached && contactStyle!=="wave" && Math.abs(player.x-contactX)<10){
   if(contactStyle!=="burn")impulse(1.3,enemy.hitSide);
   DropSound.contact?.(contactStyle);
 }
 if(enemy.hp)return;
 kills++;
 if(awardKills){
   const pickup=Growth.roll(enemy);
   pendingIncome.xp+=pickup.xp;pendingIncome.gold+=pickup.gold;pendingIncome.x+=enemy.x;pendingIncome.count++;
 }
 if(enemy.machine && options.onResolve && !options.practice && !Echoes.owns(Profile.hero,enemy.machine.id) && !summonDrops.includes(enemy.machine.id) && Math.random()<(enemy.machine.dropChance??1)){
   summonDrops.push(enemy.machine.id);fx("num",enemy.x,1.3,enemy.machine.name,"#f4cb85");const banner=byId("machine-drop");if(banner){banner.hidden=false;banner.textContent="虚数体 · "+enemy.machine.name+"　｜　通过本关后获得"}
 }
 for (const item of roller(level,kills===total,enemy.id)) {
   const deferred=options.practice || options.onResolve;
   const kept=deferred?false:AshenLoot.collect(Profile.bag,item);
   rewards.push({...item,sourceMonster:enemy.id,kept});if(!deferred)Profile.changed();
   drops.push({item,x:enemy.x,y:enemy.baseY});
 }
}
function announceDrops(drops) {
 if(!drops.length)return;
 const previous=fallDrops.length;
 fallDrops.push(...drops);
 const best=fallDrops.reduce((a,b)=>AshenLoot.compare(b.item,a.item)>0?b:a);
 const item=best.item;
 // Keep the burst visible without giving every item a competing nameplate.
 for(const [i,drop] of drops.slice(0,6).entries()){
   if(drop!==best)fx("gem",drop.x,(drop.y||0)+.45,"",drop.item.color,(i%2?-1:1)*(3+i));
 }
 // Separate hits may land in adjacent physics steps. Give a rare find time to read.
 if(featuredDrop && featuredDrop.age<featuredDrop.life && featuredDrop.item.rank>=2 &&
    AshenLoot.compare(featuredDrop.item,item)>0)return;
 if(fallDrops.indexOf(best)>=previous){
   const old=effects.indexOf(featuredDrop);
   if(old>=0)effects.splice(old,1);
   DropSound.play(item.rank);
   featuredDrop=fx("drop",best.x,(best.y||0)+.09,item.tierName+" · "+item.name,item.color,1+item.rank);
   featuredDrop.item=item;featuredDrop.life=[.65,.85,1.25,1.8,2.2][item.rank]??1;
 }
 const kept=Profile.bag.items.some(i=>i.uid===item.uid);
 const ticker=byId("loot-ticker");
 ticker.textContent="本次获得 "+fallDrops.length+" 件　最高："+item.tierName+" · "+item.name+"　"+ItemStrength.describe(ItemStrength.of(item))+(options.practice?" 练习掉落":options.door?" 过门后入包":options.onResolve?" 清房后入库":kept?" 已入库":" 已分解");
 ticker.style.color=item.color;
}
function contact(target,speed,point) {
 const previousKills=kills,previousTargetHP=target?.hp;
 let openedCore=false;
 const damage=Math.max(1,Math.round(JumpPhysics.damage(speed,loadout.attack)*(loadout.jumpMultiplier||1)));
 const drops=[];
 if(target){
   if(target.guard?.rig){
     if(point?.part!==1||!GuardianCombat.exposed(target)){
       burst("armor",player.x,point.y,player.dir,.76);landingFeedback(speed,point.y,"armor");
       DropSound.contact?.("block");return
     }
     openedCore=true;target.guard.rig.used=true;target.guard.rig.impact=1;
     hit(target,Math.max(damage,Math.ceil(target.max/4)),drops,false,true,"core",{x:player.x,y:point.y});
     fx("num",point.x,point.y+.35,"肩核破击","#ffe6a2");
   }else if(target.guard?.frame&&target.phase==="weak"&&!target.guard.frame.used&&point?.part===target.guard.frame.cfg.core){
     const frame=target.guard.frame;openedCore=true;frame.used=true;frame.stagger=1;
     hit(target,Math.max(damage,Math.ceil(target.max/5)),drops,true,true,"core",{x:player.x,y:point.y});
     fx("num",point.x,point.y+.35,frame.cfg.site+"破击",frame.cfg.colors[2]);
   }else{
   if(target.kind==="guard"){target.swing="recover";target.swingTime=.38}
   titan?.ignite(target,{fx});hit(target,damage,drops,true,false,"stomp",{x:player.x,y:point.y})
   }
 }
 const fault=loadout.powers?.impact_ring;
 if(target&&fault){
   fx("wave",target.x,target.baseY||0,"","#ef9e64",fault.radius);
   for(const e of enemies)if(e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.baseY-target.baseY)<=fault.radius)hit(e,Math.max(1,Math.round(damage*fault.power)),drops,false,false,"wave");
 }
 const skill=loadout.wave, wave=skill && (!target||loadout.kind!=="earth") && player.wave && speed>=skill.threshold && spend(loadout.waveCost);
 let hits=0;
 if(wave){player.wave=false;fx("wave",player.x,target?.baseY??floorHeight,"","#ffcf76",skill.radius);
   for(const e of enemies)if(e!==target&&e.hp>0&&Math.hypot(e.x-player.x,options.door?.authored?e.baseY-(target?.baseY??floorHeight):0)<=skill.radius){
    hit(e,Math.round(damage*skill.power),drops,hits++<4,false,"wave");
   }
   if(hits>0)titan?.shield(player,{fx});
   if(hits>4)fx("num",player.x,1.65,"×"+(hits+(target?1:0)),"#ffd47c");
 }
 announceDrops(drops);
 if(kills!==previousKills)syncHud();
 if(isTrial() && !trialComplete &&
   (multiGoal()?kills-jumpStartKills>=(level.trialKills||2):reboundFromFront && target?.id===level.rear)){
    trialComplete=true;updateTrial();
 }
 if(target||hits){
   const heavy=!!hits||loadout.weight>=10||openedCore;
   if(target)landingFeedback(speed,point.y,openedCore?"core":"enemy",heavy);
   else{impulse(6.8,player.dir,0,"drop");player.strikeAt=player.motionTime}
   DropSound.impact?.(heavy);
 }
 const reportedDamage=target?.guard?.frame?previousTargetHP-target.hp:damage;
 if(target||wave)report("下落 "+speed.toFixed(2)+" 米/秒 · 踩踏 "+(target?reportedDamage:0)+(wave?" · 震波 "+Math.round(damage*skill.power):""));
 checkClear();
}
function checkClear(){
 if(!creditKills())return;
 if(kills===total){
   if(isTrial() && loadout.kind && !["wind","earth"].includes(loadout.kind)){trialComplete=true;updateTrial()}
   if(options.door){
     if(!exitReady){
       const text=entrance()?(options.loopBiome==="water"?"前方水渠已畅通。":"守卫已清除 · 登上水门，进入克罗索斯街道。"):gorge()?(options.loopBiome?"栈道畅通 · 可继续向前巡游。":elementBoss?.machine?.id==="prometheus"?"炉腕已熄灭 · 穿过右侧山门，前往旧钟楼。":"守卫已清除 · 穿过终点山门。"):"守卫已清除 · 走进右侧发光拱门通关。";
       report(text);byId("adventure-status").textContent=text;
     }
     exitReady=true;
   }
   else end(true);
 }
}
function nearestHead(x,from,to){
 if(!guardianEnemy&&!landscape()&&(from<JumpPhysics.headHeight||to>JumpPhysics.headHeight))return null;
 let chosen=null,highest=-1,nearest=Infinity,ax,part;
 function check(enemy,cx,y,r,index){
   const distance=Math.abs(cx-x);
   if(from>=y&&to<=y&&distance<r&&(y>highest||(y===highest&&distance<nearest))){
     chosen=enemy;highest=y;nearest=distance;ax=cx;part=index;
   }
 }
 for(const e of enemies){
   if(!e.hp||Math.abs(e.x-x)>(e.guard?.rig||e.guard?.frame?5:1.65))continue;
   if(!e.guard){
     if(struckThisDescent.has(e))continue;
     const crown=e.headHeight&&FieldCrowns[e.id]?.[FieldCombat.posture(e,clock)];
     if(crown){
       const scale=FieldCombat.profiles[e.id].height/FieldCombat.nativeHeight[e.id];
       const side=FieldCombat.direction(e,e.x>player.x)?1:-1;
       check(e,e.x+side*crown[0]*scale,e.baseY+crown[1]*scale,.32);
     }else check(e,e.x,e.baseY+(e.headHeight??JumpPhysics.headHeight),e.headHeight ? .32 : .47);
   }
   else{
     for(let i=0;i<3;i++)check(e,GuardianCombat.partX(e,i),GuardianCombat.partY(e,i,SCALE,x),GuardianCombat.partRadius(e,i),i);
   }
 }
 return chosen?{enemy:chosen,x:ax,y:highest,part}:null;
}
function followPerch(p){
 const stand=p.perch;if(!stand)return;
 const e=stand.enemy,cx=GuardianCombat.partX(e,stand.part);
  p.x=Math.max(.55,Math.min((options.door?.width??W/SCALE)-.55,p.x+cx-stand.cx));stand.cx=cx;
 if(!e.hp||Math.abs(p.x-cx)>GuardianCombat.partRadius(e,stand.part)+.05){
   p.perch=null;p.grounded=false;p.windup=0;p.vy=0;return;
 }
 p.y=GuardianCombat.partY(e,stand.part,SCALE,p.x);
}
// A guard's body is harmless. Only the outward blade is live, after its wind-up.
function guardTurn(e,dt,p,decoy,dx){
 const target=decoy||p;
 const move=FieldCombat.profile(e.id,e.kind);
 const reach=e.headHeight?(move.fullReach??move.reach):move.reach;
 e.swingTime=(e.swingTime||0)-dt;
 if(e.swing==="tell"){
   if(e.swingTime<=0){
     e.swing="cut";e.swingTime=move.active;e.cutHit=false;
     if(Math.abs(e.x-p.x)<4){
       DropSound.contact?.("swing");
       if(e.id==="forgeguard"||e.id==="trial_guard")impulse(1.15,e.swingDir);
     }
   }
 }else if(e.swing==="cut"){
   const d=(target.x-e.x)*e.swingDir;
   if(!e.cutHit&&d>=-.14&&d<=reach&&target.y<e.baseY+.50&&target.y+.55>e.baseY){
     e.cutHit=true;if(decoy)damageShade(decoy,e.swingDir);else hurt(e.name,move.attack,e.swingDir);
   }
   if(e.swingTime<=0){e.swing="recover";e.swingTime=move.recover}
 }else{
   if(Math.abs(dx)>.38)e.x+=Math.sign(dx)*e.speed*dt;
   if(e.swingTime<=0&&Math.abs(dx)<reach&&target.y<e.baseY+1&&target.y+.55>e.baseY){
     e.swing="tell";e.swingDir=Math.sign(dx)||1;e.swingTime=move.windup;
   }
 }
}
function extendTour(x){
 const d=landscape(),water=options.loopBiome==="water",canyon=!!gorge();
 if(!water&&!inStreet&&!canyon)return;
 const end=water?d.streetStart:d.width;
 if(x+W/SCALE+2<end)return;
 const shift=end-tourTile.start;
 const shiftSpan=p=>({...p,left:p.left+shift,right:p.right+shift});
 const keepFrom=Math.max(tourTile.start,end-2*tourTile.length);
 d.tourLeft=keepFrom+.55;
 d.platforms=d.platforms.filter(p=>p.right>=keepFrom).concat(tourTile.platforms.map(shiftSpan));
 roomPlatforms=d.platforms;
 if(water||canyon){
   d.decks=d.decks.filter(p=>p.right>=keepFrom).concat(tourTile.decks.map(shiftSpan));
   for(const e of enemies.filter(e=>e.x<keepFrom)){total--;if(!e.hp)kills--}
   enemies=enemies.filter(e=>e.x>=keepFrom);
   for(const e of tourTile.foes){
     enemies.push({...e,x:e.x+shift,homeDeck:e.homeDeck&&shiftSpan(e.homeDeck)});
     total++;
   }
   if(water)d.streetStart+=tourTile.length;
   if(canyon&&d.hazards?.length){
     sentinels=sentinels.filter(s=>s.x>=keepFrom).concat(FieldCombat.mechanisms(d.hazards,shift));
   }
   if(canyon)d.route=d.route.filter(p=>p.right>=keepFrom).concat(tourTile.route.map(shiftSpan));
   exitReady=false;
   rewards=[];fallDrops=[];featuredDrop=null;syncHud();
 }
 d.width+=tourTile.length;
}
function tick(dt){
 player.motionTime=(player.motionTime||0)+dt;
 if(!started&&observatory&&!finished)GuardianCombat.poseAtlas(observatory,dt);
 if(!started&&elementBoss&&!finished)ElementFrame.pose(elementBoss,dt);
 if(!started||finished)return;
 const p=player,b=loadout;p.landAge+=dt;if(!p.grounded)p.airAge+=dt;p.grace=Math.max(0,p.grace-dt);
 if(p.grounded||p.vy>=0)struckThisDescent.clear();
 if(tourTile)extendTour(p.x);
 const move=Number(keys.has("right"))-Number(keys.has("left"));if(move)p.dir=move;
 p.stamina=Math.min(b.staminaMax,Math.max(0,p.stamina+dt*(b.regen*(p.grounded?1:.55)-Math.abs(move)*2)));
 const roomWidth=options.door?.width??W/SCALE;
 const canal=entrance(),terrain=landscape();
 if(waterWait>0){
   waterWait=Math.max(0,waterWait-dt);
   if(!waterWait){Object.assign(p,{x:mooring.x,y:mooring.y,vy:0,grounded:true,airAge:0,landAge:0,airJumps:b.extraJumps||0});floorHeight=p.y}
   return;
 }
 const leftLimit=Math.max(inStreet?canal.streetStart+.55:.55,terrain?.tourLeft||0);
 const rightLimit=canal&&!inStreet?canal.streetStart-.55:roomWidth-.55;
 let nextX=Math.max(leftLimit,Math.min(rightLimit,p.x+move*b.move*dt));
 if(terrain?.authored&&move){
   for(const s of roomPlatforms){
     if((s.art!=="rock"&&s.art!=="plinth")||p.y>=s.y-.001)continue;
     if(move>0&&p.x<=s.left&&nextX>=s.left)nextX=s.left-.001;
     if(move<0&&p.x>=s.right&&nextX<=s.right)nextX=s.right+.001;
   }
 }
 p.x=nextX;
 followPerch(p);
 const platforms=roomPlatforms;
 if(p.grounded && floorHeight>0 && !platforms.some(platform=>platform.y===floorHeight && p.x>=platform.left && p.x<=platform.right)){
   p.grounded=false;floorHeight=0;p.vy=0;
 }
 if(terrain&&!inStreet&&p.grounded&&!p.perch){
   const surfaces=floorHeight>0?platforms:terrain.decks;
   const support=surfaces.find(a=>(a.y||0)===floorHeight&&p.x>=a.left&&p.x<=a.right);
   if(support){mooring.x=Math.min(support.right-.36,Math.max(support.left+.36,p.x));mooring.y=floorHeight}
   else if(!p.perch){p.grounded=false;p.windup=0;p.vy=0}
 }
 if(buffer>0&&!p.grounded && p.airJumps>0){buffer=0;if(spend(b.reboundCost)){p.airJumps--;p.vy=b.launch*.9;p.airAge=0;takeoffFeedback("air")}}
 if(buffer>0&&p.grounded&&p.windup===0){
   buffer=0;
   if(spend(b.jumpCost)){p.windup=b.windupTicks;fallDrops=[];jumpStartKills=kills}
   else report("体力不足 · 稍候再跳。");
 }
 if(p.windup>0 && --p.windup===0){
   takeoffFeedback(p.perch?"armor":"surface");
   p.perch=null;p.vy=b.launch;p.grounded=false;p.airAge=0;titan?.jump(p,{fx});
 }
 if(!p.grounded){
  const oldY=p.y;
  // A renewed ascent (air jump or rebound) starts a fresh descent measurement.
  p.fallPeakY=p.vy>=0 ? oldY : Math.max(p.fallPeakY,oldY);
  JumpPhysics.advance(p,b);
  const point=p.vy<0?nearestHead(p.x,oldY,p.y):null,target=point?.enemy;
  const landing=platforms.find(platform=>p.vy<=0 && oldY>=platform.y && p.y<=platform.y && p.x>=platform.left && p.x<=platform.right);
  if(target&&(!landing||point.y>=landing.y)){
   if(target.headHeight&&!target.guard)struckThisDescent.add(target);
   contact(target,-p.vy,point);p.y=point.y;
   p.fallPeakY=point.y;
   const freshPart=target.guard && (p.chainBoss!==target||!(p.chainMask&(1<<point.part)));
   if(b.rebound&&-p.vy>=b.rebound.threshold&&(p.bonus||freshPart)&&(keys.has("jump")||buffer>0)&&spend(b.reboundCost)){
     if(target.guard){if(p.chainBoss!==target)p.chainMask=0;p.chainBoss=target;p.chainMask|=1<<point.part}
     p.vy=b.rebound.power;p.airAge=0;p.bonus=false;buffer=0;fallDrops=[];reboundFromFront=target.id===level.front;
     fx("num",p.x,point.y+.38,target.guard?"借风":"UP","#a8e1de")
   }else if(target.guard&&target.hp>0){
     p.grounded=true;p.vy=0;p.airAge=0;p.landAge=0;p.airJumps=b.extraJumps||0;p.bonus=true;p.wave=true;
     p.chainBoss=null;p.chainMask=0;floorHeight=0;p.perch={enemy:target,part:point.part,cx:point.x};
   }
   else{p.y=point.y-.001}
  }
  if((landing&&(!target||landing.y>point.y)) || (p.y<=0&&dryDeck(p.x))){
    if(-p.vy>2.4)landingFeedback(-p.vy,landing?.y||0,"ground");
    floorHeight=landing?.y||0;if(!floorHeight || b.kind==="earth")contact(null,-p.vy);p.landAge=0;p.airJumps=b.extraJumps||0;
    p.y=floorHeight;p.vy=0;p.grounded=true;p.bonus=true;p.wave=true;p.perch=null;p.chainBoss=null;p.chainMask=0;reboundFromFront=false;
  }
 }
 if(terrain&&!inStreet&&p.y<-.52){
   waterWait=.28;p.vy=0;p.windup=0;p.perch=null;buffer=0;
   if(canal){fx("splash",p.x,-.45,"","#a9e1db",1);report("落水了，回到最近的落脚点。")}
   else {fx("impact",p.x,-.44,"","#d8ac8a",1);report("碎石滑落，回到最近的落脚点。")}
   return;
 }
 buffer=Math.max(0,buffer-dt);
 if(finished)return;
 if(titan){const drops=[],previous=kills;titan.tick(dt,p,enemies,{fx,platforms,hit:(e,value,style,point)=>hit(e,Math.max(1,Math.round(value)),drops,true,false,style,point)});if(drops.length){const saved=fallDrops;fallDrops=[];announceDrops(drops);fallDrops=saved}if(kills!==previous){syncHud();checkClear();if(finished)return}}
 if(canal&&!inStreet&&options.loopBiome!=="water"&&exitReady&&Math.abs(p.x-canal.waterGate.x)<.46&&Math.abs(p.y-canal.waterGate.y)<.48){
   inStreet=true;floorHeight=0;buffer=0;p.x=canal.streetStart+1.5;p.y=0;p.vy=0;p.grounded=true;p.windup=0;
   p.airAge=0;p.landAge=0;p.airJumps=b.extraJumps||0;p.perch=null;effects=[];arrows=[];
   if(titan){titan.state.bolts.length=0;titan.state.blades.length=0;titan.state.shades.length=0}
   byId("adventure-status").textContent=options.loopBiome?"克罗索斯街道 · 沿街漫游":"克罗索斯街道 · 沿拱廊前往旧钟楼。";return;
 }
 if(exitReady && !options.loopBiome && (!canal||inStreet) && Math.abs(p.x-options.door.x)<.46 && Math.abs(p.y-options.door.y)<.48){
   const result={...outcome(),win:true,retreated:false};
   try{settledResult=options.onResolve(result)}catch(error){report(error.message);setPaused(true);return}
   const done=onFinish;stop();done({...result,settlement:settledResult});return;
 }
 for(const e of enemies){if(!e.hp)continue;const startX=e.x,decoy=titan?.decoy(e,p),dx=(decoy?.x??p.x)-e.x;
   if(gorge()&&e.guard?.frame&&e.engaged&&e.phase==="armored"&&Math.abs(dx)>15){ElementFrame.pose(e,dt);continue}
   if(terrain&&e.homeDeck&&!e.engaged){
     if(Math.abs(dx)>(e.guard?11.4:5.8)){if(e.guard?.frame)ElementFrame.pose(e,dt);continue;}
     e.engaged=true;
   }
   if(e.kind==="guard"){guardTurn(e,dt,p,decoy,dx)}
  else if(e.guard){GuardianCombat.step(e,dt,p,decoy,roomWidth,hurt,damageShade,weaponImpulse)}
  else if(e.kind==="bell"){
    e.phaseTime-=dt;
    if(e.phaseTime<=0){
      if(e.phase==="armored"){e.phase="warning";e.phaseTime=e.warning??.9}
      else if(e.phase==="warning"){
        fx("wave",e.x,0,"","#e17965",3).hostile=true;
       if(Math.abs(p.x-e.x)<8)impulse(2,Math.sign(p.x-e.x));
       if(Math.abs(p.x-e.x)<3 && p.y<.35)hurt(e.name,"震击",Math.sign(p.x-e.x)||1);if(decoy&&Math.abs(dx)<3 && decoy.y<.35)damageShade(decoy,Math.sign(dx));
        e.phase="weak";e.phaseTime=e.weakTime??1.3;
      }else{e.phase="armored";e.phaseTime=e.period??2.8}
    }
    if(e.phase==="armored" && Math.abs(dx)>1)e.x+=Math.sign(dx)*e.speed*dt;
  }
  else{
    if(e.speed && Math.abs(dx)>4)e.x+=Math.sign(dx)*e.speed*dt;
    FieldCombat.ranged(e,dt,dx,e.baseY,!e.headHeight,terrain?FieldCombat.profiles.archer.reach:Infinity,arrows);
  }
  if(e.homeDeck)e.x=Math.max(e.homeDeck.left+.4,Math.min(e.homeDeck.right-.4,e.x));
  e.vx=(e.x-startX)/dt;
  if(e.kind==="guard")e.walkDistance=(e.walkDistance||0)+Math.abs(e.x-startX);
 }
 followPerch(p);
 for(const s of sentinels)FieldCombat.ranged(s,dt,p.x-s.x,s.baseY,false,FieldCombat.profiles.watcher.reach,arrows);
 for(const a of arrows){
   const previous=a.x;a.age+=dt;a.x+=a.dir*a.speed*dt;
   if(terrain?.authored&&roomPlatforms.some(s=>(s.art==="rock"||s.art==="plinth")&&s.y>=a.y&&Math.max(previous,a.x)>=s.left&&Math.min(previous,a.x)<=s.right)){
     a.used=true;fx("projectileHit",a.x,a.y,a.ink,"",1);continue;
   }
   const shade=titan?.state.shades.find(s=>s.hp>0&&Math.abs(s.x-a.x)<.28&&s.y<a.y&&s.y+.8>a.y);
   if(shade){damageShade(shade,a.dir);a.used=true;continue}
   if(Math.abs(a.x-p.x)<.25&&p.y<a.y&&p.y+(terrain ? .55 : .8)>a.y){
     hurt(a.source,a.attack,a.dir,a.y);a.used=true;fx("projectileHit",a.x,a.y,a.ink,"",1);
   }
 }
 if(arrows.length)arrows=arrows.filter(a=>!a.used&&a.x>0&&a.x<roomWidth);
}
function damageShade(shade,dir){
 const before=shade.hp;
 titan?.hurtShade(shade);
 if(shade.hp<before)burst("shadow",shade.x,shade.y+.4,dir||1,.72);
}
function weaponImpulse(x,power,dir){
 const strength=power*Math.max(0,1-Math.abs(player.x-x)/20);
 if(strength>.45)impulse(strength,dir);
}
const binds={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",Space:"jump",ArrowUp:"jump"};
function press(key){if(paused || finished)return;if(!keys.has(key)&&key==="jump")buffer=.15;keys.add(key);started=true}
window.addEventListener("keydown",ev=>{
 if(!active || panelLocked || ev.target.closest("input,select,textarea") || (ev.code==="Space" && ev.target.tagName==="BUTTON"))return;
 if(ev.code==="Escape"){ev.preventDefault();if(!ev.repeat)setPaused(!paused);return}
 if(paused)return;
 if(binds[ev.code]){ev.preventDefault();if(!ev.repeat)press(binds[ev.code]);}
 if(!ev.repeat){
   if(ev.code==="KeyR" && !options.onResolve)reset();
   if(isTrial() && ["Digit1","Digit2"].includes(ev.code)){const id=ev.code==="Digit1"?level.trialBoot1:level.trialBoot2;if(id)reset(id);}
 }
});
window.addEventListener("keyup",ev=>keys.delete(binds[ev.code]));
window.addEventListener("blur",()=>{keys.clear();buffer=0;if(started)setPaused(true)});
for(const btn of document.querySelectorAll("[data-key]")){
 btn.onpointerdown=ev=>{ev.preventDefault();btn.setPointerCapture(ev.pointerId);press(btn.dataset.key)};
 btn.onlostpointercapture=()=>keys.delete(btn.dataset.key);
}
byId("reset").onclick=()=>{if(options.onResolve)return;reset();screenCanvas.focus()};
for(const btn of document.querySelectorAll("[data-trial-boot]")){
 btn.onclick=()=>{const id=level[btn.dataset.trialBoot];if(isTrial()&&id){reset(id);screenCanvas.focus()}};
}
function outcome(){
 return {win:kills===total && (!options.door || !!settledResult),retreated:!finished,kills,total,rewards,summonDrops:[...summonDrops],hp:player.hp,maxHp:loadout.maxHp??character.hp,stamina:player.stamina,defeatCause,growth:{...roomGrowth}};
}
// Only a completed crossing banks campaign loot. Inspecting the map must never resolve the room.
function campaignCheckpoint(){
 if(!active||finished||!options.routeNumber)return null;
 const best=rewards.reduce((a,b)=>!a||AshenLoot.compare(b,a)>0?b:a,null);
 return {number:options.routeNumber,stage:level.name,kills,total,exitReady,xp:roomGrowth.xp,gold:roomGrowth.killGold,
   count:rewards.length,best:best&&structuredClone(best),summons:summonDrops.map(id=>catalog.summons.find(s=>s.id===id)?.name||id)};
}
function settle(){
 if(!active||!creditKills())return;
 const current=outcome();
 if(options.onResolve && !settledResult){
   try{settledResult=options.onResolve(current)}catch(error){report(error.message);return}
 }
 stop();onFinish({...current,settlement:settledResult});
}
byId("finish").onclick=settle;
byId("pause").onclick=()=>setPaused(!paused);
byId("resume").onclick=()=>setPaused(false);
document.addEventListener("visibilitychange",()=>{if(document.hidden && started)setPaused(true)});
function frame(now,token){
 if(!active || token!==session)return;
 const elapsed=last ? (now-last)/1000 : 0;last=now;
  if(options.deadline && Date.now()>=options.deadline){settle();return}
 accumulator+=Math.min(.05,elapsed);
 while(accumulator>=step){
   accumulator-=step;
   for(const effect of effects)effect.age+=step;
   if(effects.some(effect=>effect.age>=effect.life))effects=effects.filter(effect=>effect.age<effect.life);
   if(cameraKick){cameraKick.age+=step;if(cameraKick.age>=cameraKick.life)cameraKick=null}
   if(hitPauseTicks>0){hitPauseTicks--;continue}
   clock+=step;tick(step);
   if(!active || token!==session)return;
   // Resolve after collision: a landing can kick immediately, while an airborne
   // hit can still hold the contact pose without offsetting the whole frame.
   if(!player.grounded || player.perch)cameraKick=null;
 }
 options.vitals?.(player.hp,loadout.maxHp??character.hp,player.stamina,loadout.staminaMax,titan?.state.shield||0);
 const aim=!player.grounded&&player.y>=JumpPhysics.headHeight?nearestHead(player.x,player.y,0):null;
 if(guardianEnemy&&guardianEnemy.hp<=0)guardianEnemy=enemies.find(e=>e.kind==="bell"&&e.hp>0);
 const boss=gorge()&&guardianEnemy?.homeDeck&&(!guardianEnemy.engaged||Math.abs(guardianEnemy.x-player.x)>16)?null:guardianEnemy;
 const guardian=byId("guardian-state");guardian.hidden=!boss;
 if(boss){
   const label=boss.guard?GuardianCombat.label(boss):boss.phase==="warning"?"震击蓄力 · 跳起躲避":boss.phase==="weak"?"核心暴露":"装甲闭合";
   const summary=boss.name+"　"+boss.hp+" / "+boss.max+"　"+label;
   if(guardian.textContent!==summary){guardian.textContent=summary;
     guardian.style.setProperty?.("--guardian-ink",boss.guard?.kit.mid||boss.color);
     guardian.style.setProperty?.("--guardian-vital",(100*boss.hp/boss.max)+"%");
   }
 }
 BattleView.draw({clock,cameraKick,sentinels,pose:motionPose(player,loadout),titan:titan?.state,build:loadout,enemies,total,player,character,keys,started,arrows,effects,finished,kills,aim,door:options.door,exitReady,observatory,elementBoss,roomPlatforms});
 if(finished && options.routeNumber && player.hp===0 && clock-player.hurtAt>=.12){settle();return}
 if(elapsed>0){renderFrames++;renderTime+=elapsed}
 if(!finished && renderTime>=.8){byId("perf").textContent=Math.round(renderFrames/renderTime)+" FPS · "+(total-kills)+" 活跃";renderFrames=0;renderTime=0}
 if(!finished || effects.length)requestAnimationFrame(t=>frame(t,token));
}
function motionPose(p,b){
 const clock=p.motionTime||0,phase=(v)=>Math.max(0,Math.min(1,v));
 if(p.windup){const t=1-p.windup/b.windupTicks;return t<.48?{state:"coil",phase:phase(t/.48),clock}:{state:"crouch",phase:phase((t-.48)/.52),clock}}
 if(!p.grounded && clock-p.strikeAt<.055)return {state:"land",phase:phase((clock-p.strikeAt)/.055),clock};
 if(!p.grounded){
   if(p.airAge<.11&&p.vy>0)return {state:"launch",phase:phase(p.airAge/.11),clock};
   if(Math.abs(p.vy)<1.55)return {state:"apex",phase:phase((1.55-p.vy)/3.1),clock};
   if(p.vy>0)return {state:"rise",phase:phase(1-p.vy/b.launch),clock};
   return {state:"fall",phase:phase((-p.vy-1.55)/b.launch),clock};
 }
 if(p.landAge<.075)return {state:"land",phase:phase(p.landAge/.075),clock};
 if(p.landAge<.16)return {state:"recover",phase:phase((p.landAge-.075)/.085),clock};
 return {state:keys.has("left")||keys.has("right")?"walk":"idle",phase:(clock*2.6)%1,clock};
}
function open(data,ch,stage,done,settings={}){
 options=settings;byId("reset").disabled=!!options.onResolve;
 byId("adventure-status").hidden=!options.label;
 byId("adventure-status").textContent=options.label||"";
 catalog=data;character=ch;level=stage;onFinish=done;roller=AshenLoot.makeRoller(data,Math.random,options.world??1);BattleView.clear();active=true;
 trialBoot=undefined;
 const select=byId("trial-titan"),holder=byId("trial-selector");if(holder)holder.hidden=!options.practice||!!landscape();
 if(options.practice&&select?.replaceChildren){select.replaceChildren();for(const row of data.summons){const opt=document.createElement("option");opt.value=row.id;opt.textContent=row.series+" · "+row.name;select.append(opt)}select.onchange=()=>{reset(select.value);screenCanvas.focus()}}
 byId("trial-coach").hidden=!isTrial()&&!options.bossDrill&&!options.fieldDrill;byId("trial-instructions").textContent=stage.description;
 if(options.fieldDrill)byId("trial-task").textContent="敌人与机关演武";
 if(options.bossDrill)byId("trial-task").textContent="虚数体对练";
 byId("trial-shortcuts").hidden=!isTrial()||!(stage.trialBoot1||stage.trialBoot2);
 for(const btn of document.querySelectorAll("[data-trial-boot]")){
   const item=data.equipment.find(i=>i.id===stage[btn.dataset.trialBoot]&&i.slot==="boots");
   btn.hidden=!item;btn.textContent=item?(ch.id==="glala"?(item.id==="light"?"暴风":"钢岩")+"演练":item.name+"重试"):"";
 }
 reset();screenCanvas.focus();
}
function stop(){active=false;session++;keys.clear();Profile.flush();}
return {open,stop,settle,campaignCheckpoint,
 lockPanel(){const resume=active && !paused && !finished;panelLocked=true;setPaused(true);return resume},
 closePanel(resume){panelLocked=false;if(resume)setPaused(false);else if(active&&paused)byId("resume").focus()},
 get running(){return active}};
})();

