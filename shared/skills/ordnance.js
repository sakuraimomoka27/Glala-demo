// Room-space trajectories and swept collision for both portable and mounted weapons.
globalThis.Ordnance=(()=>{
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  // The same salvo can fire from a rig socket or from an ordinary combatant.
  const layouts={
    atlas:{
      rail:{offsets:[0,0],gap:.40,flights:[0],tail:.36,radius:.64},
      mortar:{offsets:[.70,-1.25],gap:.48,flights:[1.03],tail:.48,radius:.86},
      missile:{offsets:[0,-2.65,2.45,-.75],gap:.24,flights:[1.13,1.19],tail:.48,radius:.64}
    },
    element:{
      rail:{offsets:[0],gap:0,flights:[0],tail:.36,radius:.62},
      mortar:{offsets:[0,-2.15],gap:.28,flights:[1,1.1],tail:.48,radius:.88},
      missile:{offsets:[-1.1,1.1,0],gap:.28,flights:[1,1.1,1.2],tail:.48,radius:.62}
    },
    single:{
      rail:{offsets:[0],gap:0,flights:[0],tail:.48,radius:.62},
      mortar:{offsets:[0],gap:0,flights:[1],tail:.48,radius:.88},
      missile:{offsets:[0],gap:0,flights:[1],tail:.48,radius:.62}
    }
  };
  function plan(type,layout,source,target,edge,dir,platforms=[],mount){
    const salvo=layouts[layout][type],offsets=salvo.offsets;
    const rail=type==="rail",mortar=type==="mortar";
    const atlas=layout==="atlas",single=layout==="single",y=FieldCombat.base(target);
    const limit=atlas&&mortar&&mount?.fixedBore?source.x-4.1:edge-.65;
    const anchor=atlas?clamp(target.x,.65-Math.min(...offsets),limit-Math.max(...offsets)):target.x;
    return offsets.map((offset,i)=>{
      const margin=single?.4:.65;
      const x=atlas&&rail?target.x:clamp(anchor+offset,margin,edge-margin);
      const ledge=platforms?.find(p=>x>=p.left&&x<=p.right&&p.y<=y+(atlas?.75:.5));
      const floor=mount?.deckHeight?.(x,target)??ledge?.y??(single&&!mount?y:0);
      const flight=salvo.flights[i%salvo.flights.length];
      return {type,layout,dir,index:i,weapon:true,targetX:x,targetY:rail?y+.34:floor,edge,at:i*salvo.gap,
        flight,dur:flight+salvo.tail,blastRadius:salvo.radius};
    });
  }
  function portablePort(source,z){
    return {x:source.x,y:FieldCombat.base(source)+.55,angle:z.dir<0?0:Math.PI};
  }
  function path(z,port){
    const {x:ax,y:ay,angle}=port,bx=z.targetX,by=z.targetY;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    if(z.type==="rail"){
      if(port.fixedBore){
        const reach=Math.max(0,Math.min(ax/cos,sin<-.001?-ay/sin:100));
        return {ax,ay,bx:ax-reach*cos,by:ay+reach*sin};
      }
      const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy)||1;
      const reach=clamp(Math.min(dx<0?-ax*d/dx:dx>0?(z.edge-ax)*d/dx:24,dy<0?-ay*d/dy:24),.01,24);
      return {ax,ay,bx:ax+reach*dx/d,by:ay+reach*dy/d};
    }
    if(z.layout==="single")return {ax,ay,bx,by,cx:ax+z.dir,cy:ay+2,dx:bx-z.dir,dy:Math.max(ay,by)+3};
    if(z.type==="mortar"){
      const lead=z.layout==="atlas"?clamp(Math.abs(ax-bx)*.47,.65,3.3):clamp(Math.abs(bx-ax)*.48,1,3.5);
      return {ax,ay,bx,by,cx:ax-cos*lead,cy:ay+sin*lead,breechX:port.breechX,breechY:port.breechY};
    }
    const atlas=z.layout==="atlas";
    return {ax,ay,bx,by,cx:ax+sin*(atlas?1.5:2),cy:ay+(port.fixedBore?cos*1.5:2.1),
      dx:bx+(atlas?(z.index-1.5)*.56:1.3*(z.index-1)),dy:Math.max(ay+(atlas?2.55:2),by+(atlas?2.8:3))};
  }
  function fire(z,port){
    z.path=path(z,port);
    globalThis.DropSound?.ordnance?.(z.type);
  }
  function point(z,u){
    const p=z.path,v=1-u;
    if(z.type==="mortar")return {x:v*v*p.ax+2*v*u*p.cx+u*u*p.bx,y:v*v*p.ay+2*v*u*p.cy+u*u*p.by};
    return {x:v*v*v*p.ax+3*v*v*u*p.cx+3*v*u*u*p.dx+u*u*u*p.bx,
      y:v*v*v*p.ay+3*v*v*u*p.cy+3*v*u*u*p.dy+u*u*u*p.by};
  }
  function hits(z,age,dt,p,segment){
    const t=age-z.at;if(!z.path||t<0||t>=z.dur)return false;
    const {ax,ay,bx,by}=z.path;
    if(z.type==="rail")return t<.18&&segment(p,ax,ay,bx,by,.105);
    if(t<z.flight){
      const a=point(z,Math.max(0,t-dt)/z.flight),b=point(z,t/z.flight);
      return segment(p,a.x,a.y,b.x,b.y,z.type==="missile"?.13:.16);
    }
    const impact=t-z.flight;if(impact>.27)return false;
    const r=z.blastRadius*Math.min(1,.42+impact*7);
    const dx=Math.max(0,Math.abs(p.x-bx)-(p.halfWidth??.16));
    const dy=Math.max(by-p.y-(p.height??.64),p.y-by,0);
    return dx*dx+dy*dy<=r*r;
  }
  return {plan,portablePort,path,fire,point,hits};
})();
