// The foreground and the rig use the battle coordinate system. Only the camera moves.
globalThis.AtlasArt=(()=>{
  const source=new URL("atlas/",document.currentScript.src);
  const frames={};
  const viewHeight=226;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let ground,vertical=0,pan=0,zoom=1,lastTime=0;
  function rect(x,y,w,h,c){box(ctx,x,y,w,h,c)}
  function shape(points,c){poly(ctx,points,c)}
  function configure(active){
    if(active)PixelFX.preload();
    document.getElementById("battle").classList.toggle("atlas-room",active);
    screenCanvas.width=W*2;screenCanvas.height=2*(active?viewHeight:H);
    ctx.imageSmoothingEnabled=false;
    vertical=0;pan=0;zoom=1;lastTime=0;
    if(!active||frames["chassis-parts"])return;
    for(const name of ["chassis-parts","rail","observatory","hatch","wall","pier"]){
      const img=new Image();img.src=new URL(name+".png",source).href;frames[name]=img;
    }
  }
  function sprite(name,x,y,w,h){
    const img=frames[name];if(!img?.naturalWidth)return false;
    ctx.drawImage(img,x,y,w,h);return true;
  }
  function tiles(c,x,y,w,h){
    box(c,x,y,w,h,"#192a32");
    for(let row=0;row<h;row+=6){
      for(let i=-(row%12?9:0);i<w;i+=19){
        const left=Math.max(0,i),width=Math.min(i+18,w)-left;
        if(width<=0)continue;
        const n=Math.abs(i*31+row*17)%4;
        box(c,x+left,y+row,width,5,["#38464a","#46524e","#35464a","#495351"][n]);
        box(c,x+left,y+row,Math.max(2,width*.62),1,"#5c6359");
      }
    }
  }
  function masonry(x,y,w,pier){
    if(frames.pier.naturalWidth){
      const capHeight=w*frames.pier.height/frames.pier.width;
      const base=y+capHeight*.71;
      if(base<FLOOR){
        const col=frames.pier;
        ctx.drawImage(col,0,col.height*.64,col.width,col.height*.13,x,base,w,FLOOR-base+2);
      }
      sprite("pier",x,y,w,capHeight);
      return;
    }
    if(pier){
      const foot=x+w*.38;
      tiles(ctx,foot,y+5,Math.max(8,w*.23),FLOOR-y+3);
      shape([[x+3,y+4],[foot+2,y+24],[foot+6,y+4]],"#475352");
      shape([[x+w-3,y+4],[foot+9,y+24],[foot+6,y+4]],"#344548");
    }
    tiles(ctx,x,y,w,7);rect(x,y,w,2,"#aca084");rect(x+2,y+2,w-4,1,"#686c61");
    rect(x+w*.23,y+4,2,4,"#b29b69");rect(x+w*.23-2,y+5,6,1,"#b29b69");
  }
  function begin(e,p,platforms,time,started){
    ctx.save();ctx.setTransform(2,0,0,2,0,0);
    const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
    const rig=e.guard.rig;
    const targetZoom=started?1.2-.20*Math.max(rig.gunSet,rig.podOpen,rig.railSet*.93):1;
    const ease=1-Math.exp(-dt*4.5);
    zoom+=(targetZoom-zoom)*ease;
    const visible=W/zoom;
    const desiredPan=Math.max(0,Math.min(W-visible,p.x*SCALE-visible*.43));
    pan+=(desiredPan-pan)*ease;
    const desiredLift=Math.max(0,p.y*SCALE-80)*(1-.74*Math.max(rig.gunSet,rig.podOpen));
    vertical+=(desiredLift-vertical)*ease;
    ctx.fillStyle="#172e38";ctx.fillRect(0,0,W,viewHeight);
    const backdropY=-72+vertical*.14;
    sprite("observatory",-pan*.13,backdropY,W+22,326);
    // Cinders sit behind the combatants and move more slowly than the near masonry.
    for(let i=0;i<16;i++){
      const x=(i*53+time*(i%3+1))%(W+15)-pan*.15;
      rect(x,(i*37+time*.85)%188,1,1,i%3?"#73958c":"#d7b574");
    }
    ctx.scale(zoom,zoom);
    const shake=reduced.matches?0:Math.sin(time*70)*(rig.recoil*1.4+rig.dorsalKick*.9);
    ctx.translate(-Math.round(pan),Math.round(viewHeight/zoom-FLOOR-10+vertical+shake));
    if(!ground){
      ground=document.createElement("canvas");ground.width=W;ground.height=36;
      const c=ground.getContext("2d");tiles(c,0,0,W,36);
      box(c,0,0,W,2,"#aba38c");box(c,0,4,W,1,"#95886c");
      for(let x=11;x<W;x+=37){box(c,x,1,2,3,"#605a4e");box(c,x+7,8,4,2,"#887454")}
    }
    if(frames.wall.naturalWidth){
      for(let x=0;x<W;x+=97)sprite("wall",x,FLOOR,98,50);
    }else ctx.drawImage(ground,0,FLOOR);
    for(const ledge of platforms)masonry(ledge.left*SCALE,FLOOR-ledge.y*SCALE,(ledge.right-ledge.left)*SCALE,true);
  }
  // Source rectangle in the packed sheet, then registration in the original 359 x 486 drawing.
  const cuts={
    backGun:[1,1,306,89,23,2],head:[309,1,102,57,118,86],
    leftFoot:[413,1,167,70,5,414],rightFoot:[1,92,124,64,232,419],
    leftShin:[127,92,122,153,39,280],rightShin:[251,92,169,162,180,276],
    leftThigh:[422,92,104,73,72,247],rightThigh:[528,92,114,63,187,241],
    pelvis:[1,256,162,116,119,198],chest:[165,256,202,142,123,75]
  };
  const units=211/486;
  const socket=(x,y)=>({x:-94+x*units,y:-211+y*units});
  const legs=[
    {hip:socket(145,243),knee:socket(100,315),ankle:socket(126,424),bend:1,
      thigh:"leftThigh",shin:"leftShin",foot:"leftFoot"},
    {hip:socket(224,238),knee:socket(247,313),ankle:socket(285,433),bend:1,
      thigh:"rightThigh",shin:"rightShin",foot:"rightFoot"}
  ];
  function plate(name){
    const [sx,sy,w,h,x,y]=cuts[name];
    ctx.drawImage(frames["chassis-parts"],sx,sy,w,h,-94+x*units,-211+y*units,w*units,h*units);
  }
  function bolt(x,y,r){
    disk(ctx,x,y,r,"#332f39");disk(ctx,x,y,r-1,"#785e51");disk(ctx,x,y,r-3,"#483941");
    rect(x-2,y-1,4,2,"#94a8a0");
  }
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const bearing=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
  // Intersection of two circles preserves both link lengths with a pinned end effector.
  function hinge(start,end,upper,lower,side){
    const span=distance(start,end),dx=(end.x-start.x)/span,dy=(end.y-start.y)/span;
    const along=(upper*upper-lower*lower+span*span)/(2*span);
    const cross=side*Math.sqrt(Math.max(0,upper*upper-along*along));
    return {x:start.x+dx*along-dy*cross,y:start.y+dy*along+dx*cross};
  }
  function atJoint(name,bind,joint,angle){
    ctx.save();ctx.translate(joint.x,joint.y);ctx.rotate(angle);
    ctx.translate(-bind.x,-bind.y);plate(name);ctx.restore();
  }
  function bearingBlock(x,y,w,h){
    shape([[x-w,y-2],[x-w+4,y-h],[x+w-4,y-h],[x+w,y-3],
      [x+w-1,y+h-2],[x+w-6,y+h],[x-w+3,y+h]],"#382f39");
    rect(x-w+4,y-h+2,2*w-9,2,"#9a8070");
    rect(x-w+3,y+1,2*w-7,3,"#615158");
  }
  function drawLeg(leg,a){
    const {hip,knee,ankle}=leg,cos=Math.cos(a.pelvisAngle),sin=Math.sin(a.pelvisAngle);
    const start={x:a.hipX+(hip.x+14)*cos-(hip.y+108)*sin,y:a.hipY+(hip.x+14)*sin+(hip.y+108)*cos};
    const step=leg===legs[0]?a.stepHeight:0;
    const heel={x:ankle.x+step*3,y:ankle.y-step*16};
    const joint=hinge(start,heel,distance(hip,knee),distance(knee,ankle),leg.bend);
    // The axle is behind both solid shells, including when the knee is deeply flexed.
    bearingBlock(start.x,start.y,9,9);
    bearingBlock(joint.x,joint.y-3,12,12);
    bearingBlock(heel.x+2,heel.y,12,7);
    bolt(joint.x,joint.y,9);bolt(heel.x,heel.y,8);
    atJoint(leg.thigh,hip,start,bearing(start,joint)-bearing(hip,knee));
    atJoint(leg.shin,ankle,heel,bearing(heel,joint)-bearing(ankle,knee));
    atJoint(leg.foot,ankle,heel,-.14*step);
  }
  function chassis(e,a){
    const img=frames["chassis-parts"];
    if(!img.complete||!img.naturalWidth){SummonArt.drawActor(ctx,0,0,true,e.machine,211);return}
    for(const leg of legs)drawLeg(leg,a);
    ctx.save();ctx.translate(a.hipX,a.hipY);
    bolt(0,0,10);
    ctx.save();ctx.rotate(a.pelvisAngle);ctx.translate(14,108);plate("pelvis");ctx.restore();
    ctx.rotate(a.angle);ctx.translate(14,108);
    bolt(-13,-153,6);bolt(32,-179,6);
    const neck={x:-13,y:-153};
    ctx.save();ctx.translate(36,-188);ctx.rotate(a.backAngle);
    ctx.translate(-36+5*e.guard.rig.dorsalKick,188);plate("backGun");ctx.restore();
    plate("chest");atJoint("head",neck,neck,a.headAngle);
    ctx.restore();
  }
  function armLink(from,to,length,width){
    ctx.save();ctx.translate(from.x,from.y);ctx.rotate(bearing(from,to));
    shape([[0,-width*.42],[5,-width*.58],[length-7,-width*.48],[length,0],
      [length-7,width*.48],[3,width*.46]],"#352e35");
    shape([[2,-width*.32],[6,-width*.48],[length-8,-width*.4],[length-4,0],
      [length-10,width*.3],[5,width*.33]],"#997753");
    shape([[3,-width*.32],[7,-width*.49],[length*.59,-width*.45],
      [length*.5,-width*.13],[12,-width*.08]],"#d1ae80");
    shape([[length*.59,-width*.45],[length-8,-width*.39],[length-5,-1],
      [length*.53,1],[length*.5,-width*.10]],"#b08b62");
    shape([[6,0],[12,-1],[length*.48,0],[length*.42,3],[11,4]],"#64504c");
    rect(8,-width*.44,length*.37,1,"#efd4a0");
    rect(length*.58,2,length*.18,1,"#463a3d");rect(length*.65,3,3,1,"#8cc7b6");
    for(let i=12;i<length*.44;i+=5)rect(i,1,2,2,"#443a40");
    ctx.restore();
  }
  function arm(a){
    const shoulder={x:a.shoulderX,y:-a.shoulderY};
    // The wrist pin is 18 pixels beneath the deck in the rail's own frame.
    const wrist={x:a.elbowX-18*Math.sin(a.railAngle),y:-a.deckY+18*Math.cos(a.railAngle)};
    const upper=57,lower=55,elbow=hinge(shoulder,wrist,upper,lower,-1);
    armLink(shoulder,elbow,upper,16);armLink(elbow,wrist,lower,12);
    // Fixed-size piston rod slides underneath the fixed-size sleeve across the elbow.
    const pin={x:elbow.x+(wrist.x-elbow.x)*.20,y:elbow.y+(wrist.y-elbow.y)*.20};
    ctx.save();ctx.translate(shoulder.x,shoulder.y);ctx.rotate(bearing(shoulder,pin));
    const end=distance(shoulder,pin);
    rect(end-34,-3,34,6,"#514852");rect(end-34,-2,34,2,"#d9cbb9");
    rect(0,-5,41,10,"#5a4845");rect(1,-4,37,3,"#c5a47b");rect(36,-5,4,10,"#937451");
    ctx.restore();
    bolt(elbow.x,elbow.y,8);bolt(wrist.x,wrist.y,9);
  }
  function drawBody(e,x,y,time){
    const a=GuardianCombat.atlasPose(e),r=e.guard.rig;
    ctx.save();ctx.translate(x,y);
    if(e.hp<=0){
      const age=Math.max(0,time-e.hitAt);
      if(age>1.1){ctx.restore();return}
      ctx.translate(0,Math.min(49,age*age*66));ctx.rotate(Math.min(.19,age*age*.24));
      ctx.globalAlpha=Math.min(1,(1.1-age)*3);
    }
    chassis(e,a);
    AtlasWeaponArt.pod(a,r.podOpen);
    const sx=a.shoulderX,sy=-a.shoulderY;
    arm(a);
    ctx.save();ctx.translate(a.elbowX,-a.deckY);ctx.rotate(a.railAngle);
    sprite("rail",-120,-12,132,58);
    rect(-110,0,97,3,"#4e463d");rect(-110,0,96,1,"#edcea0");
    for(let i=-100;i<-16;i+=15)rect(i,1,3,1,"#a48b6b");
    if(r.railSet>.25){
      const charge=e.phase==="warning"?Math.min(1,e.guard.age/e.guard.warning):r.railSet;
      for(let i=0;i<7*charge;i++){
        const pos=-35-i*11;
        rect(pos,0,6,1,"#499fa2");rect(pos,0,3,1,"#b2ffec");
      }
    }
    ctx.restore();
    // The shoulder hatch slides apart parallel to the landing, exposing the strike surface.
    const open=a.shutter,blink=Math.sin(time*7)>0;
    bolt(sx,sy+6,14);
    disk(ctx,sx,sy+5,8,open>.72?"#ffbd5c":"#30606a");
    disk(ctx,sx,sy+5,4,open>.72?"#fff0b7":"#63c9be");
    const hatch=frames.hatch;
    if(hatch.naturalWidth){
      for(const d of [-1,1]){
        const half=hatch.width/2;
        ctx.drawImage(hatch,d<0?0:half,0,half,hatch.height,
          sx+(d<0?-15:0)+d*open*10,sy,15,15*hatch.height/half);
      }
    }else for(const d of [-1,1]){
      const inner=sx+d*(1+open*10);
      shape([[inner,sy],[inner+d*12,sy],[inner+d*15,sy+6],[inner+d*7,sy+10],[inner,sy+6]],"#795e49");
      rect(Math.min(inner,inner+d*12),sy,12,2,"#e2c598");
    }
    if(open>.76){
      rect(sx-6,sy,12,2,blink?"#fff2b5":"#ffca66");
      for(const d of [-1,1])shape([[sx+d*10,sy-7],[sx+d*6,sy-5],[sx+d*10,sy-3]],"#ffe5a0");
    }
    ctx.save();ctx.translate(a.crownX,-a.crownY);ctx.rotate(a.gunAngle);
    rect(-20,0,40,2,"#d8c29d");ctx.restore();
    if(r.impact>0)for(let i=0;i<10;i++){
      const t=1-r.impact,angle=i*2.4,dist=t*(16+i);
      rect(sx+Math.cos(angle)*dist,sy+Math.sin(angle)*dist+t*t*10,2,1,"#ffdf82");
    }
    ctx.restore();
  }
  return {configure,begin,drawBody,end:()=>ctx.restore()};
})();
