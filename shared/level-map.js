globalThis.LevelMap = (() => {
  "use strict";
  const palette = {
    rock:  {label:"岩岸",group:"地形",width:5},
    plinth:{label:"街道基座",group:"地形",width:4},
    court: {label:"石砌桥面",group:"地形",width:4},
    truss: {label:"木栈桥",group:"地形",width:3},
    pier:  {label:"石柱",group:"地形",width:1.6},
    arch:  {label:"双拱桥",group:"地形",width:3.5},
    hoist: {label:"绞盘",group:"景物"},
    awning:{label:"街边棚亭",group:"景物"},
    start: {label:"格拉拉 · 起点",group:"角色与目标"},
    guard: {label:"戈仑",group:"角色与目标",enemy:"trial_guard"},
    infantry:{label:"帝国近战兵",group:"角色与目标",enemy:"sentry"},
    elite:{label:"帝国精英",group:"角色与目标",enemy:"forgeguard"},
    hound:{label:"仿生猎犬",group:"角色与目标",enemy:"shade"},
    watcher:{label:"警戒机关",group:"机关"},
    bow:   {label:"无名的射手",group:"角色与目标",enemy:"archer"},
    boss:  {label:"普罗米修斯",group:"角色与目标",enemy:"fire_keeper"},
    exit:  {label:"终点山门",group:"角色与目标"}
  };
  const backgrounds={cliff:"峡谷岩壁",canal:"水神都市郊区",street:"克罗索斯街巷"};
  const roles={background:null,solid:"rock",platform:"truss",prop:"hoist"};
  const draftKey="ashen:level-workshop:draft:1",appliedKey="ashen:level-workshop:ember_pass:1";
  function slotKey(chapter,room){
    return chapter==="belfry"&&room==="ember_pass"?appliedKey:"ashen:level-workshop:slot:"+chapter+"/"+room;
  }
  const terrain=o=>Object.hasOwn(palette,o.type)&&!!palette[o.type].width;
  function support(objects,x,y){
    return objects.find(o=>terrain(o)&&Math.abs(o.y-y)<.015&&x>=o.x&&x<=o.x+o.w);
  }
  function validate(m,play=true){
    const fail=s=>{throw Error(s)};
    if(!m||m.version!==1||typeof m.name!=="string"||!m.name.trim()||m.name.length>60)fail("地图名称或文件版本无效。");
    const assets=m.assets??[];
    if(!Array.isArray(assets)||assets.length>40)fail("地图素材库最多容纳 40 张 PNG。");
    const ids=new Map();let bytes=0;
    for(const a of assets){
      if(!a||typeof a.id!=="string"||!/^img-[a-z0-9-]{1,48}$/.test(a.id)||ids.has(a.id)||typeof a.name!=="string"||a.name.length>48||
        !Object.hasOwn(roles,a.role)||!Number.isFinite(a.metres)||a.metres<.5||a.metres>24||
        typeof a.png!=="string"||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]+$/.test(a.png))fail("地图中包含无效的 PNG 素材。");
      bytes+=a.png.length;ids.set(a.id,a);
    }
    if(bytes>3_100_000)fail("地图内的 PNG 总量过大，请先缩小素材后再导入。");
    if(!Object.hasOwn(backgrounds,m.background)&&ids.get(m.background)?.role!=="background")fail("地图引用的底图不存在。");
    if(!Number.isFinite(m.width)||m.width<20||m.width>1200)fail("地图长度须在 20 至 1200 米之间。");
    if(!Number.isFinite(m.loopEnd)||m.loopEnd<0||m.loopEnd>m.width||(m.loopEnd>0&&m.loopEnd<20))fail("循环接点须为 0，或位于地图内且至少距起点 20 米。");
    if(!Array.isArray(m.objects)||m.objects.length>1000)fail("单张地图最多可放置 1000 个元件。");
    for(const o of m.objects){
      if(!o||!Object.hasOwn(palette,o.type)||!Number.isFinite(o.x)||!Number.isFinite(o.y)||o.x<0||o.x>m.width||o.y<0||o.y>8)fail("元件种类或位置超出地图范围。");
      if(o.skin&&(!ids.has(o.skin)||roles[ids.get(o.skin).role]!==o.type))fail("元件引用的素材或碰撞类型无效。");
      if(terrain(o)&&(!Number.isFinite(o.w)||o.w<.5||o.x+o.w>m.width+.001))fail("地形宽度至少为 0.5 米，右端须在地图内。");
    }
    if(!play)return m;
    for(const t of ["start","exit"])if(m.objects.filter(o=>o.type===t).length!==1)fail("地图须各有一个起点和终点。");
    if(m.objects.filter(o=>o.type==="boss").length>1)fail("一间战场可放置一台普罗米修斯。");
    for(const o of m.objects.filter(o=>palette[o.type].enemy||o.type==="watcher"||o.type==="start"||o.type==="exit")){
      const name=palette[o.type].label,base=support(m.objects,o.x,o.y);
      if(!base||o.x<.55||o.x>m.width-.55)fail(name+" 需要落在可站立的地形上，且距地图边缘至少 0.55 米。");
      if(m.objects.some(s=>["rock","plinth"].includes(s.type)&&s.y>o.y+.015&&o.x>s.x&&o.x<s.x+s.w))fail(name+" 被上方的实体地形挡住了。");
      if(o.type==="boss"&&(o.y!==0||o.x-base.x<4.5||base.x+base.w-o.x<4.1))fail("机甲需要左右各约 4.5 米的平地。");
    }
    if(m.loopEnd){
      if(!support(m.objects,.1,0)||!support(m.objects,m.loopEnd-.1,0))fail("循环起点和接点前都需要零高度的地面。");
      if(m.objects.some(o=>o.type==="boss"&&o.x<m.loopEnd))fail("请将机甲放在循环接点之后，或将接点设为 0。");
      if(m.objects.find(o=>o.type==="start").x>=m.loopEnd)fail("起点需要放在循环段内。");
    }
    return m;
  }
  function compile(m,loop=false){
    validate(m);
    if(loop&&!m.loopEnd)throw Error("这张地图尚未设置循环接点。");
    const width=loop?m.loopEnd:m.width;
    const objects=m.objects.filter(o=>o.x<width);
    const surfaces=objects.filter(terrain).map(o=>({art:o.type,skin:o.skin,left:o.x,right:Math.min(width,o.x+o.w),y:o.y}));
    const grounded=o=>({...o,y:support(m.objects,o.x,o.y).y});
    const start=grounded(m.objects.find(o=>o.type==="start")),goal=grounded(m.objects.find(o=>o.type==="exit"));
    const foes=objects.filter(o=>palette[o.type].enemy).map(grounded);
    const door={scene:"gorge",authored:true,assets:m.assets,background:m.background,width,arenaStart:m.loopEnd||width,
      start,x:goal.x,y:goal.y,decks:surfaces.filter(o=>!o.y),platforms:surfaces.filter(o=>o.y).sort((a,b)=>b.y-a.y),
      decorations:objects.filter(o=>palette[o.type].group==="景物"),hazards:objects.filter(o=>o.type==="watcher").map(grounded),actors:foes,hoists:[],route:[]};
    return {door,count:foes.length,formation:foes.map(o=>palette[o.type].enemy).join(","),positions:foes.map(o=>o.x).join(",")};
  }
  function blank(){return {version:1,name:"新关卡",width:30,background:"cliff",loopEnd:0,objects:[
    {type:"rock",x:0,y:0,w:30},{type:"start",x:2,y:0},{type:"exit",x:27,y:0}]};}
  async function shipped(){
    const response=await fetch("content/maps/ember_pass.json",{cache:"no-store"});
    if(!response.ok)throw Error("无法读取峡谷地图文件。");
    return validate(await response.json());
  }
  function saved(key,play){const raw=localStorage.getItem(key);return raw?validate(JSON.parse(raw),play):null}
  return {palette,backgrounds,roles,terrain,support,validate,compile,blank,shipped,saved,draftKey,appliedKey,slotKey};
})();
