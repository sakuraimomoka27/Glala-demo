// All luminous strokes are drawn on the logical pixel grid, in the room camera.
globalThis.PixelFX=(()=>{
  const tau=Math.PI*2;
  const sheetURL=new URL("impact-frames.png",document.currentScript.src);
  const rows={fire:0,water:1,cut:2,shade:3,wind:4};
  let sheet;
  function preload(){if(!sheet){sheet=new Image();sheet.src=sheetURL}}
  function stamp(kind,x,y,progress,extent,flip=false){
    if(!sheet?.complete||!sheet.naturalWidth)return;
    const frame=progress<.16?0:progress<.42?1:progress<.73?2:3;
    const m=ctx.getTransform(),cx=Math.round(m.a*x+m.c*y+m.e),base=Math.round(m.b*x+m.d*y+m.f);
    const size=Math.max(1,Math.round(extent*Math.hypot(m.a,m.b)));
    ctx.save();ctx.setTransform(flip?-1:1,0,0,1,cx,base);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(sheet,frame*112,rows[kind]*112,112,112,-Math.round(size*.5),-size,size,size);ctx.restore();
  }
  // Transform first, then scan-convert on the backing canvas. A rotated one-pixel
  // glint never becomes a pair of translucent pixels, even during a camera move.
  function fill(points,c,context){
    const target=context||ctx;
    const m=target.getTransform(),p=points.map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
    let low=Infinity,high=-Infinity;
    for(const [,y] of p){low=Math.min(low,y);high=Math.max(high,y)}
    target.save();target.resetTransform();target.fillStyle=c;
    const top=Math.max(0,Math.ceil(low-.5)),bottom=Math.min(target.canvas.height,Math.ceil(high-.5));
    for(let row=top;row<bottom;row++){
      const y=row+.5,cuts=[];
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const a=p[i],b=p[j];if((a[1]>y)===(b[1]>y))continue;
        cuts.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cuts.sort((a,b)=>a-b);
      for(let i=1;i<cuts.length;i+=2){const left=Math.ceil(cuts[i-1]-.5);target.fillRect(left,row,Math.ceil(cuts[i]-.5)-left,1)}
    }
    target.restore();
  }
  function rect(x,y,w,h,c){fill([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c)}
  function puff(x,y,r,color){
    fill([[x-r,y-r*.4],[x-r*.45,y-r],[x+r*.4,y-r],[x+r,y-r*.4],
      [x+r,y+r*.4],[x+r*.4,y+r],[x-r*.4,y+r],[x-r,y+r*.4]],color);
  }
  const ink="#332e40",steel="#534351",bronze="#9f795d",gold="#e5bd87";
  const teal=["#125866","#18b4c3","#82f8e9","#f3fff2"];
  const amber=["#67394a","#ee7744","#ffbd55","#fff2b3"];
  const red=["#60334d","#e35653","#ff9c67","#fff2cd"];
  function line(x,y,X,Y,c,w=1){
    const m=ctx.getTransform(),ax=Math.round(m.a*x+m.c*y+m.e),ay=Math.round(m.b*x+m.d*y+m.f);
    const bx=Math.round(m.a*X+m.c*Y+m.e),by=Math.round(m.b*X+m.d*Y+m.f);
    const width=Math.max(1,Math.round(w*Math.hypot(m.a,m.b))),steps=Math.max(1,Math.abs(bx-ax),Math.abs(by-ay));
    ctx.save();ctx.resetTransform();ctx.fillStyle=c;
    for(let i=0;i<=steps;i++)ctx.fillRect(Math.round(ax+(bx-ax)*i/steps),Math.round(ay+(by-ay)*i/steps),width,width);
    ctx.restore();
  }
  function ring(x,y,rx,ry,c){
    let X=x+rx,Y=y;
    for(let j=1;j<=12;j++){
      const a=j*tau/12,nx=x+Math.cos(a)*rx,ny=y+Math.sin(a)*ry;
      line(X,Y,nx,ny,c);X=nx;Y=ny;
    }
  }
  function flare(x,y,r,c){
    fill([[x-r,y],[x-2,y-1],[x,y-r*.66],[x+1,y-2],[x+r,y],[x+2,y+1],[x,y+r*.66],[x-1,y+2]],c);
  }
  function ribbon(x,y,rx,ry,angle,sweep,width,colors,context){
    const outer=[],inner=[],edge=[];
    const n=Math.max(8,Math.ceil(Math.abs(sweep)*Math.max(rx,ry)/2));
    for(let i=0;i<=n;i++){
      const u=i/n,a=angle+sweep*u,thickness=width*(.08+.92*Math.sin(u*Math.PI)**.72);
      const radius=Math.max(1,rx-thickness),depth=Math.max(1,ry-thickness*.72);
      outer.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);
      inner.push([x+Math.cos(a)*radius,y+Math.sin(a)*depth]);
      edge.push([x+Math.cos(a)*(rx-.25*thickness),y+Math.sin(a)*(ry-.18*thickness)]);
    }
    fill([...outer,...inner.reverse()],colors[1],context);
    fill([...outer,...edge.reverse()],colors[3],context);
  }
  const screen=(x,y)=>[x*SCALE,FLOOR-y*SCALE];
  function mark(z,age,warning,colors){
    const [x,y]=screen(z.targetX,z.targetY),r=z.blastRadius*SCALE;

    ring(x,y,r,4,colors[1]);
    const lock=warning?Math.max(0,1-age):0;
    for(const d of [-1,1]){
      const edge=x+d*(r+lock*8);
      line(edge,y-6,edge,y,colors[2]);line(edge,y-6,edge-d*4,y-6,colors[2]);
    }
    line(x-4,y-3,x+4,y-3,colors[3]);line(x,y-6,x,y,colors[3]);
  }
  function muzzle(x,y,angle,amount,colors){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    const len=4+31*amount,w=2+6*amount;
    fill([[1,0],[-3,-w],[-len*.48,-w*.42],[-len*.61,-w*.64],[-len,0],
      [-len*.47,w*.53],[-len*.59,w],[-4,w*.48]],colors[1]);
    fill([[0,-2],[-len*.30,-w*.55],[-len*.78,0],[-len*.26,w*.4],[1,1]],colors[3]);
    ring(-len*.47,0,2,w*1.18,colors[2]);ctx.restore();
  }
  function beam(p,t,duration,warning,progress,colors){
    const [x,y]=screen(p.ax,p.ay),[X,Y]=screen(p.bx,p.by);
    const dx=X-x,dy=Y-y,len=Math.hypot(dx,dy);if(len<1)return;
    const angle=Math.atan2(-dy,-dx);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    if(warning||t<0){
      const q=warning?progress:1;
      ctx.globalAlpha=.35+.4*q;
      for(let i=0;i<len;i+=11)rect(-i,0,Math.min(5,len-i),1,colors[2]);
      ctx.globalAlpha=1;
      ring(0,0,3,4+q*3,colors[1]);flare(0,0,2+5*q,colors[3]);
    }else if(t<duration){
      const life=1-t/duration,live=t<.18,w=live?2+4*life:1;
      ctx.globalAlpha=live?1:life*1.4;
      fill([[0,-w],[-len*.2,-w*.9],[-len,-w*.36],[-len,w*.36],[-len*.2,w],[0,w]],colors[1]);
      rect(-len,-w*.40,len,w*.77,live?colors[3]:colors[2]);
      for(let j=0;j<2;j++){
        let lastX=0,lastY=0;
        for(let i=1;i<=22;i++){
          const f=i/22,nx=-len*f,ny=Math.sin(f*24-t*31+j*Math.PI)*Math.sin(f*Math.PI)*(w+2);
          line(lastX,lastY,nx,ny,colors[j+1]);lastX=nx;lastY=ny;
        }
      }
      for(let i=0;i<5;i++){
        const travel=((i*.21+t*1.75)%1)*len;
        ring(-travel,0,1.5,2+7*life,colors[2]);
        rect(-travel-12,(i%2?1:-1)*(w+2+i%3),10,1,colors[1]);
      }
      ctx.globalAlpha=1;
      muzzle(0,0,0,life,colors);
      flare(0,0,7+9*life,colors[3]);
      if(p.by<.02){
        ctx.save();ctx.translate(-len,0);ctx.rotate(-angle);
        const radius=6+17*(1-life);
        ring(0,0,radius,4,colors[2]);flare(0,-2,4+10*life,colors[3]);
        for(let i=0;i<9;i++){
          const a=(i+.7)*Math.PI/10,dist=radius*(.53+i%3*.32);
          const X=Math.cos(a)*dist,Y=-Math.sin(a)*dist;
          line(X,Y,X+Math.cos(a)*4,Y-Math.sin(a)*5,colors[i%2+1]);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
  function explosion(x,y,r,t,colors,kind="fire"){
    const q=Math.min(1,t/.48),hot=Math.max(0,1-q*1.6);
    ctx.save();ctx.globalAlpha=Math.min(1,(1-q)*3);
    ring(x,y,r*Math.min(1,.42+t*7),r*.22,colors[2]);
    for(let i=0;i<7;i++){
      const a=Math.PI*(.08+i*.14),reach=r*(.24+q*(i%2?.86:.65));
      const X=x+Math.cos(a)*reach,Y=y-Math.sin(a)*reach*(1.22+i%3*.19)+q*q*4;
      const radius=Math.max(1,Math.round((3+i%3)*(1-q)+3*Math.sin(q*Math.PI)));
      puff(X,Y,radius,q>.44?"#64515a":colors[0]);
      if(q<.72)puff(X-1,Y-1,Math.max(1,radius-2),q<.38?colors[2]:"#a77566");
    }
    if(hot>0){
      for(let i=0;i<6;i++){
        const a=(i+.34)*Math.PI/6,L=(.5+i%3*.27)*r*(.5+hot);
        fill([[x-4,y],[x+Math.cos(a)*L,y-Math.sin(a)*L],[x+4,y]],colors[2]);
      }
      flare(x,y-3,r*.75*hot,colors[3]);
    }
    stamp(kind,x,y+1,q,2.2*r);
    for(let i=0;i<9;i++){
      const a=(.06+i*.111)*Math.PI,v=r*(.5+i%3*.24);
      const X=x+Math.cos(a)*v*q*2,Y=y-Math.sin(a)*v*q*2+14*q*q;
      line(X,Y,X+Math.cos(a)*2,Y-Math.sin(a)*3,colors[i%2+1]);
    }
    ctx.restore();
  }
  function projectile(z,t,colors,style){
    const u=Math.min(1,t/z.flight),rocket=z.type==="missile";
    const pos=v=>{const p=Ordnance.point(z,v);return screen(p.x,p.y)};
    const [x,y]=pos(u),[nx,ny]=pos(Math.min(1,u+.004));
    const angle=Math.atan2(ny-y,nx-x);
    const samples=rocket?20:9;
    for(let j=samples;j>0;j--){
      const spacing=rocket?.013:.018,v=u-j*spacing;if(v<0)continue;
      const [X,Y]=pos(v),[xx,yy]=pos(v+spacing);
      if(rocket&&j>4){
        const wobble=Math.sin(v*56+z.index)*1.6;
        ctx.globalAlpha=1-(j-4)/22;
        line(X,Y+wobble,xx,yy+wobble,style?colors[j>10?0:1]:j>10?"#9a919d":"#e8a376",j>11?4:3);
        if(j%3===0){
          puff(X,Y+wobble,j>10?4:2,style?colors[1]:j>10?"#a096a1":"#e8ae88");
          rect(X-2,Y-1+wobble,3,2,style?colors[2]:j>10?"#dac1b3":"#ffe19d");
        }
        ctx.globalAlpha=1;
      }else line(X,Y,xx,yy,colors[j>5?1:2],j<4?3:2);
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    if(style==="wind"){
      fill([[-9,-1],[-3,-5],[6,-3],[10,-5],[6,1],[-2,4]],colors[1]);
      line(-6,2,8,-4,colors[3]);line(0,0,1,-3,colors[2]);
    }else if(style==="shade"){
      fill([[-10,0],[-3,-4],[3,-3],[8,0],[3,3],[-3,4]],colors[1]);flare(0,0,5,colors[3]);
    }else if(rocket){
      fill([[-7,0],[-13,-2],[-11,0],[-16,1],[-6,2]],colors[2]);
      fill([[-7,-2],[-8,-5],[-4,-4],[-1,-2],[4,-2],[8,0],[4,3],[-4,3],[-8,5],[-7,2]],ink);
      rect(-6,-2,9,4,"#b6a79b");rect(-5,-2,7,1,"#fff0cc");
      fill([[2,-2],[5,-1],[7,0],[4,2],[2,2]],colors[1]);rect(-6,-1,2,3,colors[2]);
    }else{
      fill([[-8,-1],[-5,-4],[2,-4],[7,-1],[7,1],[2,4],[-5,3]],ink);
      rect(-5,-2,8,4,colors[1]);rect(-3,-2,6,2,colors[3]);rect(-5,-3,2,6,colors[2]);
    }
    ctx.restore();
  }
  // The encounter owns sockets and shot timing. This renderer accepts any compatible volley.
  function volley(zones,age,warning,progress,getPort,getPath,colorsFor,style){
    for(const z of zones){
      const t=age-z.at,colors=colorsFor(z);
      if(z.type==="rail"){beam(z.path||getPath(z),t,z.dur,warning,progress,colors);continue}
      if(warning||t<z.flight)mark(z,progress,warning,colors);
      const firing=!warning&&t>=0&&z.path;
      if(warning||t<0||firing&&t<.19){
        const port=getPort(z),[x,y]=screen(port.x,port.y);
        if(firing)muzzle(x,y,port.angle+(z.type==="missile"?Math.PI/2:0),1-t/.19,colors);
        else if(z.type==="mortar"||z.index===0)flare(x,y,2+3*progress,colors[2]);
      }
      if(!firing||t>=z.dur)continue;
      if(Number.isFinite(z.path.breechX)&&t<.68){
        const [bx,by]=screen(z.path.breechX,z.path.breechY);
        ctx.save();ctx.translate(bx+8+t*47,by-3-t*47+105*t*t);ctx.rotate(t*9);
        rect(-4,-2,8,4,ink);rect(-3,-2,5,3,gold);rect(2,-2,2,4,bronze);ctx.restore();
      }
      if(t<z.flight)projectile(z,t,colors,style);
      else explosion(...screen(z.path.bx,z.path.by),z.blastRadius*SCALE,t-z.flight,colors,style||"fire");
    }
  }
  const ordnanceColors=z=>z.type==="rail"?teal:z.type==="mortar"?amber:red;
  return {preload,stamp,rect,fill,line,ring,flare,ribbon,beam,muzzle,explosion,projectile,volley,ordnanceColors};
})();
