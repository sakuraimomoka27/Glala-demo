"use strict";
const screenCanvas=document.querySelector("#scene"),ctx=screenCanvas.getContext("2d");
const W=576,H=196,FLOOR=165,SCALE=29;
let seed=418;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h))}
function poly(c,points,color){ // Fill on the logical pixel grid.
 const low=Math.min(...points.map(p=>p[1])),high=Math.max(...points.map(p=>p[1]));
 for(let y=low;y<high;y++){const hits=[];for(let i=0;i<points.length;i++){let [x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];if((y1<=y&&y<y2)||(y2<=y&&y<y1))hits.push(x1+(y-y1)*(x2-x1)/(y2-y1))}
 hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)box(c,Math.ceil(hits[i]),y,Math.ceil(hits[i+1])-Math.ceil(hits[i]),1,color)}
}
function disk(c,x,y,r,color){for(let j=-r;j<=r;j++){let span=Math.floor(Math.sqrt(r*r-j*j));box(c,x-span,y+j,span*2+1,1,color)}}
const backdrop=document.createElement("canvas");backdrop.width=W;backdrop.height=H;
function scenery(){
 const c=backdrop.getContext("2d");
 for(let y=0;y<H;y++)box(c,0,y,W,1,'rgb('+[22+y*.16,24+y*.22,42+y*.22].map(Math.floor).join(',')+')');
 for(let i=0;i<145;i++)box(c,random()*W,random()*92,1,1,random()<.2?"#c3bbc9":"#68667b");
 disk(c,380,40,30,"#535468");disk(c,380,40,27,"#c3bcb7");disk(c,380,40,25,"#dad0ba");
 for(let i=0;i<32;i++){let x=random()*44-22,y=random()*44-22;if(x*x+y*y<440)box(c,380+x,40+y,random()*4+1,2,"#c8c0b3")}
 for(let i=0;i<37;i++)box(c,random()*W,random()*81+8,random()*38+10,2,"#474759");
 for(let layer=0;layer<2;layer++){let pts=[[0,155],[0,85]];for(let x=0;x<=W+14;x+=14)pts.push([x,68+layer*22+Math.floor(random()*28)]);pts.push([W,158]);poly(c,pts,layer?"#303547":"#434659")}
 for(let i=0;i<29;i++){let x=i*21+random()*8,y=69+random()*41,w=10+random()*12;box(c,x,y,w,89,"#292e40");poly(c,[[x-2,y],[x+w/2,y-8-random()*20],[x+w+2,y]],"#292e40");box(c,x+w/2,y+8,2,5,i%5?"#535061":"#ca9866")}
 const stone=["#383a49","#424454","#454756","#333645","#4a4b59"];
 function brickwall(x,y,w,h){box(c,x,y,w,h,"#202430");for(let j=0;j<h;j+=7){for(let i=-17*((j/7)%2);i<w;i+=34){let l=Math.max(0,i),r=Math.min(w,i+33);if(r<=l)continue;let col=stone[Math.floor(random()*stone.length)];box(c,x+l,y+j,r-l,6,col);box(c,x+l,y+j,Math.min(9,r-l),1,"#555563")}}}
 function pier(x,y,width){brickwall(x,y,width,FLOOR-y);box(c,x+width-4,y,4,FLOOR-y,"#292936");for(let yy=y+13;yy<FLOOR;yy+=42){box(c,x-3,yy,width+6,5,"#555463");box(c,x-2,yy+4,width+4,3,"#272936")}rectBase(x,y,width)}
 function rectBase(x,y,w){box(c,x-3,FLOOR-7,w+6,7,"#464957");box(c,x-5,FLOOR-3,w+10,3,"#555660")}
 pier(2,4,27);pier(136,44,16);pier(468,37,19);pier(550,0,24);
 function arch(x,y,span){for(let i=0;i<25;i++){let t=i/24;let px=x+t*span,py=y+38*(Math.abs(t-.5)*2)**1.6;box(c,px,py,span/24+1,8,stone[i%stone.length]);box(c,px,py,span/24,2,"#60606a")}}
 arch(13,5,131);arch(475,-3,87);
 // Torn hanging standards and iron chains.
 for(let [x,y] of [[36,31],[491,25]]){box(c,x-3,y,17,2,"#b49772");poly(c,[[x,y+2],[x+12,y+2],[x+12,y+29],[x+8,y+25],[x+5,y+33],[x+2,y+29],[x,y+31]],"#734649");box(c,x+4,y+4,2,19,"#995c54");box(c,x+7,y+9,3,5,"#bb896a")}
 for(let x of [62,446,529])for(let y=0;y<49+(x%23);y+=5){box(c,x+(y%2),y,2,4,"#555360");box(c,x+1,y+2,1,2,"#20212b")}
 for(let i=0;i<105;i++){let x=random()*W,y=145+random()*19;box(c,x,y,random()*9+1,2,"#333747")}
 brickwall(0,FLOOR,W,H-FLOOR);box(c,0,FLOOR,W,2,"#a6a094");for(let x=0;x<W;x+=11){box(c,x,FLOOR+2,8,2,"#686575");box(c,x,FLOOR+5,6,1,"#232331")}
}
scenery();
const hero=["........kk..........",".......kppk.........",".......kpvvk........","......kppvvk........",".....kppvpvvk.......","....kppppppvvk......","...kkggggggggkk.....",".kkvvvvvvvvvvvvkk...","kkppppppppppppvvvk..","....kssttffffk......","....kwsffkfFk.......","....kwstffffk.......","...kwssstttkk.......","..kwsskkggggk.......","..ksskppggppvk......","..kskpppppppvfk.....","..kkppppllppvvk.....","..kpppplgglppvk.....",".kpppppplllpppvk....","kppppppplllpppvk....",".kkkkkkkkkkkkkk.....","....kbbk..kbbk......","...kBBbk.kBBbk......","...kkkkk.kkkkk......"];
const mob=[".....kkk......","...kkhhhk.....","..khHHHHhk....",".khHHhHHhhk...",".khhhhhhHHhk..","..kfrrkkrrk...","..kfffffffk...","...kfkkffk....",".kkhgggghkk...","khhhHHhhhhhkk.","khHhkggkhHhfk.","kffkkhhhkffkk.","..kkhhhHhkk...","..khHHhhhhk...","..kbbbkkbbk...","..kbbk.kbbk..."];
const bowman=["....kkk......","...kpppk.....","..kppvppk....","..kpkffffk...","..kpkffrfk...","..kkkfffkk...","...kgppgk....","..kppggppk...","..kppgpppfk..",".kpppgppkfkk.",".kppppppk....","kpppkppppk...","..kbbkkbbk...","..kbbk.kbk..."];
const pal={k:"#161622",p:"#594468",v:"#937594",g:"#d8a357",s:"#b2a5b7",w:"#ece1d7",t:"#bd9789",f:"#f3c8a3",F:"#ffe1b7",l:"#383146",b:"#4b3747",B:"#bc915f",h:"#586572",H:"#94a2aa",r:"#ff775c"};
function sprite(c,rows,x,y,scale=1,flip=false,palette=pal){rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(palette[ch])box(c,x+(flip?row.length-1-i:i)*scale,y+j*scale,scale,scale,palette[ch])}))}
function boot(c,heavy){let rows=["....kkkkkkkk....","....kHHHHHhk....","....kggggggk....","....kbbbbbBk....","....kHHHHHhk....","....khhHHhhk....","....kHHHHHhk....","....khhhHHhkk...","....khhgggghhk..","...kHHHhhHHHHhk.","...kHHhhhhhHHHhk","...kgggggggggggk","...kkkkkkkkkkkkk"];sprite(c,rows,5,8,1,false,{...pal,H:heavy?"#9d9eab":"#b39986",h:heavy?"#5b5a6b":"#865f54",g:heavy?"#bf9b64":"#e6b66a"})}

