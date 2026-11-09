// Room-space projectile trajectories and swept collision shared by every mounted weapon.
globalThis.Ordnance=(()=>{
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
    const dx=Math.max(0,Math.abs(p.x-bx)-.16);
    const dy=Math.max(by-p.y-.64,p.y-by,0);
    return dx*dx+dy*dy<=r*r;
  }
  return {point,hits};
})();
