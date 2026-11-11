globalThis.JourneyView=(()=>{
  const {el,button}=UI;
  function runDifficulty(run,catalog){
    const world=run.world??catalog.worlds[0];
    return "关卡难度 "+world.level+" · "+CatalogRules.worldName(world);
  }
  function board(node,catalog,character,controls){
    const hero=Profile.hero;
    const message=el("p");
    function act(fn){try{fn()}catch(error){message.textContent=error.message}}
    function enter(){
      const run=hero.run;
      if(!run)return;
      const stage=catalog.levels.find(row=>row.id===run.rooms[run.step]);
      if(!stage){message.textContent="这个房间的配置已移除，可以结束冒险。";return}
      const id=run.id,step=run.step,greater=run.definition.kind==="greater";
      const context=roomContext(run,catalog);
      if(run.deadline && Date.now()>=run.deadline){
        expire(run,catalog,controls);
        return;
      }
      const label=run.definition.name+(greater?"　第 "+run.level+" 层":"")+"　"+(step+1)+" / "+run.rooms.length+" 房";
      controls.fight(stage,{
        label,world:run.world,worldTier:1,unlockSummon:"",hp:run.hp??character.hp,deadline:run.deadline,
        encounter:Adventure.roomEncounter(run,catalog),
        onResolve:outcome=>Adventure.settle(Profile,id,step,{...outcome,catalog})
      },result=>summary(result,catalog,context,controls,enter));
    }
    if(hero.run){
      const run=hero.run;
      const stage=catalog.levels.find(row=>row.id===run.rooms[run.step]);
      node.append(el("h3",run.definition.name),el("p",runDifficulty(run,catalog)+"　·　当前目标　"+(stage?.name||"配置已移除")+"　"+(run.step+1)+" / "+run.rooms.length),
        button("继续冒险",()=>act(enter),"primary"),button("结束本次冒险",()=>{
          if(confirm("结束冒险并返回营地？已结算房间的战利品保留。"))act(()=>{Adventure.abandon(Profile);controls.camp()})
        }),message);
      return;
    }
    const world=WorldDifficulty.current(catalog,hero);
    node.append(el("p","终局挑战 · 建议携带末章装备。大秘境第 1 层沿用剧情末关的生命基准，随后逐层提升。"));
    const supplies=el("p");supplies.append(EchoIcon.token("keys"),"钥石 ×"+(hero.keys||0)+"　个人最高 "+(hero.best||0)+" 层　",EchoIcon.token("shards"),"碎片 ×"+Profile.bag.shards);
    node.append(el("p","难度 "+world.level+" · "+world.name+"　｜　掉落强度 "+world.minPower+"～"+world.maxPower),supplies);
    for(const definition of catalog.adventures.filter(row=>row.kind!=="story")){
      const section=el("section",undefined,"path"),done=Adventure.completed(hero,definition);
      section.append(el("h3",definition.name));
      if(!done || definition.kind!=="story")section.append(el("p",definition.description));
      if(done && definition.kind==="story")section.append(el("p","已完成 · "+definition.ending));
      else{
        let level=1;
        if(definition.kind==="greater"){
          const max=Math.min((hero.best||0)+1,definition.maxTier??30),label=el("label","挑战层数　"),select=el("select");
          for(let i=1;i<=max;i++){
            const ms=hero.times?.[i];
            const option=el("option","第 "+i+" 层"+(ms!==undefined?" · 最快 "+(ms/1000).toFixed(1)+" 秒":""));
            option.value=i;select.append(option);
          }
          level=max;select.value=String(max);select.onchange=()=>{level=Number(select.value)};label.append(select);
          section.append(label,el("p","金星套装 · 限时通关第 20 层起掉落。20–24 层 10%，25–29 层 20%，30 层 35%。首次达到条件必出一枚。"),el("p","限时 "+(definition.timeLimit??100)+" 秒，休整和查阅手记计入时限。入场消耗 "+(definition.keyCost??1)+" 钥石。"));
        }
        const launch=button(definition.kind==="story"?"接受调查并出发":"进入"+(definition.kind==="lesser"?"小秘境":"大秘境"),()=>act(()=>{
          Adventure.begin(Profile,definition,level,Date.now(),catalog);enter();
        }),"primary");
        const locked=Adventure.riftEntryReason(hero,definition,catalog);
        if(locked){launch.disabled=true;launch.textContent=locked}
        section.append(launch);
      }
      node.append(section);
    }
    node.append(message);
  }
  function roomContext(run,catalog){
    const stage=catalog.levels.find(row=>row.id===run.rooms[run.step]);
    const tier=run.definition.kind==="greater"?"　·　第 "+run.level+" 层":"";
    return {id:run.id,route:run.definition.name+tier+"　·　"+runDifficulty(run,catalog),number:run.step+1,stage:stage?.name||"遗迹深处",
      progress:{chapter:Profile.hero.chapter,best:Profile.hero.best,previousCampaignClear:Profile.hero.previousCampaignClear}};
  }
  function expire(run,catalog,controls){
    const current=Profile.hero?.run,now=Date.now();
    if(!current?.deadline || current.id!==run.id || now<current.deadline)return;
    const receipt=Adventure.settle(Profile,current.id,current.step,{win:false},now);
    if(!receipt)return;
    const checkpoint=controls.root.querySelector(".rift-report");
    if(checkpoint?.dataset.nextStep===String(current.step) && checkpoint.dataset.run===current.id){
      controls.report();
      const heading=el("h1",receipt.status);
      checkpoint.querySelector("h1").replaceWith(heading);
      checkpoint.dataset.result="lost";
      checkpoint.querySelector("header .folio-badge")?.replaceWith(WorldFolio.badge("lost"));
      checkpoint.querySelector(".rift-note").replaceChildren(el("b","挑战结束"),el("span","本房战利品已保留，本次未升层。"));
      checkpoint.querySelector("[data-next-room]")?.remove();
      heading.tabIndex=-1;heading.focus({preventScroll:true});
      return;
    }
    summary({kills:0,total:0,rewards:[],settlement:receipt},catalog,{...roomContext(current,catalog),betweenRooms:true},controls);
  }
  function summary(outcome,catalog,context,controls,nextRoom){
    controls.report();
    const receipt=outcome.settlement,won=!!(receipt?.complete||receipt?.next),run=Profile.hero.run;
    const screen=el("section",undefined,"rift-report"),head=el("header"),portrait=el("canvas");
    screen.dataset.run=context.id;screen.dataset.result=won?"won":"lost";
    if(receipt?.next)screen.dataset.nextStep=String(context.number);
    GlalaArt.draw(portrait,null,"portrait");portrait.setAttribute("aria-hidden","true");
    const title=el("div");title.append(el("small",context.route+"　／　第 "+context.number+" 房"),el("h1",receipt?.status||"冒险结束"),el("b",context.stage));
    const note=el("div",undefined,"rift-note");
    if(receipt?.next && run)note.append(el("small","下一房"),el("b",catalog.levels.find(row=>row.id===run.rooms[run.step])?.name||"遗迹深处"),el("span","休整后生命 "+run.hp+"　·　整理回响后可继续"));
    else note.append(el("p",receipt?.ending||"已取得的击杀收益和此前结算的战利品保留。"));
    if(receipt?.complete && context.progress){
      const opened=WorldDifficulty.unlocked(catalog,context.progress,Profile.hero);
      if(opened.length)note.append(el("b","关卡难度已开放　"+opened.join("、")));
    }
    title.prepend(WorldFolio.badge(won?"won":"lost"));head.append(portrait,title,note);
    const metrics=el("div",undefined,"rift-metrics"),income=receipt?.growth||outcome.growth||{};
    function metric(label,value,caption){
      const cell=el("div");cell.append(el("small",label),el("strong",String(value)),el("span",caption));metrics.append(cell);
    }
    metric("本房击杀",outcome.kills+" / "+outcome.total,"本房守卫");
    metric("获得经验","+"+(income.xp||0),income.levelEnd?"等级 "+income.levelStart+(income.levelStart!==income.levelEnd?" → "+income.levelEnd:""):"");
    metric("获得尼奥德","+"+((receipt?.gold||0)+(income.killGold||0)),"击杀 "+(income.killGold||0)+"　房间 "+(receipt?.gold||0));
    const drops=won?[...outcome.rewards].sort((a,b)=>AshenLoot.compare(b,a)):[];
    if(receipt?.goldStar)drops.unshift(receipt.goldStar.item);
    metric("回响",drops.length+" 枚",won?"本房结算":"本房未结算");
    const gallery=el("section",undefined,"rift-gallery"),bar=el("div",undefined,"rift-gallery-head"),pages=el("nav"),grid=el("div",undefined,"rift-drops");
    bar.append(el("h2","本房战利品"),pages);gallery.append(bar,grid);
    const pageSize=10,count=Math.max(1,Math.ceil(drops.length/pageSize));let page=0,visible=[];
    function refresh(){
      const owned=new Set(Profile.bag.items.map(i=>i.uid));
      for(const [card,item,label] of visible){
        card.setAttribute("aria-disabled",String(!owned.has(item.uid)));
        label.textContent=item.tierName+" · "+(!owned.has(item.uid)?"已分解":Profile.hero.disc?.includes(item.uid)?"已装盘":"角色背包");
      }
    }
    function redraw(){
      grid.replaceChildren();pages.replaceChildren();visible=[];
      if(count>1){
        const prev=button("‹",()=>{page--;redraw()}),next=button("›",()=>{page++;redraw()});
        prev.setAttribute("aria-label","上一页战利品");next.setAttribute("aria-label","下一页战利品");
        prev.disabled=!page;next.disabled=page===count-1;pages.append(prev,el("span",(page+1)+" / "+count),next);
      }
      for(const item of drops.slice(page*pageSize,(page+1)*pageSize)){
        const card=button("",()=>{if(Profile.bag.items.some(row=>row.uid===item.uid))controls.inspect(item.uid)},"rift-drop"),icon=el("canvas"),label=el("small");
        card.dataset.riftUid=item.uid;card.style.setProperty("--drop-color",item.color);
        EchoIcon.draw(icon,item);icon.setAttribute("aria-hidden","true");card.append(icon,el("b",item.name),label);
        const detail=el("span",UI.statsText(item),"rift-affixes");card.append(detail);
        grid.append(card);visible.push([card,item,label]);
      }
      if(!drops.length)grid.append(el("p",won?"没有回响掉落。":"未带出本房回响。"));refresh();
    }
    redraw();
    if(receipt?.summons?.length)gallery.append(UI.summonFinds(catalog,receipt.summons));
    if(receipt?.goldStar)gallery.append(el("p","金星套装 · "+receipt.goldStar.item.name+(receipt.goldStar.kept?" 已入库":" 已分解")));
    if(receipt?.prize){
      const p=receipt.prize;gallery.append(el("p","第 "+p.tier+" 层　·　用时 "+(p.ms/1000).toFixed(1)+" 秒　"+p.name+" · "+ItemStrength.describe(p.itemPower)+" · 层印伤害 +"+p.attack+(p.kept?" 已入库":" 已分解")));
    }
    if(receipt?.complete){const reward=el("p","通关奖励　");reward.append(EchoIcon.token("shards"),"碎片 ×"+receipt.shards+"　",EchoIcon.token("keys"),"钥石 ×"+receipt.keys);gallery.append(reward)}
    const actions=el("nav",undefined,"actions");actions.setAttribute("aria-label","房间结算操作");
    actions.append(button("返回城镇",controls.camp),button("整理武器盘",()=>controls.inspect()));
    if(receipt?.next && nextRoom){
      const next=button("进入下一房",nextRoom,"primary");next.dataset.nextRoom="";actions.append(next);
    }
    screen.append(head,metrics,gallery,actions);controls.root.replaceChildren(screen);
    if(context.betweenRooms){
      metrics.hidden=true;gallery.replaceChildren(el("p","已结算的房间收益保留，本次未升层。"));
    }
    if(receipt?.timedOut){
      const heading=title.querySelector("h1");heading.tabIndex=-1;heading.focus({preventScroll:true});
    }
    screen.addEventListener("focusin",refresh);
    // The guardian can be dead and its rewards banked while the player still has the combat screen open.
    if(receipt?.next && run?.deadline && Date.now()>=run.deadline)expire(run,catalog,controls);
  }
  return {board,expire};
})();
