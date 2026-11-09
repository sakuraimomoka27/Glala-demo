globalThis.BattleView = (() => {
const cache=new Map();
const knight=[".......kkkkk......","......kgggggk.....",".....khHHHHHhk....","....khHHHHHHHhk...","....kHhhHHHhhHk...","....khkkgggkkhk...","....khkffrffkhk...","....khhhhhhhhhk...",".....kHHhhHHHk....","...kkkgggggggkk...","..khHHHhhhhhHHHk..",".khHHHHhhHhhHHHhk.",".khhHHhggggghHhhk.",".kHHhhkHHHHHkhHhk.",".khhhkkhHHHhkkhhk.","..kffkhhggghhkffk.","...kkhHHhhHHHhkk..","...kHHhHHHHHhHk...","..khHHhHHHHHhhhk..","..khhHHhkkhHhhhk..","...khHHk..kHHhk...","...kbbbk..kbbbk...","..kBBbbk..kbBBbk..","..kkkkkk..kkkkkk.."];
const scout=[".......kkk........","......kpppk.......",".....kpvpppk......","....kpvvppppk.....","...kppvppvvppk....","...kpvkffrffpk....","...kppkfffffpk....","....kppgggggk.....","...kppvggggvpk....","..kppvppggppvvk...","..kppppplllppvk...","..kpppkllllkpvk...","..kppkkggggkkfk...","..kffkplllppkkk...","...kkpppppppk.....","...kpppkkpppk.....","...kpppk.kppk.....","...kbbbk.kbbk.....","...kBBbk.kBBbk....","...kkkkk.kkkkk...."];
const bellKeeper=["........ggg........",".......kgggk.......","......khHHHhk......","....kkhHHHHHhkk....","...khHHgggggHHhk...","..khHHhkkfkkhHHhk..","..khHHhffrffhHHhk..","..khHHhkkfkkhHHhk..",".khHHHHgggggHHHHhk.",".khHHhHHHHHHHhHHhk.","khHHhhhHgggHhhhHHhk","kgggggggggggggggggk","...kbBBk...kBBbk...","...kkkkk...kkkkk..."];
const shade=[".k........k..",".kh......hk..","..khkkkkhk...","..khhhhhhk...","...kffrfk....","..khhhhhhk...","...khhhhkk...","..khhkhhhhk..",".khhk..khhhk.","..khhhkkhhhk.","...khhhhhhkk.","..khhhhhhk...","..khhkkhk....",".khhk..kk....","..kk........."];
const avatars={witch:hero,knight,scout};
function actor(rows,x,y,face,color,flash=false){
 let colors=cache.get(rows);if(!colors){colors=new Map();cache.set(rows,colors)}
 let poses=colors.get(color);if(!poses){poses=[];colors.set(color,poses)}
 const side=Number(face)+(flash?2:0);let frame=poses[side];
 if(!frame){
   frame=document.createElement("canvas");frame.width=Math.max(...rows.map(row=>row.length));frame.height=rows.length;
   const body=frame.getContext("2d");sprite(body,rows,0,0,1,face,{...pal,p:color,h:color});
   if(flash){body.globalCompositeOperation="source-atop";body.fillStyle="#ffebbfaa";body.fillRect(0,0,frame.width,frame.height)}
   poses[side]=frame;
 }
 ctx.drawImage(frame,x,y);
}
function draw({clock,cameraKick,enemies,sentinels=[],total,player,character,keys,started,arrows,effects,finished,kills,aim,door,exitReady,pose,titan,build,observatory,elementBoss,roomPlatforms}){
 let viewLeft=0;
 const gorge=door?.scene==="gorge",smallWorld=gorge||door?.scene==="krosos";
 if(gorge){
   viewLeft=GorgeArt.begin(door,player,roomPlatforms,clock,exitReady);
   if(elementBoss?.hp>0&&Math.abs(elementBoss.x-player.x)<26)ElementArt.body(elementBoss,elementBoss.x*SCALE,FLOOR-elementBoss.guard.lift*SCALE);
 }else if(observatory){
   AtlasArt.begin(observatory,player,roomPlatforms,clock,started);
   if(door)drawExit(door,exitReady,clock,false);
   AtlasArt.drawBody(observatory,Math.round(observatory.x*SCALE),FLOOR,clock);
 }else if(elementBoss){
   ElementArt.begin(elementBoss,player,roomPlatforms,clock);
   if(door)drawExit(door,exitReady,clock,false);
   if(elementBoss.hp>0)ElementArt.body(elementBoss,elementBoss.x*SCALE,FLOOR-elementBoss.guard.lift*SCALE);
 }else{
 ctx.save();
 const density=screenCanvas.width/W;
 ctx.setTransform(density,0,0,density,0,0);
 if(door?.scene==="krosos"){
   viewLeft=KrososArt.begin(door,player,clock,exitReady);
 }else{
 ctx.drawImage(backdrop,0,0);
 if(door){globalThis.WorldArt?.roomLayer?.(ctx,door.theme,W,H);drawExit(door,exitReady,clock)}
 for(let x of [27,149,471,549]){let y=100+Math.floor(x%3)*5;
 box(ctx,x-3,y,6,5,"#806047");box(ctx,x-1,y+3,2,8,"#563b36");
 let sway=Math.floor(Math.sin(clock*8+x)*2);poly(ctx,[[x-4,y],[x-3,y-6],[x+sway,y-12],[x+3,y-5],[x+4,y]],"#ed9357");box(ctx,x-1,y-5,3,5,"#ffdb88")}
 for(let i=0;i<19;i++){let x=(i*97+clock*3)%W,y=151-(i*29+clock*(4+i%3))%104;box(ctx,x,y,1,1,i%3?"#b79273":"#e1b483")}
 }
 }
 for(const e of enemies)if(e.guard)GuardianArt.field(e);
 for(const s of sentinels)if(s.x*SCALE>=viewLeft-50&&s.x*SCALE<=viewLeft+W+50)FieldArt.watcher(s,clock,player.x);
 let deathSprites=0;
 for(const e of enemies){
 const hitAge=clock-(e.hitAt??-Infinity),struck=hitAge<.095,dying=e.hp<=0;
 if(dying&&(!struck||deathSprites++>=6))continue;
 const recoil=struck?Math.ceil(3*(1-hitAge/.095)):0;
 const x=Math.round(e.x*SCALE)+recoil*(e.hitSide||1),bow=e.kind==="bow",face=e.x>player.x;
 if(smallWorld&&!e.guard&&(x<viewLeft-100||x>viewLeft+W+100))continue;
 const baseline=FLOOR+e.depth-Math.round((e.baseY||0)*SCALE)-(recoil?1:0);
 if(dying){ctx.save();ctx.globalAlpha=Math.max(.15,1-hitAge/.095)}
 if(total<30)box(ctx,x-9,baseline-2,18,2,"#1b1b26");if(e.guard){
   if(!e.guard.rig&&!e.guard.frame)GuardianArt.body(e,x,baseline,struck);
 }else if(e.kind==="bell"){
   const tint=e.phase==="weak"?"#ffdc83":e.color;
   if(e.machine && globalThis.SummonArt)SummonArt.drawActor(ctx,x,baseline,face,e.machine);else actor(bellKeeper,x-9,baseline-16,face,tint,struck);
   if(e.phase==="warning"){box(ctx,x-3*SCALE,baseline-1,6*SCALE,2,"#df7554");box(ctx,x-1,baseline-31,2,6,"#ffca7c")}
   if(e.phase==="weak")box(ctx,x-3,baseline-17,6,3,"#ffed9c");
 }else if(!FieldArt.draw(e,x,baseline,face,clock)){const rows=bow?bowman:e.id==="shade"?shade:mob;actor(rows,x-7,baseline-rows.length,face,e.color,struck)}
 if(!dying&&e.kind!=="bell")FieldArt.cues(e,x,baseline);
 if(dying){ctx.restore();continue}
 if(!e.guard&&(total<30||e.hp<e.max)){const bar=baseline-(e.headHeight?Math.ceil(FieldCombat.profile(e.id,e.kind).height*SCALE)+4:22);box(ctx,x-8,bar,16,2,"#261e27");box(ctx,x-8,bar,Math.ceil(e.hp/e.max*16),2,"#d78479")}}
 if(titan){
   for(const blade of titan.blades){
     const x=Math.round(blade.x*SCALE),y=Math.round(FLOOR-blade.y*SCALE);
     ctx.save();ctx.translate(x,y);ctx.scale(blade.dir,1);
     PixelFX.ribbon(-2,0,12,7,blade.age*22,3.9,4,["","#627f82","#c0eee5","#ffefae"]);
     box(ctx,-17,-1,12,1,"#96c4b1");ctx.restore();
   }
   for(const b of titan.bolts){
     const xx=b.x*SCALE,yy=FLOOR-b.y*SCALE,r=Math.max(2,Math.round((build.shotSize||.32)*8));
     ctx.save();ctx.translate(xx,yy);ctx.scale(b.dir,1);
     PixelFX.fill([[-20,0],[-4,-r],[3,-r],[8,0],[2,r],[-5,r]],"#398ca7");
     PixelFX.fill([[-13,0],[1,-r+1],[7,0],[1,r-1]],"#c1fff9");ctx.restore();
   }
   for(const s of titan.shades){ctx.save();ctx.globalAlpha=.52;GlalaArt.drawActor(ctx,Math.round(s.x*SCALE),Math.round(FLOOR-s.y*SCALE),s.face<0,character,{state:s.mode==="wait"?"idle":s.phase<.20?"launch":s.phase<.68?"apex":"fall",phase:s.phase,clock},smallWorld ? .55 : 1);ctx.restore()}
   if(titan.flash>0){const radius=Math.round(build.slashRadius*SCALE),x=player.x*SCALE,y=FLOOR-(player.y+.35)*SCALE;
     const phase=1-titan.flash/.23;
     ctx.save();ctx.globalAlpha=Math.min(1,titan.flash*12);ctx.translate(x,y);ctx.scale(player.dir,1);
     PixelFX.ribbon(0,0,radius,radius*.70,-2.8+phase*2.1,4.5,7,["","#ad7d4c","#edb76d","#fff2b7"]);
     PixelFX.ribbon(0,1,radius*.84,radius*.56,-2.5+phase*2.1,3.2,2,["","#e5c891","#ffe8a1","#fff6cd"]);ctx.restore();}
   if(titan.shield){const x=player.x*SCALE,y=FLOOR-player.y*SCALE;box(ctx,x-12,y-12,2,10,"#d3ba83");box(ctx,x+11,y-12,2,10,"#d3ba83");}
   if(build.kind==="burn")for(const e of enemies){if(e.hp>0&&e.burnLeft>0&&Math.abs(e.x-player.x)<21){
     const x=e.x*SCALE,y=FLOOR-(e.baseY||0)*SCALE;
     PixelFX.stamp("fire",x,y-1,(clock*1.8+e.poseOffset*.08)%1,20+2*e.burnStacks);
   }}
 }
 const p=player,px=Math.round(p.x*SCALE),py=Math.round(FLOOR-p.y*SCALE);
 const canal=door?.scene==="krosos";
 const overWater=canal&&p.x<door.streetStart&&!door.decks.some(d=>p.x>=d.left&&p.x<=d.right);
 const overRavine=gorge&&!door.decks.some(d=>p.x>=d.left&&p.x<=d.right);
 let shadowY=overWater?FLOOR+13:overRavine?Infinity:FLOOR;
 if(smallWorld)for(const ledge of roomPlatforms){
   if(p.x>=ledge.left && p.x<=ledge.right && p.y>=ledge.y)shadowY=Math.min(shadowY,FLOOR-ledge.y*SCALE);
 }
 if(!p.grounded && p.y>.35&&(aim||Number.isFinite(shadowY))){
   const base=aim?Math.min(FLOOR-aim.y*SCALE,shadowY):shadowY;
   const tint=aim?"#ffe3a3":"#ad9faa";
   for(let y=py+4;y<base-2;y+=5)box(ctx,px,y,1,2,tint);
   const ax=aim?Math.round(aim.x*SCALE):px;
   box(ctx,ax-6,base-1,4,1,tint);box(ctx,ax+3,base-1,4,1,tint);
 }
 if(smallWorld){if(Number.isFinite(shadowY))box(ctx,px-5,shadowY-1,10,1,overWater&&shadowY>FLOOR?"#347578":"#1a1a22");}
 else box(ctx,px-8,FLOOR-2,16,2,"#1a1a22");
 CombatArt.descent(p,px,py,smallWorld);
 if(globalThis.GlalaArt)CombatArt.glala(p,px,py,character,pose,smallWorld,clock);else actor((avatars[character.sprite]||hero),px-10,py-(avatars[character.sprite]||hero).length,p.dir<0,character.color);
 for(const a of arrows)FieldArt.projectile(a);
 let featured=null;
 for(const e of effects){let x=e.x*SCALE,y=FLOOR-e.y*SCALE,t=e.age/e.life;
  if(e.kind==="splash"){for(const side of [-1,1]){box(ctx,x+side*(4+10*t),y,5,1,"#a3dace");box(ctx,x+side*(2+6*t),y-7*Math.sin(Math.PI*t),2,2,"#d4f0de")}}
  else if(e.kind==="wave")CombatArt.wave(e);
  else if(e.kind==="burst")CombatArt.burst(e);
  else if(e.kind==="stepDust")CombatArt.dust(e);
  else if(e.kind==="projectileHit")FieldArt.hit(e);
  else if(e.kind==="impact"){
    for(let j=0;j<6;j++){
      const offset=(j-2.5)*3*e.radius*t;
      box(ctx,x+offset,y-3-7*Math.sin(t*Math.PI)*(j%2?1:.6),2,2,e.color);
    }
  }else if(e.kind==="coin"){
    // Show at most three motes for a pickup batch; all converge on the moving actor.
    const pull=t*t,xx=x+(px-x)*pull,yy=y+(py-7-y)*pull-Math.sin(Math.PI*t)*10;
    for(let j=0;j<e.radius;j++){
      const spread=(j-(e.radius-1)/2)*5*(1-pull);
      box(ctx,xx+spread-1,yy-2,3,4,"#aa7536");box(ctx,xx+spread,yy-2,1,3,"#ffe095");
    }
    ctx.textAlign="center";ctx.font="bold 8px monospace";ctx.fillStyle=e.color;ctx.fillText(e.txt,xx,yy-4);
  }else if(e.kind==="gem"){
    const xx=x+e.radius*t, yy=y-12*Math.sin(t*Math.PI);
    box(ctx,xx-1,yy-2,3,4,e.color);box(ctx,xx-2,yy-1,5,2,e.color);
  }else if(e.kind==="drop"){featured=e;
  }else{ctx.font="bold 9px monospace";ctx.textAlign="center";ctx.fillStyle="#1f1927";ctx.fillText(e.txt,x+1,y-12*t+1);ctx.fillStyle=e.color;ctx.fillText(e.txt,x,y-12*t)}}
 if(finished&&!door){ctx.fillStyle="#17141ed9";ctx.fillRect(0,64,W,42);ctx.fillStyle="#f4d49b";ctx.font="bold 16px SimSun, monospace";ctx.textAlign="center";ctx.fillText(kills===total?"房间已肃清":"探索中断",W/2,91)}
 if(featured)CombatArt.drop(featured,viewLeft);
 ctx.restore();
 CombatArt.shake(cameraKick);
}

function drawExit(door,ready,time,paintPlatforms=true){
 if(paintPlatforms)for(const platform of door.platforms){
   const x=platform.left*SCALE,y=FLOOR-platform.y*SCALE,w=(platform.right-platform.left)*SCALE;
   box(ctx,x,y,w,5,"#544b55");box(ctx,x,y,w,2,"#aaa092");
   for(let i=x+3;i<x+w-4;i+=14){box(ctx,i,y+5,6,3,"#4a444c")}
 }
 const x=Math.round(door.x*SCALE),y=Math.round(FLOOR-door.y*SCALE);
 box(ctx,x-10,y-30,20,30,"#19151e");box(ctx,x-13,y-29,4,29,"#867666");box(ctx,x+9,y-29,4,29,"#867666");
 box(ctx,x-9,y-33,18,4,"#a89176");box(ctx,x-6,y-36,12,3,"#776857");
 if(ready){
   const lit=Math.floor(time*3)%2?"#f7ce84":"#ead49d";
   box(ctx,x-8,y-27,16,26,"#725740");box(ctx,x-5,y-25,10,24,"#927954");
   box(ctx,x-5,y-14,8,2,lit);box(ctx,x+1,y-16,2,6,lit);
 }else for(let i=-7;i<=7;i+=4)box(ctx,x+i,y-27,2,27,"#514953");
}
return {draw,clear:()=>cache.clear()};
})();
