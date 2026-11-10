globalThis.ElementArt=(()=>{
  const base=new URL("elements/",document.currentScript.src),assets=new Map();
  const index={head:0,chest:1,wing:2,thigh:3,shin:4,shoulder:5,upper:6,fore:7,blade:8,foot:9,pelvis:10};
  // Two pins in each rigid limb sprite register the painted axles to the skeleton.
  const fittings={
    prometheus:[[.54,.13,.48,.91],[.48,.11,.50,.93],[.37,.12,.51,.90],[.55,.10,.40,.87],[.21,.76]],
    dione:[[.49,.06,.48,.88],[.59,.12,.48,.94],[.26,.20,.53,.89],[.71,.11,.43,.86],[.26,.52]],
    mnemosyne:[[.62,.07,.66,.90],[.63,.11,.50,.94],[.78,.17,.39,.91],[.35,.12,.42,.90],[.18,.87]],
    cronus:[[.55,.12,.47,.93],[.46,.08,.50,.93],[.85,.20,.40,.91],[.69,.12,.40,.90],[.25,.51]],
    hecate:[[.58,.12,.49,.91],[.50,.12,.54,.94],[.79,.20,.57,.92],[.62,.12,.44,.88],[.29,.88]]
  };
  let camera=0,lastTime=0,pier;
  function configure(e){
    PixelFX.preload();
    const id=e.machine.id;
    document.getElementById("battle").classList.add("atlas-room");
    screenCanvas.width=W*2;screenCanvas.height=452;ctx.imageSmoothingEnabled=false;camera=lastTime=0;
    if(assets.has(id))return;
    if(!pier){pier=new Image();pier.src=new URL("../atlas/pier.png",base)}
    const sheet=new Image(),stage=new Image();const a={sheet,stage};assets.set(id,a);
    sheet.onload=()=>{
      const rear=document.createElement("canvas");rear.width=sheet.width;rear.height=sheet.height;
      const c=rear.getContext("2d");c.drawImage(sheet,0,0);c.globalCompositeOperation="source-atop";
      c.fillStyle="#151c35";c.globalAlpha=.34;c.fillRect(0,0,rear.width,rear.height);a.rear=rear;
    };
    sheet.src=new URL(id+".png",base);stage.src=new URL(id+"-stage.png",base);
  }
  function begin(e,p,platforms,time){
    const a=assets.get(e.machine.id),stage=a.stage,k=e.guard.kit;
    camera+=(Math.max(0,p.y*SCALE-139)-camera)*(1-Math.exp(-Math.min(.06,Math.max(0,time-lastTime))*6));
    lastTime=time;
    ctx.save();ctx.setTransform(2,0,0,2,0,0);
    if(stage.complete&&stage.naturalWidth){
      const size=Math.max(W/stage.width,226/stage.height);
      const w=stage.width*size;ctx.drawImage(stage,-(w-W)*(.3+.32*p.x*SCALE/W),0,w,stage.height*size);
    }else ctx.drawImage(backdrop,0,0,W,226);
    ctx.translate(0,Math.round(211-FLOOR+camera));
    // Stone edges register exactly to the one-way collision surfaces.
    const ground=FLOOR;
    if(stage.complete&&stage.naturalWidth){
      const band=Math.round(stage.height*.10);
      for(let i=0;i<16+camera;i+=12)ctx.drawImage(stage,0,stage.height-band,stage.width,band,0,ground+i,W,12);
    }
    for(const s of platforms){
      const x=Math.round(s.left*SCALE),w=Math.round((s.right-s.left)*SCALE),y=ground-Math.round(s.y*SCALE);
      const pillar=x+w*.52;
      if(pier.complete&&pier.naturalWidth){
        const cap=w*pier.height/pier.width,baseY=y+cap*.68;
        ctx.drawImage(pier,0,pier.height*.68,pier.width,pier.height*.17,x,baseY,w,Math.max(1,ground-baseY));
        ctx.drawImage(pier,x,y,w,cap);continue;
      }
      poly(ctx,[[x+1,y+2],[x+w-1,y+2],[x+w-6,y+9],[pillar+5,y+13],[pillar+3,ground],[pillar-6,ground],[pillar-6,y+14],[x+5,y+8]],"#35323b");
      box(ctx,pillar-4,y+12,5,ground-y-12,"#6a6260");box(ctx,pillar-4,y+13,1,ground-y-13,"#b0a392");
      box(ctx,x,y,w,5,"#65575a");box(ctx,x,y,w,1,"#e4d5b9");box(ctx,x+3,y+3,w-6,1,k.mid);
      for(let i=4;i<w-4;i+=9)box(ctx,x+i,y+1,2,2,"#9b8c79");
    }
  }
  function body(e,x,y,{ghost=false,markers=true}={}){
    const f=e.guard.frame,p=f.pose,id=e.machine.id,a=assets.get(id),parts=ElementParts[id],pins=fittings[id];
    if(!a?.sheet.complete||!a.sheet.naturalWidth){SummonArt.drawActor(ctx,x,y,e.guard.dir<0,e.machine,e.guard.height,1);return}
    ctx.save();ctx.translate(x,y);ctx.scale(-e.guard.dir*f.scale,f.scale);
    function sprite(name,pin,angle,extent,anchor,byWidth=false,rear=false,mirror=false){
      const [sx,sy,w,h]=parts[index[name]],scale=extent/(byWidth?w:h);
      ctx.save();ctx.translate(pin.x,pin.y);ctx.rotate(angle);
      if(mirror)ctx.scale(-1,1);
      ctx.drawImage(rear&&a.rear?a.rear:a.sheet,sx,sy,w,h,-w*anchor[0]*scale,-h*anchor[1]*scale,w*scale,h*scale);
      ctx.restore();
    }
    function link(name,start,end,reg,rear){
      const [,,w,h]=parts[index[name]],dx=(reg[2]-reg[0])*w,dy=(reg[3]-reg[1])*h;
      const X=end.x-start.x,Y=end.y-start.y,angle=Math.atan2(Y,X)-Math.atan2(dy,dx);
      sprite(name,start,angle,h*Math.hypot(X,Y)/Math.hypot(dx,dy),reg,false,rear);
    }
    function leg(l,far){
      link("shin",l.knee,l.ankle,pins[1],far);link("thigh",l.hip,l.knee,pins[0],far);
      sprite("foot",{x:l.ankle.x,y:l.ankle.y+10},0,far?19:21,[.61,1],false,far,!far);
    }
    sprite("wing",p.farWing,p.farWingAngle,f.cfg.wing*(id==="hecate"?.63:.82),pins[4],true,true);
    leg(p.farLeg,true);
    link("upper",p.rear,p.farElbow,pins[2],true);link("fore",p.farElbow,p.farHand,pins[3],true);
    sprite("shoulder",p.rear,p.tilt+p.rearUpper*.14,25,[.35,.45],true,true,true);
    leg(p.nearLeg,false);
    sprite("wing",p.wing,p.wingAngle,f.cfg.wing,pins[4],true);
    sprite("pelvis",p.hip,p.pelvisAngle,38,[.51,.24],true);
    sprite("chest",p.neck,p.tilt,45,[.49,.10]);
    sprite("head",p.neck,p.headAngle,id==="hecate"?40:34,[.53,.87]);
    link("upper",p.shoulder,p.elbow,pins[2],false);
    const weaponAnchor=id==="hecate"?[.86,.78]:[.87,.55];
    sprite("blade",p.hand,p.weapon,f.cfg.blade,weaponAnchor,true);
    link("fore",p.elbow,p.hand,pins[3],false);
    sprite("shoulder",p.shoulder,p.tilt+p.upper*.16,29,[.35,.45],true);
    if(!ghost&&markers){
      for(let i=0;i<3;i++){
        const pt=p.decks[i],r=[22,17,16][i],core=i===f.cfg.core,open=core&&e.phase==="weak"&&!f.used;
        const metal=core?f.cfg.colors[2]:"#b8b5a9";
        for(const side of [-1,1]){
          const sideX=pt.x+side*(r-4);
          const inner=pt.x+side*4;
          poly(ctx,[[inner,pt.y+2],[sideX,pt.y+.5],[sideX+side*3,pt.y+1],[sideX,pt.y+3],[inner,pt.y+5]],"#51474c");
          box(ctx,sideX-2,pt.y,5,1,metal);
        }
        if(core){
          const size=open?4:2;
          disk(ctx,Math.round(pt.x),Math.round(pt.y+2),size+1,"#302a38");
          disk(ctx,Math.round(pt.x),Math.round(pt.y+2),size,open?f.cfg.colors[3]:f.cfg.colors[1]);
          if(open){PixelFX.ring(pt.x,pt.y+2,8,6,f.cfg.colors[2]);PixelFX.flare(pt.x,pt.y+2,5,f.cfg.colors[3])}
        }
      }
    }
    ctx.restore();
  }
  function field(e){
    const g=e.guard,f=g.frame,warning=e.phase==="warning",k=f.cfg.colors;
    if(g.zones[0]?.weapon){
      PixelFX.volley(g.zones,g.age,warning,Math.min(1,g.age/g.warning),z=>ElementFrame.port(e,z),z=>ElementFrame.path(e,z),()=>k,
        e.machine.id==="hecate"?"shade":e.machine.id==="mnemosyne"?"wind":"");
      return;
    }
    const p=ElementFrame.world(e,f.pose.tip),x=p.x*SCALE,y=FLOOR-p.y*SCALE;
    if(warning){
      const charge=Math.min(1,g.age/g.warning);
      PixelFX.ring(x,y,3+5*charge,3+5*charge,k[2]);PixelFX.flare(x,y,2+charge*6,k[3]);
    }else if(e.phase==="attack"){
      const u=Math.min(1,g.age/g.activeFor);
      const s=g.dir<0?0:Math.PI;
      PixelFX.ribbon(x,y,14+9*u,9+5*u,s+u*3,.95,3,k);
    }
  }
  function signature(e,z,s){
    const k=e.guard.frame.cfg.colors,x=s.x*SCALE,y=FLOOR-s.y*SCALE,r=s.r*SCALE,h=s.h*SCALE;
    const u=s.u,dir=Math.sign(z.to-z.from)||e.guard.dir,tau=Math.PI*2;
    switch(z.type){
      case "flame":case "ember":{
        for(let i=-1;i<=1;i++){
          const height=h*(1-Math.abs(i)*.32),cx=x+i*r*.50,bend=Math.sin(u*9+i)*r*.33;
          for(let layer=0;layer<3;layer++){
            const left=[],right=[],hot=height*(1-layer*.18);
            for(let j=0;j<=12;j++){
              const v=j/12,mid=cx+Math.sin(v*8-u*13+i)*v*4+bend*v*v;
              const w=(1-v)*r*(.37-layer*.085)*(.78+.22*Math.sin(v*12+u*9));
              left.push([mid-w,y-hot*v]);right.push([mid+w,y-hot*v]);
            }
            PixelFX.fill([...left,...right.reverse()],k[1+layer]);
          }
          const spark=(u*1.6+(i+1)*.29)%1;
          PixelFX.line(cx+bend,y-height*spark,cx+bend+1,y-height*spark-3,k[2],.65);
        }
        if(!globalThis.EffectLibrary?.draw(ctx,"burn",x,y,{age:u,width:2.1*r+9,height:h*1.16,hostile:true}))
          PixelFX.stamp("fire",x,y,u,Math.min(h*1.15,2.1*r+9));
        PixelFX.ribbon(x,y,r+2,4,u*3,3.9,2,k);break;
      }
      case "spear":case "sickle":{
        if(!globalThis.EffectLibrary?.draw(ctx,"waterArrow",x,y,{age:u,width:Math.max(19,2*r),dir,hostile:true}))
          PixelFX.stamp("water",x-dir*3,y+7,u,17,dir<0);
        const a=dir>0?-1.45:1.65;
        PixelFX.ribbon(x-dir*4,y,r,Math.max(6,h+3),a,2.9,4,k);
        for(let i=0;i<3;i++){
          const bx=x-dir*(11+4*i),by=y+Math.sin(u*13+i*2)*4;
          PixelFX.line(bx,by,bx-dir*(5+i*2),by-i+1,k[2],.65);
        }break;
      }
      case "rush":case "vortex":{
        PixelFX.stamp("wind",x,y-s.lift*SCALE+2,u,2.3*r);
        for(let i=0;i<3;i++){
          const a=u*5+i*2.1,cy=y-s.lift*SCALE-5-i*5;
          PixelFX.ribbon(x,cy,12+i*4,4+i,a,2.65,2.7,k);
          const bx=x+Math.cos(a)*18,by=cy+Math.sin(a)*7;
          PixelFX.fill([[bx-4,by+2],[bx,by-2],[bx+4,by-2],[bx+1,by+1]],k[2]);
        }break;
      }
      case "halo":case "sword":{
        if(z.type==="halo")for(let i=0;i<4;i++){
          const a=u*tau+i*Math.PI*.5;
          PixelFX.ribbon(x,y-h*.52,r,h*.54,a,1,4.5,k);
          PixelFX.flare(x+Math.cos(a+1)*r,y-h*.52+Math.sin(a+1)*h*.54,3,k[3]);
        }else{
          PixelFX.stamp("cut",x,y+h,u,h*2.1,dir<0);
          PixelFX.ribbon(x-dir*6,y,r,h,-1.3+u*.7,2.6,3.2,k);
          PixelFX.flare(x+dir*r*.68,y-h,4,k[3]);
        }break;
      }
      case "phantom":{
        if(s.live){PixelFX.explosion(x,FLOOR-1,r,(u-.73)/.27*.47,k,"shade");break}
        const cy=FLOOR-s.lift*SCALE-14;
        PixelFX.ribbon(x,cy,15,8,u*7,4.5,3.5,k);
        for(let i=0;i<4;i++){
          const a=i*Math.PI*.5+u*5,bx=x+Math.cos(a)*19,by=cy+Math.sin(a)*8;
          PixelFX.fill([[bx,by-3],[bx+2,by],[bx,by+3],[bx-1,by]],k[2]);
        }
      }
    }
  }
  return {configure,begin,body,field,signature};
})();
