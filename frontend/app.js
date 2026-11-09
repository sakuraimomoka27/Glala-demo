(async()=>{
  const {el,button}=UI, $=id=>document.getElementById(id);
  const lobby=$("lobby"),battle=$("battle"),dock=$("game-dock"),panel=$("game-panel"),body=$("panel-body");
  let catalog,character,chapterIndex=0,scene="title",stopTown,resumeBattle=null,training=false;
  const panels=GamePanelNavigation(panel,body,{
    enter:()=>{resumeBattle=Room.running?Room.lockPanel():null},leave:releasePanel
  });
  const {close,open:popup}=panels;
  const riftClock=RiftClock({
    labels:[$("hud-rift-clock"),$("panel-rift-clock")],
    getRun:()=>!training && ["map","town","fight","rift-report","report"].includes(scene)?Profile.hero?.run:null,
    expire:run=>{
      if(scene==="fight" && Room.running)Room.settle();
      else JourneyView.expire(run,catalog,riftControls());
    }
  });
  const orb=(name,kind)=>{
    const node=el("div",undefined,"orb "+kind),sphere=el("i"),label=el("b");
    node.append(sphere,el("span",name),label);return {node,sphere,label};
  };
  const life=orb("生命","life-orb"),energy=orb("体力","energy-orb");
  const reduceMotion=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  const menu=el("nav",undefined,"dock-menu");
  const progress=el("div",undefined,"character-progress"),levelLabel=el("small"),xpBar=el("progress");
  xpBar.setAttribute("aria-label","角色经验");progress.append(levelLabel,xpBar);
  const middle=el("div",undefined,"dock-center");middle.append(menu,progress);
  const shortcuts={KeyI:sheet,KeyM:inspectMap,KeyJ:journal};
  for(const [label,key,screen] of [["角色","I",sheet],["地图","M",inspectMap],["手记","J",journal]]){
    const control=button("",()=>togglePanel(screen));
    control.append(el("kbd",key),el("span",label));control.setAttribute("aria-label",label);
    menu.append(control);
  }
  dock.append(life.node,middle,energy.node);
  window.addEventListener("keydown",event=>{
    const screen=shortcuts[event.code];
    if(!screen || dock.hidden || training || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented)return;
    if(event.target.closest?.("input,textarea,select,[contenteditable=true]"))return;
    event.preventDefault();togglePanel(screen);
  });
  function togglePanel(screen){
    if(panel.open && panels.current===screen){close();return}
    if(screen===inspectMap && scene==="map"){close();lobby.querySelector(".atlas-landmark[data-current='true']")?.focus();return}
    popup(screen);
  }
  function showProgress(status){
    progress.hidden=training||!status;
    if(progress.hidden)return;
    levelLabel.textContent="等级 "+status.level+"　"+(status.capped?"已满级":status.xp+" / "+status.needed+" 经验");
    xpBar.max=status.capped?1:status.needed;xpBar.value=status.capped?1:status.xp;
  }
  function vitals(hp,maxHp,stamina,maxStamina){
    for(const [orb,current,max] of [[life,hp,maxHp],[energy,stamina,maxStamina]]){
      const value=Math.max(0,Math.min(max,Math.ceil(current)));
      const display=value+" / "+max;
      if(orb.label.textContent!==display){
        if(scene==="fight" && orb.value-value>=(orb===life?1:4) && !reduceMotion?.matches){
          orb.pulse?.cancel();
          orb.pulse=orb.sphere.animate?.([{filter:"brightness(1.65)"},{filter:"brightness(1)"}],{duration:190,easing:"steps(4,end)"});
        }
        orb.label.textContent=display;orb.sphere.style.setProperty("--fill",Math.round(value/max*100)+"%");
      }
      orb.value=value;
    }
  }
  function outfit(){return Loadout.resolve(catalog,character,null,true)}
  function resting(){
    if(!character)return;
    const stats=outfit(),maxHp=stats.maxHp??character.hp,stamina=stats.staminaMax??character.stamina??100;
    const hp=scene==="rift-report"?(Profile.hero.run?.hp??maxHp):maxHp;
    vitals(Math.min(hp,maxHp),maxHp,stamina,stamina);
    showProgress(Growth.status(Profile.hero,catalog));
  }
  function releasePanel(){
    if(resumeBattle!==null && Room.running)Room.closePanel(resumeBattle);
    resumeBattle=null;
    if(["map","town","report","rift-report"].includes(scene))resting();
    if(scene==="report")lobby.firstElementChild?.dispatchEvent(new Event("game-reveal"));
  }
  $("close-panel").onclick=close;
  function view(next){
    close();if(stopTown){stopTown();stopTown=null}
    scene=next;life.value=energy.value=undefined;battle.hidden=next!=="fight";lobby.hidden=!battle.hidden;
    dock.hidden=!["map","town","fight","report","rift-report","defeat"].includes(next)||(training&&next!=="fight");
    menu.hidden=training;progress.hidden=training;
    if(next!=="fight")Room.stop();
    if(!dock.hidden&&next!=="fight"&&next!=="defeat")resting();
    riftClock.sync();
  }
  function home(){training=false;Profile.clearPreviousGeneration();view("title");WorldView.title(lobby,slots)}
  function slots(){view("slots");WorldView.slots(lobby,catalog,i=>{
    if(Profile.slots[i]){
      Profile.openSlot(i);character=catalog.characters.find(c=>c.id===Profile.slot.role);
      if(!character){lobby.append(el("p","存档中的角色配置未载入。"));return}
      chapterIndex=Math.min(Profile.hero.chapter||0,catalog.chapters.length-1);atlas();
    }else{
      view("create");WorldView.create(lobby,catalog,i,role=>{character=role;chapterIndex=0;atlas()},slots);
    }
  },home)}
  function atlas(){
    Echoes.initialize(Profile,catalog);
    view("map");WorldView.atlas(lobby,catalog,chapterIndex,{select:i=>{chapterIndex=i;atlas()},enter:launch,town,
      changeWorld:level=>{WorldDifficulty.select(Profile,catalog,level);atlas();lobby.querySelector(".world-select")?.focus({preventScroll:true})}});
    const exit=el("div",undefined,"world-return");exit.append(button("返回标题",home));lobby.append(exit);
  }
  function inspectMap(root){
    let index=chapterIndex;
    const checkpoint=scene==="fight"?Room.campaignCheckpoint():null;
    const render=()=>{
      WorldView.atlas(root,catalog,index,{select:i=>{index=i;render()},here:checkpoint?.number},true);
      if(scene==="fight"){
        const foot=el("div",undefined,"field-map-actions");
        foot.append(el("span",checkpoint?"所在关卡　"+checkpoint.number+" · "+checkpoint.stage:$("stage-name").textContent));
        const leave=button(checkpoint?"撤离本关…":"前往本房结算",requestWithdrawal);
        leave.dataset.retreatRequest="";
        foot.append(button("收起地图",close,"primary"),leave);root.append(foot);
      }
      else root.append(button("前往大地图",()=>{chapterIndex=index;atlas()}));
    };
    render();
  }
  function requestWithdrawal(){
    const data=Room.campaignCheckpoint();
    if(!data){close();Room.settle();return}
    const review=root=>WorldView.withdrawal(root,data,{stay:panels.back,leave:()=>{close();Room.settle()}});
    if(panel.open)panels.push(review);else popup(review);
  }
  function journal(root){
    WorldView.journal(root,catalog,close);
    const record=Profile.hero?.lastExpedition;
    if(record)root.append(button("查看最近一次章节收获",()=>panels.push(page=>ExpeditionReportView(page,catalog,record,{
      back:panels.back,inspect:inspectReportDrop
    }))));
  }
  function inventory(root){VaultView(root,close,character.id,catalog)}
  function sheet(root){VaultView(root,close,character.id,catalog,"character")}
  function town(start=.49){
    if(typeof start!=="number")start=.49;
    view("town");stopTown=WorldView.town(lobby,character,{map:atlas,visit:station=>{
      switch(station.service){
        case "共享仓库": popup(root=>SharedStashView(root,close));break;
        case "装备工坊": popup(inventory);break;
        case "秘境之门": popup(rifts);break;
        default: popup(journal);
      }
    }},start);
  }
  function riftControls(){
    return {camp:town,root:lobby,report:()=>view("rift-report"),inspect:inspectLoadout,fight:(stage,settings,done)=>{
      const maxHp=outfit().maxHp??character.hp;
      fight(stage,{...settings,hp:Math.min(maxHp,Profile.hero.run?.hp??maxHp)},done);
    }};
  }
  function rifts(root){
    root.replaceChildren(el("h1","秘境之门"));const board=el("div");root.append(board);
    JourneyView.board(board,catalog,character,riftControls());
  }
  function fight(stage,settings,done){
    if(settings.door?.scene==="gorge"&&settings.door.authored!==true&&gorgeMap){
      const layout=LevelMap.compile(gorgeMap,settings.loopBiome==="gorge");
      settings={...settings,door:layout.door};
      stage={...stage,name:gorgeMap.name,count:layout.count,formation:layout.formation,positions:layout.positions};
    }
    view("fight");$("stage-name").textContent=stage.name;
    const world=settings.world??catalog.worlds.find(row=>row.level===settings.worldTier)??catalog.worlds[0];
    Room.open(catalog,character,stage,done,{...settings,world,hpScale:(settings.hpScale??1)*world.hpScale,
      damageScale:world.damageScale,label:settings.practice?settings.label:"潮位 "+world.level+" · "+world.name+"　／　"+settings.label,vitals,onProgress:showProgress});
  }
  function launch(ci,si,carry){
    const chapter=catalog.chapters[ci];
    let ticket;
    try{ticket=WorldCampaign.enter(Profile,catalog.chapters,ci,si)}catch(error){lobby.append(el("p",error.message));return}
    chapterIndex=ci;
    let stage=catalog.levels.find(row=>row.id===ticket.room);
    let door=WorldCampaign.exitLayout(chapter,ci,si);
    const designed=LevelMap.saved(LevelMap.slotKey(chapter.id,ticket.room),true);
    if(designed){
      const layout=LevelMap.compile(designed);
      stage={...stage,name:designed.name,count:layout.count,positions:layout.positions,formation:layout.formation};
      door=layout.door;
    }
    let report;
    const settings={door,routeNumber:(ci+1)+"-"+(si+1),label:(ci+1)+"-"+(si+1)+"　"+chapter.name+(carry?"　·　上关 +"+carry.gold+" 尼奥德，"+carry.count+" 枚回响"+(carry.finds?.length?"　获得虚数体："+carry.finds.map(id=>catalog.summons.find(s=>s.id===id)?.name||id).join("、"):""):"　·　清除守卫，穿过拱门"),
      worldTier:WorldDifficulty.current(catalog,Profile.hero).level,hp:carry?.hp,stamina:carry?.stamina,
      onResolve:outcome=>{
        if(!outcome.win)return null;
        const before=new Set(Profile.bag.items.map(item=>item.uid)),shardsBefore=Profile.bag.shards;
        const progress={chapter:Profile.hero.chapter,best:Profile.hero.best};
        ticket.recordRoom=receipt=>{
          report=ExpeditionReview.append(carry?.report,chapter.id,stage,(ci+1)+"-"+(si+1),outcome,receipt,Profile.bag,before,shardsBefore);
          if(receipt.last){
            report.unlockedWorlds=WorldDifficulty.unlocked(catalog,progress,Profile.hero);
            Profile.hero.lastExpedition=report;
          }
        };
        return WorldCampaign.through(Profile,catalog.chapters,ci,si,ticket,outcome);
      }};
    fight(stage,settings,outcome=>{
      if(outcome.settlement && !outcome.settlement.last){
        launch(ci,si+1,{hp:Math.min(outfit().maxHp??character.hp,outcome.hp+2),stamina:outcome.stamina,gold:outcome.settlement.gold,count:outcome.rewards.length,finds:outcome.settlement.summons,report});return;
      }
      if(outcome.retreated){atlas();return}
      if(outcome.settlement&&report){showChapterReport(report);return}
      view("defeat");
      CampaignDefeatView(lobby,{chapter,stage,number:settings.routeNumber,outcome,catalog,field:$("scene"),
        retry:()=>launch(ci,si),map:atlas});
    });
  }
  function inspectLoadout(uid){popup(uid?root=>VaultView(root,close,character.id,catalog,{uid}):inventory)}
  function inspectReportDrop(entry){
    const archived=panel.open;
    const show=root=>VaultView(root,archived?panels.back:close,character.id,catalog,entry);
    if(archived)panels.push(show);else popup(show);
  }
  function showChapterReport(report){
    view("report");const ci=catalog.chapters.findIndex(ch=>ch.id===report.chapterId);
    if(ci<0){atlas();return}
    chapterIndex=ci;
    ExpeditionReportView(lobby,catalog,report,{
      inspect:inspectReportDrop,
      map:atlas,town:()=>town(),replay:()=>launch(ci,0),
      next:ci+1<catalog.chapters.length?()=>{chapterIndex=ci+1;atlas()}:null
    });
  }
  let gorgeMap=null;
  let drillBoss=new URLSearchParams(location.search).get("boss")||"",drillMain=new URLSearchParams(location.search).get("titan")||"mnemosyne";
  let drillFoe=new URLSearchParams(location.search).get("foe")||"";
  function visitGorge(){
    const ci=catalog.chapters.findIndex(c=>c.id==="belfry"),chapter=catalog.chapters[ci];
    const si=chapter?WorldCampaign.rooms(chapter).indexOf("ember_pass"):-1;
    const stage=catalog.levels.find(l=>l.id==="ember_pass");
    character=catalog.characters.find(c=>c.id==="glala");
    if(si<0||!character||!stage){home();return}
    const params=new URLSearchParams(location.search),loop=params.get("loop")==="gorge",editing=params.get("scene")==="workshop";
    if(editing){
      gorgeMap=LevelMap.validate(JSON.parse(sessionStorage.getItem("ashen:level-workshop:preview")));
      const back=button("返回编辑器",()=>location.assign("level-editor.html"));
      $("leave").insertAdjacentElement("afterend",back);
    }
    const field=loop?{...stage,count:2,formation:"trial_guard,archer",positions:"5.8,9"}:stage;
    training=true;Profile.practice(character.id);
    fight(field,{practice:true,door:WorldCampaign.exitLayout(chapter,ci,si),worldTier:1,
      loopBiome:loop?"gorge":null,label:loop?"沿栈道连续巡游":editing?"关卡试走 · 穿过终点山门":"灰烬栈道 · 清除守卫，穿过山门。",onResolve:()=>null},out=>{
      view("report");lobby.replaceChildren(el("h1",out.win?"山门已开":"结束勘察"),
        el("p","击败守卫 "+out.kills+" / "+out.total),button("再走一次",()=>location.reload()),editing?button("返回编辑器",()=>location.assign("level-editor.html")):button("返回标题",home));
    });
  }
  function visitEntrance(){
    const ci=catalog.chapters.findIndex(row=>row.id==="belfry");
    const chapter=catalog.chapters[ci],stage=catalog.levels.find(row=>row.id==="courtyard");
    const si=chapter?WorldCampaign.rooms(chapter).indexOf("courtyard"):-1;
    character=catalog.characters.find(row=>row.id==="glala");
    if(!character||!stage||si<0){home();return}
    training=true;Profile.practice(character.id);
    const params=new URLSearchParams(location.search),waterLoop=params.get("loop")==="water";
    const startStreet=!waterLoop&&params.get("area")==="street";
    const label=waterLoop?"水神都市郊区 · 沿栈桥巡游":startStreet?"克罗索斯街道 · 沿街漫游":"水神都市郊区 · 越过三段水渠，清除守卫后穿过水门。";
    fight(stage,{practice:true,door:WorldCampaign.exitLayout(chapter,ci,si),worldTier:1,startStreet,
      loopBiome:waterLoop?"water":"street",label,onResolve:()=>null},out=>{
      view("report");
      lobby.replaceChildren(el("h1","结束漫游"),el("p","击败守卫 "+out.kills+" / "+out.total),
        button("再走一次",visitEntrance),button("返回标题",home));
    });
  }
  function trials(){
    training=true;
    character=catalog.characters.find(row=>row.id==="glala");
    const levels=catalog.levels.filter(row=>row.trialRule && row.trialRule!=="none");
    const stage=levels.find(row=>row.id==="stomp_trial") || levels[0];
    if(!character || !stage){
      view("report");lobby.replaceChildren(el("p","格拉拉或集训场地的配置未载入。"),button("返回标题",home));return;
    }
    Profile.practice(character.id);
    const machines=catalog.summons.filter(s=>s.boss&&catalog.monsters.some(m=>m.id===s.boss));
    const boss=machines.find(s=>s.id===drillBoss);
    const field=boss?{...stage,name:boss.name+" · 机体演武",trialRule:"none",count:1,formation:boss.boss,
      front:boss.boss,rear:boss.boss,positions:"9.5",description:"踩住侧甲，再跳上肩甲与冠部；风主位按住跳跃可连续借力。"}:stage;
    const selectable=Object.entries(globalThis.LevelMap?.palette||{}).filter(([id,row])=>
      id==="watcher"||id!=="boss"&&row.enemy&&catalog.monsters.some(m=>m.id===row.enemy));
    const specimen=selectable.find(([id])=>id===drillFoe);
    const select=$("trial-foe");select.replaceChildren();
    for(const [id,name] of [["","守卫阵列"],...selectable.map(([id,row])=>["foe-"+id,row.label]),...machines.map(s=>[s.id,s.name])]){
      const o=el("option",name);o.value=id;select.append(o)
    }
    select.value=specimen?"foe-"+drillFoe:boss?.id||"";
    select.onchange=()=>{drillMain=$("trial-titan").value||drillMain;drillFoe=select.value.startsWith("foe-")?select.value.slice(4):"";drillBoss=drillFoe?"":select.value;trials()};
    const trialSummon=catalog.summons.find(row=>row.id===drillMain)?.id||"mnemosyne";
    let encounter=field,settings={practice:true,bossDrill:!!boss,trialSummon,label:"探求者集训 · 机体与掉落不带出"};
    if(specimen){
      const [type,row]=specimen,map=LevelMap.blank();
      map.width=20;map.objects[0].w=20;map.objects.find(o=>o.type==="exit").x=18;
      map.objects.push({type,x:type==="watcher"||type==="bow"?8:6.3,y:0});
      const layout=LevelMap.compile(map),hint=type==="watcher"?"红色瞄线锁定后，跳过低位脉冲，走到右侧山门。":
        type==="bow"?"观察拉弓方向，跃过箭矢并从上方踩击。":"留意武器起手，在攻击前跳起，从上方踩击。";
      encounter={...stage,name:row.label+" · 演武",trialRule:"none",count:layout.count,positions:layout.positions,formation:layout.formation,description:hint};
      settings={...settings,bossDrill:false,fieldDrill:true,door:layout.door,onResolve:()=>null,label:hint};
    }
    fight(encounter,settings,out=>{
      view("report");lobby.replaceChildren(el("h1",out.win?"训练完成":"训练结束"),el("p","击杀 "+out.kills+" / "+out.total),
        button("再次挑战",trials),button("返回标题",home));
    });
  }
  $("leave").onclick=requestWithdrawal;
  try {
    await CatalogStore.init();catalog=CatalogStore.data;
    const search=new URLSearchParams(location.search);
    if(search.get("bench")==="1")return;
    if(search.get("trial")==="1"){trials();return}
    if(search.get("scene")==="krosos"){visitEntrance();return}
    if(search.get("editor")==="1"){view("editor");ContentEditor(lobby,home);return}
    if(search.get("scene")==="workshop"){visitGorge();return}
    try{gorgeMap=LevelMap.saved(LevelMap.appliedKey,true)}catch{/* A damaged draft cannot prevent loading the project map. */}
    if(!gorgeMap&&location.protocol!=="file:")gorgeMap=await LevelMap.shipped();
    if(search.get("scene")==="gorge")visitGorge();else home();
  }catch(error){lobby.textContent="远征载入失败 · "+error.message}
})();
