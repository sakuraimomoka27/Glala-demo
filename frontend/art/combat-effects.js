// Draw in the same logical pixels as the actors. Only the featured drop needs a miniature.
globalThis.CombatArt=(()=>{
  const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  let picturedItem=null,miniature=null,captionWidth=0;
  function star(x,y,r,color){
    box(ctx,x-r,y,2*r+1,1,color);box(ctx,x,y-r,1,2*r+1,color);
    if(r>2)box(ctx,x-1,y-1,3,3,color);
  }
  function strike(effect){
    const t=effect.age/effect.life,x=Math.round(effect.x*SCALE),y=Math.round(FLOOR-effect.y*SCALE);
    const heavy=effect.radius===2,spread=heavy?23:12;
    if(t<.32){
      const r=heavy?6:4;
      star(x,y-1,r+2,"#583c42");star(x,y-2,r,"#ffefd0");
    }
    const reach=reduced?.matches?spread*.5:3+spread*t;
    for(const side of [-1,1]){
      const edge=x+side*reach,lift=reduced?.matches?3:Math.sin(t*Math.PI)*8;
      box(ctx,edge-2,y-2,heavy?6:3,2,effect.color);
      box(ctx,edge-side*4,y-3-lift,heavy?3:2,2,t<.65?"#fff0cc":effect.color);
      if(heavy)box(ctx,edge-side*9,y-4-lift*.6,3,2,"#a98267");
    }
  }
  function drop(e,viewLeft=0){
    const item=e.item,rank=item.rank,t=e.age/e.life,quiet=reduced?.matches;
    const x=Math.round(e.x*SCALE),ground=Math.round(FLOOR-e.y*SCALE);
    // Let the contact silhouette read before the nameplate and miniature rise.
    const reveal=e.age-.105;
    if(reveal<0){box(ctx,x-2,ground-1,5,1,e.color);return}
    const rise=quiet?1:Math.min(1,reveal/.16);
    const h=Math.round([6,9,24,38,51][rank]*rise);
    const apex=ground-h,crest=rank===4?"#fff3bd":"#fff0d0";
    ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*8);
    if(rank>=2){
      // Stepped edges stay crisp against both pale moonlight and dark masonry.
      ctx.fillStyle=e.color;ctx.globalAlpha*=.21;
      ctx.fillRect(x-(rank+1),apex+6,rank*2+3,Math.max(1,h-6));
      ctx.globalAlpha=Math.min(1,(1-t)*8);
      box(ctx,x-1,apex,3,h,e.color);box(ctx,x,apex+2,1,Math.max(1,h-2),crest);
      if(rank>=3){
        for(const side of [-1,1]){
          box(ctx,x+side*5,apex+10,1,Math.max(1,h-13),e.color);
          box(ctx,x+side*7,apex+7,2,4,e.color);
        }
        star(x,apex,rank===4?5:3,crest);
      }
      if(rank===4){
        for(const side of [-1,1]){
          box(ctx,x+side*8-1,apex-3,3,2,e.color);
          box(ctx,x+side*6-1,apex,3,2,crest);
          box(ctx,x+side*4-1,apex+3,3,2,e.color);
        }
        box(ctx,x-11,ground-1,23,1,e.color);
      }
      const phase=quiet?0:Math.floor(e.age*8);
      for(let j=0;j<rank;j++){
        const py=ground-4-(j*9+phase*2)%Math.max(1,h);
        box(ctx,x+(j%2?1:-1)*(7+j*2),py,j===rank-1?2:1,2,e.color);
      }
    }else{
      box(ctx,x,apex,1,h,e.color);star(x,apex,rank+1,e.color);
    }
    const jump=quiet?0:Math.round(Math.sin(Math.min(1,reveal/.48)*Math.PI)*12);
    ctx.textAlign="center";ctx.font="bold 8px SimSun,monospace";
    if(picturedItem!==item){
      picturedItem=item;captionWidth=Math.min(W-8,Math.ceil(ctx.measureText(e.txt).width)+12);
      if(rank>=2){miniature??=document.createElement("canvas");EchoIcon.draw(miniature,item)}
    }
    if(rank>=2){
      const size=rank===4?18:14;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(miniature,x-Math.floor(size/2),ground-size-jump,size,size);
    }else{box(ctx,x-2,ground-jump-3,5,3,e.color);box(ctx,x-1,ground-jump-4,2,2,crest)}
    const cx=Math.max(viewLeft+captionWidth/2+2,Math.min(viewLeft+W-captionWidth/2-2,x));
    const top=Math.max(1,Math.min(ground-20-jump,apex-(rank===4?8:4))-12);
    box(ctx,cx-captionWidth/2,top,captionWidth,12,"#1b1723");
    box(ctx,cx-captionWidth/2,top+11,captionWidth,1,e.color);
    if(rank>=3){box(ctx,cx-captionWidth/2,top,2,10,e.color);box(ctx,cx+captionWidth/2-2,top,2,10,e.color)}
    ctx.fillStyle=rank===4?crest:e.color;ctx.fillText(e.txt,cx,top+9,captionWidth-6);
    ctx.restore();
  }
  return {drop,strike};
})();
