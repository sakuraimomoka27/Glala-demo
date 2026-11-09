globalThis.WorldView=(()=>{
  const {el,button}=UI;
  const numerals=["一","二","三","四","五"];
  const chapterName=i=>"第"+(numerals[i]||String(i+1))+"章";
  function small(text){return el("small",text,"eyebrow")}
  function portrait(role){const c=el("canvas",undefined,"glala-portrait");GlalaArt.draw(c,role,"portrait");return c}
  function title(root,go){
    const head=el("div",undefined,"screen-head");head.append(small("提塔尔耶拉　／　探求者导报"),el("h1","格拉拉的探求手记"),el("p","一切故事都从那次圣灵夜开始……"));
    const cover=el("canvas",undefined,"title-art");MenuArt.draw(cover,"title");
    const actions=el("div",undefined,"actions");
    actions.append(button(Profile.slots.some(Boolean)?"继续游戏":"开始游戏",go,"primary"));
    actions.append(button("行会演武",()=>location.assign("./?trial=1&foe=infantry")));
    actions.append(button("关卡编辑器",()=>location.assign("level-editor.html")));
    root.replaceChildren(head,cover,actions);
    if(Profile.problem)root.append(el("p",Profile.problem));
  }
  function slots(root,catalog,choose,back){
    const grid=el("div",undefined,"choices save-grid");
    Profile.slots.forEach((slot,i)=>{
      const card=button("",()=>choose(i),"choice");
      card.append(small("存档 "+String(i+1).padStart(2,"0")));
      if(slot){
        const role=catalog.characters.find(c=>c.id===slot.role);
        if(role)card.append(portrait(role));
        card.append(el("h3",slot.name),el("p",(role?.name||"格拉拉")+" · 已通 "+(slot.data.heroes[slot.role]?.chapter||0)+" 章"));
      }else{
        const seal=el("div",undefined,"empty-slot"),lantern=el("canvas");
        MenuArt.draw(lantern,"lantern");lantern.setAttribute("aria-hidden","true");seal.append(lantern);
        card.append(seal,el("h3","空存档"),el("p","创建一名格拉拉"));
      }
      grid.append(card);
    });
    root.replaceChildren(button("‹ 标题",back),el("h1","选择存档"),grid);
  }
  function create(root,catalog,i,done,back){
    const character=catalog.characters.find(row=>row.id==="glala");
    if(!character){
      root.replaceChildren(button("‹ 返回",back),el("p","格拉拉的角色配置未载入。"));
      return;
    }
    const picture=portrait(character);
    const step=el("form",undefined,"name-step"),message=el("p");
    const input=el("input");input.maxLength=24;input.required=true;input.autocomplete="off";input.placeholder="1～12 个字";
    const label=el("label","角色名 ");label.append(input);
    const submit=el("button","创建角色","primary");submit.type="submit";
    step.onsubmit=e=>{
      e.preventDefault();
      try{Profile.create(i,character.id,input.value);done(character)}catch(err){message.textContent=err.message}
    };
    message.setAttribute("role","status");
    step.append(label,submit,message);
    root.replaceChildren(button("‹ 返回",back),small("存档 "+(i+1)),el("h1","创建角色"),picture,el("h2",character.name),step);
    input.focus();
  }
  function atlas(root,catalog,ci,actions,readOnly=false){
    const chapters=catalog.chapters,hero=Profile.hero,chapter=chapters[ci];
    const ids=WorldCampaign.rooms(chapter),cleared=WorldCampaign.cleared(hero,chapters,ci);
    const regions=chapters.map((row,i)=>({...row,locked:!WorldCampaign.allowed(hero,chapters,i,0)}));
    const stages=ids.map((id,i)=>({
      level:catalog.levels.find(level=>level.id===id),locked:!WorldCampaign.allowed(hero,chapters,ci,i),cleared:i<cleared
    }));
    const number=i=>(ci+1)+"-"+(i+1);
    const condition=i=>{
      if(regions[ci].locked && ci>0)return "先通过 "+ci+"-"+WorldCampaign.rooms(chapters[ci-1]).length+"，开放"+chapterName(ci)+"。";
      return "先通过 "+number(Math.max(0,i-1))+"，再从出口进入本关。";
    };
    function encounter(stage){
      const level=stage.level,monsters=new Set([level.front,level.rear,...(level.formation||"").split(/[,，]/).map(id=>id.trim())]);
      const boss=catalog.summons?.find(s=>monsters.has(s.boss));
      if(boss)return "守关虚数体 · "+boss.name;
      const source=catalog.equipment?.find(item=>item.sourceMonster && monsters.has(item.sourceMonster));
      if(source)return "怪物掉落 · "+(source.echoName||source.name);
      const focus=catalog.equipment?.find(item=>level.focusSlot && item.slot===level.focusSlot && item.dropWeight>0);
      if(focus)return "掉落倾向 · "+(focus.echoName||focus.name)+"等";
      return "驻守 · "+level.count+" 名敌人";
    }

    const screen=el("section",undefined,"expedition-atlas"),head=el("div",undefined,"atlas-head"),titles=el("div");
    titles.append(small("提塔尔耶拉　／　阿莱西亚大沙海"),el("h1",readOnly?"查阅远征地图":"远征地图"));
    head.append(titles);
    if(!readOnly&&actions.changeWorld){
      const world=WorldDifficulty.current(catalog,hero);
      const picker=el("div",undefined,"world-picker"),label=el("label","遗迹潮位"),select=el("select",undefined,"world-select");
      select.setAttribute("aria-label","遗迹潮位");
      for(const row of catalog.worlds){
        const reason=WorldDifficulty.lockedReason(catalog,hero,row);
        const option=el("option",row.level+" · "+row.name+(reason?"　｜　"+reason:""));
        option.value=row.level;option.disabled=!!reason;select.append(option);
      }
      select.value=world.level;select.disabled=!!hero.run;
      const rates=world.level>=4?"　·　源铸 "+(100*ItemStrength.chanceAtLeast(world,660)).toFixed(1)+"%":"";
      const status=el("span",hero.run?"秘境结束后可调整":"强度 "+world.minPower+"～"+world.maxPower+rates+"　·　敌人生命 ×"+world.hpScale+"　攻击 ×"+world.damageScale);
      status.setAttribute("role","status");
      select.onchange=()=>{
        try{actions.changeWorld(Number(select.value))}catch(error){select.value=world.level;status.textContent=error.message}
      };
      label.append(select);picker.append(label,status);head.append(picker);
    }
    if(actions.town && !readOnly)head.append(button("进入城镇",actions.town,"primary"));
    const body=el("div",undefined,"atlas-spread"),map=el("div",undefined,"atlas-art atlas-plate"),art=el("canvas");
    art.setAttribute("aria-hidden","true");
    const layout=WorldArt.map(art,regions,ci,stages);
    map.append(art);
    const regionKeys=el("nav",undefined,"atlas-hit-layer"),roomKeys=el("nav",undefined,"atlas-hit-layer");
    regionKeys.setAttribute("aria-label","选择章节地标");roomKeys.setAttribute("aria-label",readOnly?"查看本章关卡":"本章关卡");
    map.append(regionKeys,roomKeys);
    function place(btn,point){
      btn.style.left=(point.x/layout.width*100)+"%";
      btn.style.top=(point.y/layout.height*100)+"%";
    }
    function cycle(nav){
      nav.onkeydown=e=>{
        const controls=Array.from(nav.children),index=controls.indexOf(e.target);
        if(index<0)return;
        const offset={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
        if(offset===undefined && e.key!=="Home" && e.key!=="End")return;
        e.preventDefault();
        const target=e.key==="Home"?0:e.key==="End"?controls.length-1:(index+offset+controls.length)%controls.length;
        controls[target].focus();
      };
    }
    cycle(regionKeys);cycle(roomKeys);
    regions.forEach((region,i)=>{
      const key=button("",()=>{
        if(i===ci)return;
        actions.select(i);
        root.querySelector('[data-atlas-chapter="'+i+'"]')?.focus({preventScroll:true});
      },"atlas-hotspot atlas-landmark");
      key.dataset.atlasChapter=i;
      key.dataset.current=String(i===ci);
      key.dataset.locked=String(region.locked);
      key.setAttribute("aria-pressed",String(i===ci));
      key.setAttribute("aria-label",chapterName(i)+"　"+region.name+(region.locked?"　尚未开放，可查阅":""));
      key.append(el("span",chapterName(i),"atlas-plaque"));
      place(key,layout.landmarks[i]);regionKeys.append(key);
    });

    const side=el("aside",undefined,"atlas-folio"),regionCopy=el("section",undefined,"atlas-region-copy");
    regionCopy.append(small(chapterName(ci)),el("h2",chapter.name),el("p",chapter.description));
    const progress=el("span",cleared+" / "+stages.length+" 已通关","atlas-progress");
    regionCopy.append(progress);
    const detail=el("section",undefined,"atlas-room-detail"),detailState=small(""),detailName=el("h3"),detailInfo=el("p"),detailHint=el("p",undefined,"atlas-hint");
    detail.append(detailState,detailName,detailInfo,detailHint);
    detail.setAttribute("aria-live","polite");
    side.append(regionCopy,detail);
    let selected=-1;
    function inspect(i){
      selected=i;
      const stage=stages[i],status=stage.locked?"未开放":stage.cleared?"已通关":"当前进度";
      detail.dataset.status=stage.locked?"locked":stage.cleared?"cleared":"frontier";
      detailState.textContent=number(i)+"　／　"+status;
      detailName.textContent=stage.level.name;
      detailInfo.textContent=encounter(stage);
      detailHint.textContent=stage.locked?condition(i):readOnly?"正在查阅地图。返回远征地图后可从此进入。":stage.cleared?"点选此节点，重游已通关的遗迹。":"点选此节点，从这里继续远征。";
      Array.from(roomKeys.children).forEach((key,index)=>{key.dataset.inspect=String(index===selected);});
    }
    stages.forEach((stage,i)=>{
      const key=button("",()=>{
        inspect(i);
        if(!readOnly && WorldCampaign.allowed(hero,chapters,ci,i))actions.enter(ci,i);
      },"atlas-hotspot atlas-stage");
      key.dataset.atlasRoom=number(i);
      if(actions.here===number(i))key.setAttribute("aria-current","location");
      key.dataset.status=stage.locked?"locked":stage.cleared?"cleared":"frontier";
      const label=el("span",undefined,"atlas-stage-caption");
      label.append(el("b",number(i)+"　"+stage.level.name),el("span",actions.here===number(i)?"◆ 所在关卡":stage.locked?"未开放":stage.cleared?"已通关":"当前进度"));
      key.append(label);
      key.setAttribute("aria-label",number(i)+" "+stage.level.name+"。"+(stage.locked?condition(i):readOnly?"查看关卡":stage.cleared?"重游此关":"进入此关"));
      key.onmouseenter=()=>inspect(i);key.onfocus=()=>inspect(i);
      place(key,layout.rooms[i]);roomKeys.append(key);
    });
    const here=stages.findIndex((_,i)=>number(i)===actions.here);
    inspect(here>=0?here:Math.min(cleared,stages.length-1));
    body.append(map,side);screen.append(head,body);
    root.replaceChildren(screen);
    if(Profile.problem)root.append(el("p",Profile.problem));
  }
  function withdrawal(root,room,actions){
    const screen=el("article",undefined,"retreat-review"),heading=el("header"),story=el("div");
    story.append(small("探求者手记　／　归途"),el("h1","撤离本关？"),el("b",room.number+"　"+room.stage));
    heading.append(portrait(null),story);screen.append(heading);
    const kept=el("section",undefined,"retreat-earned");
    kept.append(small("已记入角色"),el("b","经验 +"+room.xp+"　·　尼奥德 +"+room.gold),
      el("span","本关击败 "+room.kills+" / "+room.total+" 名守卫。此前过门的收获也会保留。"));
    const pending=el("section",undefined,"retreat-pending");
    const copy=el("div");
    copy.append(small("尚未带出"),el("b","回响 "+room.count+" 枚"+(room.summons.length?"　·　虚数体 "+room.summons.join("、"):"")));
    if(room.best){
      const icon=el("canvas");EchoIcon.draw(icon,room.best);icon.setAttribute("aria-hidden","true");pending.append(icon);
      const best=el("span",room.best.tierName+" · "+room.best.name);best.style.color=room.best.color;copy.append(best);
    }
    copy.append(el("span",room.count||room.summons.length?"留在这里的掉落，撤离后不会入包。":"还没有待带出的战利品。"));
    pending.append(copy);
    const note=el("p",room.exitReady?"守卫已清除。穿过右侧拱门，即可带走掉落并通关。":"本关进度以穿过拱门为准；撤离后可从 "+room.number+" 重新出发。");
    const foot=el("footer"),stay=button("取消撤离",actions.stay,"primary"),leave=button("确认撤离",actions.leave);
    leave.dataset.confirmRetreat="";foot.append(stay,leave);screen.append(kept,pending,note,foot);root.replaceChildren(screen);
  }
  const stations=[
    {x:.17,model:"scout",color:"#a79979",name:"仓库保管员",service:"共享仓库",line:"寄放在这里的回响，你的同伴也能来领取。"},
    {x:.39,model:"knight",color:"#b18065",name:"城镇铁匠",service:"装备工坊",line:"让我看看你带回来的共鸣回响。"},
    {x:.65,model:"scout",color:"#aa8bb7",name:"遗迹探求者",service:"秘境之门",line:"钟楼重新响起后，我们就在这里开启秘境。"},
    {x:.84,model:"witch",color:"#8fa5a2",name:"行会记录员",service:"远征手记",line:"每一道归途灯，都值得记在《探求者导报》上。"}
  ];
  function town(root,character,actions,start=.5){
    let x=start,goal=null,service=null,last=0,held=0,face=1,live=true,token;
    const art=el("canvas");art.tabIndex=0;art.setAttribute("aria-label","克罗索斯横版街区，A、D 行走，E 交谈");
    const caption=el("p"),speak=button("交谈",talk),street=el("div",undefined,"town-stage"),foot=el("div",undefined,"town-status");
    const layout=WorldArt.townLayout;
    art.width=layout.width;art.height=layout.height;
    street.append(art);
    const nearest=()=>stations.reduce((a,b)=>Math.abs(x-a.x)<Math.abs(x-b.x)?a:b);
    function talk(){const s=nearest();if(Math.abs(x-s.x)<.055)actions.visit(s,x)}
    function walkTo(place,station=null){
      if(!live || document.querySelector("#game-panel[open]"))return;
      goal=place;service=station;held=0;art.focus();
    }
    for(const station of stations){
      const marker=button("",()=>walkTo(station.x,station),"town-marker");
      marker.setAttribute("aria-label",station.name+"，"+station.service);
      marker.style.left=Math.round(station.x*layout.width)/layout.width*100+"%";
      marker.style.top=layout.npcBaseline/layout.height*100+"%";
      marker.append(el("span",station.service));street.append(marker);
    }
    art.onclick=event=>{
      const bounds=art.getBoundingClientRect();
      walkTo(Math.max(.03,Math.min(.97,(event.clientX-bounds.left)/bounds.width)));
    };
    const header=el("div",undefined,"atlas-head"),title=el("div");title.append(small("阿莱西亚大沙海　/　水神都市"),el("h1","克罗索斯"));
    header.append(title,button("返回大地图",actions.map));
    foot.append(caption,speak);
    root.replaceChildren(header,street,foot,el("p","点人物前往交谈，点街道行走。键盘 A / D 移动，E 交谈。","town-hint"));
    art.className="town-art";art.focus();
    function key(e,down){
      if(!live || !root.contains(art) || document.querySelector("#game-panel[open]"))return;
      const direction=["KeyA","ArrowLeft"].includes(e.code)?-1:["KeyD","ArrowRight"].includes(e.code)?1:0;
      if(direction){e.preventDefault();if(down){goal=null;service=null;held=direction}else if(held===direction)held=0}
      if(down && e.code==="KeyE"&&!e.repeat)talk();
    }
    const kd=e=>key(e,true),ku=e=>key(e,false),blur=()=>{held=0};
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);window.addEventListener("blur",blur);
    function stop(){live=false;cancelAnimationFrame(token);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);window.removeEventListener("blur",blur)}
    function frame(now){
      if(!live||!art.isConnected){stop();return}
      const dt=Math.min(.05,(now-last)/1000||0),previousX=x;last=now;
      if(!document.querySelector("#game-panel[open]")){
        if(goal!==null){
          const delta=goal-x;
          if(Math.abs(delta)<dt*.33){x=goal;goal=null;const s=service;service=null;if(s)actions.visit(s,x)}
          else x+=Math.sign(delta)*dt*.33;
        }else x=Math.max(.03,Math.min(.97,x+held*dt*.33));
      }else held=0;
      const moving=x!==previousX;
      if(moving)face=x<previousX?-1:1;
      WorldArt.town(art,x,character,now/1000,{face,moving},stations);
      const s=nearest(),close=Math.abs(x-s.x)<.055;
      const text=service?"前往"+service.service+"　·　"+service.name:close?s.name+"　「"+s.line+"」":"沿街寻找需要的服务。";
      if(caption.textContent!==text)caption.textContent=text;speak.disabled=!close;
      token=requestAnimationFrame(frame);
    }
    token=requestAnimationFrame(frame);
    return stop;
  }
  function journal(root,catalog,back){
    const hero=Profile.hero;
    root.replaceChildren(button("‹ 返回",back),small("艾尼亚德　/　探求者导报"),el("h1","探求手记"),
      el("h2","圣灵夜的启示"),el("p","它得到了启示，终于踏上了勇者之路……红月节过后，记录里还留着半句话：「勇者……不止一个」。"),
      el("h2","提塔尔耶拉"),el("p","大陆“提塔尔耶拉”是一片神代文明与现代文明交融的土地，神代文明留下的遗迹中藏有诸多珍贵的遗产。"),el("h3","阿莱西亚大沙海"),el("p","阿莱西亚大沙海地势错综复杂，没人知道前方会有什么危险与机遇……水神都市克罗索斯就坐落在沙海的峡谷里。"),
      el("h2","旅行见闻"),el("p","格拉拉踮起脚，小爪子还是够不到宝箱的搭扣。它退后两步，一跃就上了箱盖。后来过断桥时，它也这么干：借守卫的肩头一蹬，落到桥的另一边。"),el("h2","寻伴委托 · 五盏归途灯"),el("p","《探求者导报》登出寻伴委托。几只给遗迹运送塞拉斯的格拉拉没有回来，最后的爪印消失在旧钟楼。"));
    root.append(UI.echoGuide(catalog));
    catalog.chapters.forEach((chapter,i)=>{
      const n=WorldCampaign.cleared(hero,catalog.chapters,i);
      if(WorldCampaign.allowed(hero,catalog.chapters,i,0))root.append(el("h3",chapterName(i)+" · "+chapter.name),el("p",n===WorldCampaign.rooms(chapter).length?chapter.ending:chapter.description));
    });
  }
  return {title,slots,create,atlas,town,journal,withdrawal};
})();
