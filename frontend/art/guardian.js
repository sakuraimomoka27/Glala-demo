// Native-pixel field choreography. Telegraphs and active strokes share the combat score.
globalThis.GuardianArt=(()=>{
 const quiet=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)"),tau=Math.PI*2;
 const px=v=>Math.round(v*SCALE),by=v=>FLOOR-px(v);
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 function line(x,y,X,Y,c,n=1){
   let a=Math.round(x),b=Math.round(y);X=Math.round(X);Y=Math.round(Y);
   const dx=Math.abs(X-a),dy=-Math.abs(Y-b),sx=a<X?1:-1,sy=b<Y?1:-1;let err=dx+dy;ctx.fillStyle=c;
   for(;;){ctx.fillRect(a,b,n,n);if(a===X&&b===Y)break;const v=2*err;if(v>=dy){err+=dy;a+=sx}if(v<=dx){err+=dx;b+=sy}}
 }
 function arc(x,y,rx,ry,a,b,c,n=1){
   const count=Math.max(4,Math.ceil(Math.abs(b-a)*6));let X=x+rx*Math.cos(a),Y=y+ry*Math.sin(a);
   for(let i=1;i<=count;i++){const t=a+(b-a)*i/count,nx=x+rx*Math.cos(t),ny=y+ry*Math.sin(t);line(X,Y,nx,ny,c,n);X=nx;Y=ny}
 }
 function stone(x,y,w,h,c,fill){for(let i=0;i<h;i++){const half=Math.floor(w*(1-Math.abs(i*2/h-1)));rect(x-half,y-h+i,half*2+1,1,c);if(fill&&half>1)rect(x-half+1,y-h+i,Math.max(1,half-1),1,fill)}}
 function spark(x,y,r,c){rect(x-r,y,2*r+1,1,c);rect(x,y-r,1,2*r+1,c)}
 function zoneMark(z,k,t){
   const leap=GuardianCombat.leaper(z.type),onSpot=z.from===z.to||leap;
   const a=px(onSpot?z.to:Math.min(z.from,z.to)),b=px(onSpot?z.to:Math.max(z.from,z.to)),r=px(z.r);
   const y=z.y?by(z.y):FLOOR-2;
   ctx.save();ctx.globalAlpha=.33;
   rect(a-r,y-2,b-a+2*r,3,k.mid);ctx.restore();
   for(let x=a-r;x<b+r;x+=8)rect(x,y,4,1,k.lit);
   for(const pos of [a-r,b+r]){rect(pos,y-5,2,6,k.mid);rect(pos-1,y-6,4,1,k.lit)}
   if(onSpot){
     const x=px(z.to);
     arc(x,FLOOR-2,r,3,0,tau,k.mid);stone(x,FLOOR-5,3,8,k.mid,k.lit);
     if(z.type==="flame"||z.type==="crag"){for(const d of [-1,1])line(x+d*(r-4),FLOOR-7,x+d*(r-9),FLOOR-13,k.mid)}
   }else{
     const d=Math.sign(z.to-z.from)||1,offset=quiet?.matches?0:Math.floor(t*12)%8;
     for(let x=a+7+offset;x<b;x+=24){line(x-d*3,y-3,x,y,k.mid);line(x,y,x-d*3,y+3,k.mid)}
   }
 }
 function flame(x,y,r,h,t,k){
   for(let j=-2;j<=2;j++){
     const cx=x+j*r*.34,hot=h*(1-Math.abs(j)*.22)*(.89+.1*Math.sin(t*11+j));
     const bend=Math.sin(t*9+j)*4;
     for(let i=0;i<hot;i+=3){const q=i/hot,w=Math.max(1,(1-q)*(r*.44+1)),X=cx+bend*q*q;
       rect(X-w,y-i-3,2*w,3,k.mid);if(q<.8)rect(X-w*.45,y-i-3,w*.75,3,k.lit)}
   }
   for(let i=0;i<7;i++){const q=(t*(quiet?.matches?0:.8)+i*.143)%1;rect(x+Math.sin(i*18+q*2)*r*(.5+q),y-3-q*(h+5),i%2+1,2,k.lit)}
 }
 function jag(x,y,r,h,k){
   for(let i=0;i<3;i++){const X=x+(i-1)*r*.52,H=h*(i===1?1:.63),w=r*(i===1?.48:.33);
     for(let j=0;j<H;j+=2){const a=j/H,half=Math.max(1,w*(1-a));rect(X-half+a*3,y-j-2,2*half,2,k.mid);rect(X-half+a*3,y-j-2,Math.max(1,half*.8),2,k.ink)}
     line(X+3,y-H,X+w*.5,y-H*.56,k.lit,2);
   }
 }
 function blade(x,y,len,d,k,tilt=0){
   line(x-d*len,y+tilt,x+d*len,y-tilt,k.ink,4);
   line(x-d*(len-3),y+tilt,x+d*len,y-tilt,k.mid,2);line(x,y,x+d*len,y-tilt,k.lit);
   line(x-d*len*.42-2,y+tilt*.42-4,x-d*len*.42+2,y+tilt*.42+4,k.lit,2);
 }
 function active(e,z,when){
   const g=e.guard,k=g.kit,s=GuardianCombat.sample(z,when),x=px(s.x),floor=(z.type==="ember"?by(s.y):FLOOR)-1,r=px(z.r),h=px(z.h),y=by(s.y),d=Math.sign(z.to-z.from)||g.dir,t=s.u;
   if(when<z.at){if(GuardianCombat.leaper(z.type))zoneMark(z,k,0);return}if(when>=z.at+z.dur)return;
   const spin=quiet?.matches?0:t;
   switch(z.type){
     case "flame":flame(x,floor,r,px(s.h),spin,k);break;
     case "ember":flame(x,floor,r,h+3,spin,k);for(let i=1;i<5;i++)rect(x-d*(r+i*3),floor-i%3-1,4,2,k.mid);break;
     case "spear":
       for(let i=0;i<3;i++){const Y=y+(i-1)*4;line(x-d*(r+9),Y+1,x+d*r,Y+1,k.ink,2);line(x-d*(r+3),Y,x+d*(r-(i===1?0:6)),Y,k.mid,2);rect(x+d*(r-(i===1?2:8)),Y-1,3,2,k.lit)}
       arc(x-d*6,y,4,8,0,tau,k.lit);break;
     case "sickle":
       arc(x-d*7,y,r,8,d<0?Math.PI*.5:-Math.PI*.5,d<0?Math.PI*1.5:Math.PI*.5,k.mid,3);
       arc(x-d*8,y,r,7,d<0?Math.PI*.5:-Math.PI*.5,d<0?Math.PI*1.5:Math.PI*.5,k.lit);for(let i=0;i<4;i++)rect(x-d*(12+i*5),y+(i%3-1)*4,5,1,k.mid);break;
     case "rush":
       for(let i=0;i<7;i++){const Y=floor-5-i*5;line(x-d*(26+i*3),Y+4,x+d*(16-i),Y,k.mid,i%3===0?2:1)}
       arc(x+d*8,floor-15,17,17,d<0?Math.PI*.5:-Math.PI*.5,d<0?Math.PI*1.5:Math.PI*.5,k.lit,2);break;
     case "quake":
       for(let i=0;i<4;i++){const X=x-d*(i*7-4),Y=floor+1+(i%2)*2;line(X,Y,X-d*9,Y+3-i%2,k.lit,2)}
       jag(x,floor,r*.64,h,k);for(let i=0;i<4;i++)stone(x-d*(r+i*4),floor-5-i%3*3,2,4,k.mid);break;
     case "crag":jag(x,floor,r,px(s.h),k);break;
     case "halo":{
       const cy=floor-h*.52;arc(x,cy,r,h*.54,0,tau,k.ink,2);
       for(let i=0;i<4;i++){const a=i*Math.PI*.5+t*tau;arc(x,cy,r,h*.54,a,a+1,k.mid,3);arc(x,cy,r-2,h*.54-1,a+.15,a+1,k.lit);blade(x+Math.cos(a)*r*.95,cy+Math.sin(a)*h*.52,6,Math.cos(a)>0?1:-1,k,4*Math.cos(a))}
       break}
     case "sword":blade(x,y,Math.max(6,r*.7),d,k,h-1);for(let i=0;i<3;i++)line(x-d*(5+i*4),y+h-4,x-d*(1+i*4),y-h+i*4,k.mid);break;
     case "vortex":case "phantom":{
       const X=px(z.to);arc(X,floor,r,4,0,tau,k.mid);
       if(!s.live){
         if(z.type==="phantom"){ctx.save();ctx.globalAlpha=g.frame?.37:.78;
           if(g.frame)ElementArt.body(e,x,floor-px(s.lift),{ghost:true,markers:false});
           else SummonArt.drawActor(ctx,x,floor-px(s.lift),d<0,e.machine,g.height*.77,1,k.mid);
           ctx.restore();stone(x,floor-px(s.lift)-12,3,9,k.mid,k.lit)}
         const lift=px(s.lift),cy=floor-lift-12;
         for(let i=0;i<4;i++){const a=spin*7+i*.96;arc(x,cy-i*6,18-i*2,4,a,a+3.7,i===0?k.lit:k.mid)}
         if(!quiet?.matches)for(let i=1;i<=3;i++){const back=GuardianCombat.sample(z,when-i*.055),bx=px(back.x),by=floor-px(back.lift);
           line(bx,by-9-i*4,x,cy-2-i*4,i===1?k.mid:k.ink,2)}
       }else{
         const q=(t-.73)/.27;for(let i=0;i<3;i++)arc(X,floor-1-i*3,r*(.75+q*.25),3+i,0,tau,i===1?k.lit:k.mid);
         for(const side of [-1,1]){line(X+side*r*.5,floor-3,X+side*(r+2),floor-h,k.mid,2);spark(X+side*(r-2),floor-h+2,2,k.lit)}
       }break}
   }
 }
 function field(e){
   if(!e.hp)return;
   const g=e.guard,k=g.kit;
   if(g.frame)ElementArt.field(e);
   if(g.zones[0]?.weapon){if(!g.frame)AtlasWeaponArt.field(e);return}
   if(e.phase==="warning"){
     for(const z of g.zones)zoneMark(z,k,g.age);
     const x=px(e.x),y=by(g.lift)-g.height-9,progress=Math.min(1,g.age/g.warning);
     arc(x,y,11,6,0,tau,k.ink,2);arc(x,y,11,6,-Math.PI/2,-Math.PI/2+tau*progress,k.lit,2);
     stone(x,y+4,3,9,k.mid,k.lit);
     for(let j=0;j<4;j++){const a=(quiet?.matches?0:g.age*2)+j*Math.PI*.5,R=15-4*progress;
       rect(x+Math.cos(a)*R,y+Math.sin(a)*R*.56,2,2,k.mid)}
   }else if(e.phase==="attack")for(const z of g.zones){
     if(!g.frame||(z.type!=="flame"&&z.type!=="ember"))active(e,z,g.age);
     if(g.frame&&g.age>=z.at&&g.age<z.at+z.dur)ElementArt.signature(e,z,GuardianCombat.sample(z,g.age));
   }
 }
 function body(e,x,base,struck){
   const g=e.guard,k=g.kit;
   const squash=e.phase==="warning"?1-.035*Math.min(1,g.age/g.warning):1;
   const y=base-px(g.lift);rect(x-g.height*.40,base-2,g.height*.8,3,"#24202d");
   SummonArt.drawActor(ctx,x,y,g.dir<0,e.machine||{ability:g.key},g.height,squash);
   for(let i=0;i<3;i++){
     const cx=px(GuardianCombat.partX(e,i)),py=by(GuardianCombat.partY(e,i,SCALE)),r=px(GuardianCombat.partRadius(e,i));
     rect(cx-r,py,r*2+1,3,"#24212f");rect(cx-r+2,py,r*2-3,1,k.mid);
     for(const side of [-1,1]){const edge=cx+side*(r-1);
       line(edge,py+1,edge-side*(i===2?4:7),py+(i===2?3:6),k.ink,2);
       line(edge,py,edge-side*3,py+2,k.lit);
       rect(cx+side*(r-5),py+2,2,2,k.mid)}
     if(!i){const weak=e.phase==="weak";stone(cx,py+9,weak?6:4,weak?12:8,k.mid,weak||struck?k.lit:k.ink);
       if(weak){for(const side of [-1,1])line(cx+side*7,py+2,cx+side*10,py-2,k.lit)}}
   }
 }
 return {field,body};
})();
