// One screen owns all preview state; a preview never changes the saved formation.
globalThis.VaultView=function(root,back,characterId,catalog=CatalogStore.data,entry="disc"){
  const {el,button}=UI, profile=Profile;
  let hero=profile.hero,bag=profile.bag,equippedStars={};
  Echoes.initialize(profile,catalog);
  const role=catalog.characters.find(c=>c.id===characterId)||catalog.characters.find(c=>c.id==="glala"),coords=[[2,2],[4,2],[2,4],[4,4],[1,1],[5,1],[1,3],[5,3],[1,5],[5,5]];
  const pageSize=40,filters={quality:"",series:"",stat:"",state:"",sort:"recent"};
  let slot=0,uid=null,focus=entry==="character"?"hero":"overview",candidate=null,previewRemoval=false,page=0,note="",tip,drag=null;
  const active=()=>catalog.summons.find(s=>s.id===hero.summon && Echoes.owns(hero,s.id));
  const itemFor=id=>bag.items.find(x=>x.uid===id),n=v=>Number.isFinite(v)?String(Number(v.toFixed(2))):"—";
  const metricFields={
    whiteAttack:["攻击白值",""],whiteHealth:["生命白值",""],bladeDamage:["潮刃伤害",""],height:["跳高","米"],speed:["命中落速","米/秒"],damage:["踩踏伤害",""],regen:["体力恢复","点/秒"],weight:["负重",""],move:["移动速度","米/秒"],
    hp:["生命上限","点"],stamina:["体力上限","点"],defense:["伤害减免","%"],windup:["起跳准备","毫秒"],jumpCost:["单次起跳","体力"],
    burnDamage:["每层灼烧伤害",""],burnTime:["灼烧持续","秒"],ailmentHit:["异常命中加成","百分点"],
    shotDamage:["弹丸伤害",""],shotPeriod:["射击间隔","秒"],shotSize:["弹丸半径","米"],extraJumps:["空中额外跳跃","次"],
    shieldPeriod:["护盾恢复间隔","秒"],wavePower:["震波伤害倍率","%"],waveRadius:["震波半径","米"],
    slashDamage:["斩击伤害",""],slashPeriod:["斩击间隔","秒"],slashRadius:["斩击半径","米"],
    shadowDamage:["残影伤害",""],shadowHp:["残影生命","点"],shadowLife:["残影持续","秒"]
  };
  const commonMetrics=["whiteAttack","whiteHealth","hp","stamina","height","speed","damage","regen","weight","move","defense","windup","jumpCost"];
  const byKind={
    burn:["burnDamage","burnTime","ailmentHit"],shot:["shotDamage","shotPeriod","shotSize"],wind:["extraJumps"],
    earth:["shieldPeriod","wavePower","waveRadius"],slash:["slashDamage","slashPeriod","slashRadius"],
    shadow:["shadowDamage","shadowHp","shadowLife"]
  };
  const abilityNames={burn:"灼烧",shot:"自动射击",wind:"空中连跳",earth:"震波与护盾",slash:"近身斩击",shadow:"自主残影"};
  function metrics(disc=hero.disc,id=active()?.id||"",item){
    const build=Loadout.resolve(catalog,role,undefined,false,{}, {disc,summon:id,item}),jump=JumpPhysics.preview(build);
    const values={...build,height:jump.height,speed:jump.speed,damage:jump.damage,hp:build.maxHp??role.hp,stamina:build.staminaMax,
      defense:(build.defense||0)*100,windup:build.windupTicks*JumpPhysics.step*1000,ailmentHit:(build.ailmentHit||0)*100,
      wavePower:build.wave?.power*100,waveRadius:build.wave?.radius};
    const burnChance=(build.burnChances||[]).map(base=>Math.min(100,Math.round((base+build.ailmentHit)*100)));
    const powerMetrics=[];
    if(build.bladeDamage)powerMetrics.push("bladeDamage");
    if(build.extraJumps)powerMetrics.push("extraJumps");
    if(build.stars.tide>=6)powerMetrics.push(...byKind.shot);
    if(build.stars.shade>=6)powerMetrics.push(...byKind.shadow);
    return {kind:build.kind||"",values,burnChance,powerMetrics,stars:build.stars};
  }
  const applies=(line,s,item)=>TitanBuild.supports(line.stat,s?.ability||"") ||
    (TitanBuild.domains.shot.includes(line.stat)&&equippedStars.tide>=6) ||
    (TitanBuild.domains.shadow.includes(line.stat)&&equippedStars.shade>=6) ||
    (["shotDamage","shotSize"].includes(line.stat) && (item?.power?.kind==="return_blade" ||
      bag.items.some(i=>i.power?.kind==="return_blade"&&hero.disc.includes(i.uid))));
  const valueText=(line,value)=>UI.statValue(line.stat,value);
  const icon=(item,format)=>{const c=el("canvas");EchoIcon.draw(c,item,format);c.setAttribute("aria-hidden","true");return c};
  const art=s=>{const c=el("canvas");SummonArt.draw(c,s);c.setAttribute("aria-hidden","true");return c};
  const subtitle=t=>el("h3",t,"ar-sub"),tag=t=>el("small",t,"ar-caption");
  function source(s){
    const names=[];
    catalog.chapters.forEach((ch,ci)=>WorldCampaign.rooms(ch).forEach((id,si)=>{
      const l=catalog.levels.find(x=>x.id===id);if(l && (l.formation?l.formation.split(/[,，]/).map(x=>x.trim()):[l.front,l.rear]).includes(s.boss))names.push((ci+1)+"-"+(si+1)+" "+l.name);
    }));return names.join("、")||"对应虚数体所在关卡";
  }
  function changes(from,to,all=false){
    const box=el("dl",undefined,"ar-numbers");
    const fromKeys=[...commonMetrics,...from.powerMetrics,...(byKind[from.kind]||[])],toKeys=[...commonMetrics,...to.powerMetrics,...(byKind[to.kind]||[])];
    for(const key of new Set([...fromKeys,...toKeys])){
      const a=fromKeys.includes(key)?n(from.values[key]):"—",b=toKeys.includes(key)?n(to.values[key]):"—";
      if(!all&&a===b)continue;
      const [label,unit]=metricFields[key],row=el("div");
      row.append(el("dt",label),el("dd",(a===b?a:a+" → "+b)+(unit?" "+unit:""),a===b?"":"ar-change"));
      box.append(row);
    }
    for(const [id,set] of Object.entries(GoldStars.sets)){
      const a=from.stars[set.key]||0,b=to.stars[set.key]||0;
      if((!a&&!b)||(!all&&a===b))continue;
      const row=el("div"),unlocks=set.tiers.flatMap((effect,i)=>{
        const need=2*(i+1);
        if((b>=need)===(a>=need))return [];
        return [(b>=need?"激活":"失去")+need+"件 · "+effect];
      });
      row.append(el("dt",FANTASY_CARDS.cards[id].name),el("dd",[a===b?b+" 件":a+" → "+b+" 件",...unlocks].join("　")));
      box.append(row);
    }
    if(from.kind==="burn" || to.kind==="burn"){
      const probability=t=>t.kind==="burn"&&t.burnChance.length?t.burnChance.join(" / ")+"%":"—";
      const a=probability(from),b=probability(to);
      if((all||a!==b) && !(a==="—"&&b==="—")){
        const row=el("div",undefined,"ar-prob");
        row.append(el("dt","各层点燃率（从低到高）"),el("dd",a===b?a:a+" → "+b,a===b?"":"ar-change"));
        box.append(row);
      }
    }
    return box;
  }
  function action(fn,msg){let ok=false;try{fn();note=msg||"";ok=true}catch(e){note=e.message}draw();return ok}
  function reviewSalvage(items){
    hideTip();
    SalvageReview(root,items,bag.shards,(ids,value)=>{
      profile.commit(()=>AshenLoot.salvageSelection(profile.bag,ids,value));
    },(count,value)=>{
      if(uid&&!itemFor(uid)){uid=null;focus="overview"}
      note="已分解 "+count+" 枚回响　·　获得 "+value+" 碎片";
      draw();
      const target=root.querySelector(".ar-selected[data-bag-uid]")||root.querySelector("[data-bag-uid]")||root.querySelector(".ar-slot");
      target?.focus({preventScroll:true});
    });
  }
  function reviewForge(item,offer){
    hideTip();
    const equipped=hero.disc.indexOf(item.uid);
    const duplicate=item.uniqueId?bag.items.find(i=>hero.disc.includes(i.uid)&&(i.uniqueId===item.uniqueId||i.name===item.name)):null;
    const target=duplicate?hero.disc.indexOf(duplicate.uid):slot;
    const disc=equipped>=0?hero.disc:Echoes.plan(hero.disc,item.uid,target);
    const projected=AshenForge.previewItem(item,offer);
    const delta=changes(metrics(disc),metrics(disc,active()?.id||"",projected));
    ForgeReview(root,{item,projected,offer,delta,balance:bag.shards,
      position:equipped>=0?"已装盘 · 第 "+(equipped+1)+" 格":"背包中 · 按装入第 "+(target+1)+" 格试算",
      commit:()=>profile.commit(()=>{
        if(!offer.line){AshenForge.upgrade(profile.bag,catalog,offer);return}
        const error=AshenForge.apply(profile.bag,catalog,offer);
        if(error)throw Error(error);
      }),
      complete:()=>{
        note=item.name+(offer.line?" 洗练完成":" 强化至 +"+projected.upgrade)+"　·　消耗 "+offer.cost+" 碎片";draw();
        const control=root.querySelector('[data-forge="'+(offer.line?"洗练":"强化")+'"]')||root.querySelector(".ar-selected[data-bag-uid]");
        control?.focus({preventScroll:true});
      }
    });
  }
  function identify(item){
    const box=el("div",undefined,"ar-item-info"),base=catalog.equipment.find(x=>x.id===item.baseId);
    const title=el("b",item.name,"ar-name");title.style.color=item.color;
    box.append(title,tag(UI.qualityText(item)),tag((item.stats?.length||0)+" 条"+(item.uniqueId?"固定":"魔法")+"词缀　强化 +"+(item.upgrade||0)),el("p",UI.baseText(item)+"　负重 "+n(item.weight)));
    if(item.power){const lore=el("p",UI.powerText(item)+(item.uniqueId?"　同名限装一件。":"　相同威能取已装最高值。"),"ar-power");lore.style.setProperty("--tier",item.color);box.append(lore)}
    const origin=EchoIcon.origin(item);if(origin)box.append(tag(origin));
    const set=GoldStars.sets[item.goldStarId];
    if(set){
      const count=equippedStars[set.key]||0;
      box.append(subtitle("同名套装 · 已装 "+count+" 件"));
      set.tiers.forEach((effect,i)=>{
        const need=2*(i+1),active=count>=need;
        box.append(el("p",(active?"已激活":"未激活")+" · "+need+" 件　"+effect,active?"ar-power":"ar-caption"));
      });
    }
    if(item.locked)box.append(tag("已锁定 · 可装卸"));
    if(base?.sourceMonster)box.append(el("p","原型："+(catalog.monsters.find(m=>m.id===base.sourceMonster)?.name||base.sourceMonster)+"　·　专属掉落"));
    const current=active();
    for(const line of Echoes.lines(item,current)){
      const usable=applies(line,current,item),amp=usable&&line.boosted;
      const label=line.series+" · "+(UI.stats[line.stat]||line.stat)+" "+valueText(line,line.value)+UI.rangeText(line);
      box.append(el("div",label+(amp?" → "+valueText(line,line.effective)+"　加护":!usable?"　当前机体不触发":""),amp?"ar-lit":usable?"ar-line":"ar-line ar-muted"));
    }
    if(item.upgradeAttack||item.riftAttack)box.append(el("div","强化及层印攻击白值 +"+n((item.upgradeAttack||0)+(item.riftAttack||0)),"ar-lit"));
    return box;
  }
  const planItem=(item,target)=>Echoes.plan(hero.disc,hero.disc[target]===item.uid?null:item.uid,target);
    let hintTimer=0,revealAfter=0;
    function hideTip(){clearTimeout(hintTimer);if(tip){tip.hidden=true;tip.replaceChildren()}}
  function hints(node,build){
    function show(){
        if(!tip||drag||!node.isConnected)return;
        const delay=revealAfter-performance.now();
        if(delay>0&&node.classList.contains("ar-committed")){
          clearTimeout(hintTimer);
          hintTimer=setTimeout(()=>{if(node.matches(":hover,:focus"))show()},Math.ceil(delay));
          return;
        }
        tip.replaceChildren(build());tip.hidden=false;
      GameFrame.placeTooltip(tip,node);
    }
    node.setAttribute("aria-describedby","arsenal-tooltip");
    node.addEventListener("pointerenter",e=>{if(e.pointerType!=="touch")show()});node.addEventListener("pointerleave",hideTip);
    node.addEventListener("focus",show);node.addEventListener("blur",hideTip);
  }
  function itemHint(item,i){
    const a=identify(item),disc=planItem(item,i),error=Echoes.discError(bag,disc);
    if(error){a.append(tag(error));return a}
    const from=metrics(),to=metrics(disc);
    const list=changes(from,to);a.append(tag((hero.disc[i]===item.uid?"卸下":"装入")+"第 "+(i+1)+" 格后"));
    a.append(list.children.length?list:el("p","角色数值不变"));return a;
  }
  function choose(item,i){slot=i;uid=item?.uid||null;focus=item?"echo":"empty";note="";draw()}
  function chooseMachine(s){candidate=s.id;focus="machine";previewRemoval=false;note="";draw()}
  function moveEcho(item,destination,from=null){
    if(!item||itemFor(item.uid)!==item)return false;
    if(from!==null && hero.disc[from]!==item.uid)return false;
    const unload=destination==="bag",target=unload?from:destination;
    if(!Number.isInteger(target)||target<0||target>=10||(!unload&&hero.disc[target]===item.uid))return false;
    const moved=action(()=>{
      Echoes.equip(profile,unload?null:item.uid,target);
      slot=target;uid=null;focus="overview";
    },unload?item.name+"已卸下":item.name+"已装入第 "+(target+1)+" 格");
    if(moved){
      const cell=root.querySelector('[data-ar-target="'+target+'"]');
      cell?.classList.add("ar-committed");
        revealAfter=performance.now()+460;
      if(unload)root.querySelector('[data-bag-uid="'+CSS.escape(item.uid)+'"]')?.classList.add("ar-committed");
      hideTip();
    }
    return moved;
  }
  function dragBegin(item,from,source){
    dragEnd();hideTip();
    drag={item,from,source,target:null};
    source.classList.add("ar-drag-source");
    root.querySelector(".arsenal").classList.add("ar-dragging");
  }
  function dragEnd(){
    if(!drag)return;
    drag.source.classList.remove("ar-drag-source");drag.target?.classList.remove("ar-drop-target");
    root.querySelector(".arsenal")?.classList.remove("ar-dragging");
    const info=root.querySelector(".ar-drag-info");if(info)info.replaceChildren();
    drag=null;
  }
  function targetOf(node){
    const target=node?.closest("[data-ar-target]");
    return drag && target && root.contains(target) && (target.dataset.arTarget!=="bag"||drag.from!==null)?target:null;
  }
  function hoverDrop(node){
    if(!drag)return;
    const target=targetOf(node);
    if(drag.target===target)return;
    drag.target?.classList.remove("ar-drop-target");drag.target=target;
    const info=root.querySelector(".ar-drag-info");
    info.replaceChildren();
    if(!target)return;
    target.classList.add("ar-drop-target");
    const unload=target.dataset.arTarget==="bag",i=unload?drag.from:Number(target.dataset.arTarget);
    if(!unload&&hero.disc[i]===drag.item.uid){info.append(tag("当前位置"));return}
    const next=Echoes.plan(hero.disc,unload?null:drag.item.uid,i),error=Echoes.discError(bag,next);
    if(error){info.append(tag(error));return}
    const delta=changes(metrics(),metrics(next));
    const replaced=itemFor(hero.disc[i]);
    info.append(subtitle(unload?"卸下至背包":"装入第 "+(i+1)+" 格"),el("b",drag.item.name));
    if(!unload&&replaced)info.append(tag((hero.disc.includes(drag.item.uid)?"互换 ":"替换 ")+replaced.name));
    info.append(delta.children.length?delta:tag("角色属性不变"));
  }
  function finishDrop(node){
    if(!drag)return;
    const target=targetOf(node),{item,from}=drag;dragEnd();
    if(target)moveEcho(item,target.dataset.arTarget==="bag"?"bag":Number(target.dataset.arTarget),from);
  }
  function draggable(node,item,from=null){
    let touch=null,suppressClick=false;
    node.draggable=true;
    node.ondragstart=e=>{
      if(touch){e.preventDefault();return}
      dragBegin(item,from,node);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("application/x-ashen-echo",item.uid);
    };
    node.ondragend=dragEnd;
    function resetTouch(){if(touch)clearTimeout(touch.timer);touch=null}
    node.onpointerdown=e=>{
      if(e.pointerType!=="touch"||!e.isPrimary)return;
      suppressClick=false;resetTouch();touch={x:e.clientX,y:e.clientY,id:e.pointerId};
      touch.timer=setTimeout(()=>{
        if(!node.isConnected||!touch)return;
        node.setPointerCapture(touch.id);dragBegin(item,from,node);suppressClick=true;
      },320);
    };
    node.onpointermove=e=>{
      if(!touch||e.pointerId!==touch.id)return;
      if(drag?.source===node){e.preventDefault();hoverDrop(document.elementFromPoint(e.clientX,e.clientY))}
      else if(Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>8)resetTouch();
    };
    node.onpointerup=e=>{
      if(!touch||e.pointerId!==touch.id)return;
      resetTouch();
      if(drag?.source===node){e.preventDefault();finishDrop(document.elementFromPoint(e.clientX,e.clientY))}
    };
    node.onpointercancel=node.onlostpointercapture=e=>{
      if(!touch||e.pointerId!==touch.id)return;
      resetTouch();if(drag?.source===node)dragEnd();
    };
    node.addEventListener("click",e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  }
  function portraitRail(pre){
    const rail=el("section",undefined,"ar-rail"),c=el("canvas",undefined,"ar-hero");GlalaArt.draw(c,role,"portrait");
    const current=active(),now=metrics();
    const level=Growth.status(hero,catalog);
    rail.append(tag("角色档案"),c,el("h3",profile.slot?.name||"格拉拉"),
      tag("等级 "+level.level+"　"+(level.capped?"已达等级上限":"经验 "+level.xp+" / "+level.needed)),
      tag(current?"主位 · "+current.name:"格拉拉基础动作"),
      subtitle(pre?"属性变更预览":"当前编成属性"),changes(now,pre||now,true));
    return rail;
  }
  function slotButton(i){
    const item=itemFor(hero.disc[i]),b=button("",()=>{
      const held=focus==="echo"&&itemFor(uid);
      if(held&&held.uid!==item?.uid){moveEcho(held,i);return}
      choose(item,i);
    },"ar-tile ar-slot"+(slot===i?" ar-selected":"")+(item?"":" ar-blank"));
    b.dataset.arTarget=String(i);b.dataset.focusKey="slot:"+i;
    b.style.gridColumn=coords[i][0];b.style.gridRow=coords[i][1]+" / span 2";
    b.setAttribute("aria-label","盘位 "+(i+1)+"："+(item?.name||"空位"));b.setAttribute("aria-pressed",String(slot===i));
    b.append(el("small",String(i+1).padStart(2,"0")));
    if(item){const current=active();b.style.setProperty("--tier",item.color);b.append(icon(item));if(Echoes.lines(item,current).some(l=>l.boosted && applies(l,current)))b.append(el("em","◆","ar-seal"));
      hints(b,()=>itemHint(focus==="echo"&&itemFor(uid)||item,i));draggable(b,item,i);
    }else b.append(el("span","◇","ar-socket"));
    if(!item)hints(b,()=>focus==="echo"&&itemFor(uid)?itemHint(itemFor(uid),i):tag("第 "+(i+1)+" 格 · 空位"));
    return b;
  }
  function machineInfo(s){
    const box=el("div",undefined,"ar-machine-info"),owned=Echoes.owns(hero,s.id),on=active()?.id===s.id;
    box.append(el("b",s.name,"ar-name"),tag(on?"当前主位 · 已生效":owned?"已获得 · 尚未装备":"图鉴 · 未获得"),el("p",s.description));
    box.append(subtitle("固有能力 · "+(abilityNames[s.ability]||"机体能力")),el("p",s.abilityText||"请查阅机体记录。"),
      subtitle("加护领域"),el("p",(s.series||"—")+"系回响词条加成 "+Math.round((s.boost||0)*100)+"%"+(on?" · 生效中":" · 未生效")),
      tag("讨伐地点 · "+source(s)));
    return box;
  }
  function board(){
    const sect=el("section",undefined,"ar-board"),head=el("div",undefined,"ar-headrow");
    head.append(subtitle("回响武器盘"),tag(hero.disc.filter(Boolean).length+" / 10"));sect.append(head);
    const stage=el("div",undefined,"ar-stage"),s=active();
    if(s){
      const core=button("",()=>chooseMachine(s),"ar-core");
      core.append(tag("主位虚数体"),art(s),el("b",s.name),el("small",s.series+" · 加护生效"));
      hints(core,()=>machineInfo(s));stage.append(core);
    }else{
      const core=el("div",undefined,"ar-core"),c=el("canvas");
      GlalaArt.draw(c,role,"portrait");c.setAttribute("aria-hidden","true");
      core.append(tag("主位空缺"),c,el("b","格拉拉基础动作"),el("small","消耗体力跳跃，落下时踩踏"));stage.append(core);
    }
    for(let i=0;i<10;i++)stage.append(slotButton(i));sect.append(stage);
    const roster=el("div",undefined,"ar-roster");roster.append(tag("虚数体图鉴"));
    for(const row of catalog.summons){
      const owned=Echoes.owns(hero,row.id),selected=focus==="machine"&&candidate===row.id;
      const b=button("",()=>chooseMachine(row),(!owned?"ar-locked ":"")+(selected?"ar-picked":""));
      b.append(art(row),el("span",row.name),el("small",s?.id===row.id?"主位":owned?"已获得":"未获得"));
      b.setAttribute("aria-label","查看虚数体："+row.name);b.setAttribute("aria-pressed",String(selected));roster.append(b);
    }
    sect.append(roster);
    return sect;
  }
  function listedItems(){
    const list=[...bag.items].reverse().filter(it=>{
      if(filters.quality && it.tier!==filters.quality)return false;
      if(filters.series && !(it.stats||[]).some(line=>line.series===filters.series))return false;
      if(filters.stat && !(it.stats||[]).some(line=>line.stat===filters.stat))return false;
      const equipped=hero.disc.includes(it.uid);
      return !filters.state||filters.state==="locked"&&it.locked||filters.state==="used"&&equipped||filters.state==="idle"&&!equipped;
    });
    if(filters.sort==="quality")list.sort((a,b)=>AshenLoot.compare(b,a));
    if(filters.sort==="strength")list.sort((a,b)=>ItemStrength.of(b)-ItemStrength.of(a)||AshenLoot.compare(b,a));
    return list;
  }
  function selector(key,label,options){
    const sel=el("select");sel.setAttribute("aria-label",label);sel.dataset.focusKey="filter:"+key;
    for(const [id,name] of options){const o=el("option",name);o.value=id;sel.append(o)}
    sel.value=filters[key];
    sel.onchange=()=>{filters[key]=sel.value;page=0;draw()};
    return sel;
  }
  function bagView(){
    const section=el("section",undefined,"ar-bag"),head=el("div",undefined,"ar-headrow"),options=el("div",undefined,"ar-filters");
    section.dataset.arTarget="bag";head.append(subtitle("回响背包"),tag(bag.items.length+" / "+AshenLoot.capacity));
    const series=[...new Set([...catalog.summons.map(s=>s.series),...bag.items.flatMap(it=>(it.stats||[]).map(l=>l.series))].filter(Boolean))];
    options.append(selector("quality","品质",[["","全部品质"],...catalog.rarities.map(t=>[t.id,t.name])]),
      selector("series","系列",[["","全部系列"],...series.map(s=>[s,s])]),
      selector("stat","词条用途",[["","全部词条"],...Object.entries(UI.stats)]),
      selector("state","上盘状态",[["","全部状态"],["used","已上盘"],["idle","未上盘"],["locked","已锁定"]]),
      selector("sort","排序",[["recent","最新获得"],["quality","品质优先"],["strength","强度优先"]]));
    section.append(head,options);
    const list=listedItems(),filtered=filters.quality||filters.series||filters.stat||filters.state;
    const pages=filtered?Math.max(1,Math.ceil(list.length/pageSize)):Math.ceil(AshenLoot.capacity/pageSize);
    page=Math.min(page,pages-1);
    const tiles=el("div",undefined,"ar-items");
    list.slice(page*pageSize,(page+1)*pageSize).forEach(item=>{
      const b=button("",e=>{
        const current=hero.disc.indexOf(item.uid);
        choose(item,current===-1?slot:current);
        if(e.detail===0)root.querySelector('[data-ar-target="'+slot+'"]').focus();
      },"ar-tile"+(item.uid===uid?" ar-selected":""));b.style.setProperty("--tier",item.color);b.setAttribute("aria-label","背包："+item.name);
      b.dataset.bagUid=item.uid;b.dataset.focusKey="item:"+item.uid;
      b.append(icon(item),el("small",item.tierName,"ar-rarity"));const used=hero.disc.includes(item.uid);
      if(used||item.locked)b.append(el("em",used?(item.locked?"盘·锁":"在盘"):"锁","ar-seal"));
      hints(b,()=>itemHint(item,slot));draggable(b,item);tiles.append(b);
    });
    for(let i=tiles.children.length;i<pageSize;i++)tiles.append(el("span","·","ar-bag-empty"));section.append(tiles);
    const nav=el("div",undefined,"ar-nav"),prev=button("‹",()=>{page--;draw()}),next=button("›",()=>{page++;draw()});
    prev.dataset.focusKey="prev";next.dataset.focusKey="next";
    prev.setAttribute("aria-label","上一页");next.setAttribute("aria-label","下一页");prev.disabled=!page;next.disabled=page>=pages-1;
    const candidates=bag.items.filter(item=>item.rank===0&&AshenLoot.canSalvage(bag,item));
    const salvage=button("分解闲置 N 级",()=>reviewSalvage(candidates));
    salvage.disabled=!candidates.length;
    nav.append(prev,tag("第 "+(page+1)+" / "+pages+" 页"),next,tag(list.length+" 件"),salvage);section.append(nav);return section;
  }
  function inspect(){
    const pane=el("aside",undefined,"ar-inspector"),item=itemFor(uid),s=catalog.summons.find(x=>x.id===candidate);
    pane.append(tag("探求者手记"));
    if(focus==="machine"&&s){
      pane.append(subtitle("虚数体档案"),art(s),machineInfo(s));
      const on=active()?.id===s.id,owned=Echoes.owns(hero,s.id);
      if(!owned){
        const locked=button("尚未获得",()=>{});locked.disabled=true;pane.append(locked);return pane;
      }
      if(on&&!previewRemoval){
        pane.append(button("预览卸下",()=>{previewRemoval=true;note="";draw()}));
      }else{
        pane.append(tag(on?"卸下预览 · 确认后恢复格拉拉基础动作":"装备预览 · 确认后启用机体能力与加护"),
          button(on?"确认卸下":"确认设为主位",()=>action(()=>{
            Echoes.bindSummon(profile,on?"":s.id);previewRemoval=false;focus="overview";
          },on?"已卸下虚数体":"已装备 "+s.name),"primary"),
          button("取消预览",()=>{focus=on?"machine":"overview";previewRemoval=false;note="";draw()}));
      }
      const matched=hero.disc.flatMap(id=>{const gear=itemFor(id);return gear?Echoes.lines(gear,s).filter(l=>l.boosted&&applies(l,s)):[]});
      pane.append(subtitle((on?"已加护词条":"可加护词条")+" · "+matched.length+" 条"));
      for(const line of matched)pane.append(el("div",(UI.stats[line.stat]||line.stat)+" "+valueText(line,line.value)+" → "+valueText(line,line.effective),"ar-lit"));
    }else if(focus==="echo"&&item){
      pane.append(subtitle("回响详情"),icon(item,"detail"),identify(item));
      const remove=hero.disc[slot]===uid;
      const targets=el("select");targets.setAttribute("aria-label","目标盘位");targets.dataset.focusKey="target";
      for(let i=0;i<10;i++){const opt=el("option","第 "+(i+1)+" 格 · "+(itemFor(hero.disc[i])?.name||"空"));opt.value=i;targets.append(opt)}
      targets.value=String(slot);targets.onchange=()=>{slot=Number(targets.value);draw()};
      const disc=planItem(item,slot),error=Echoes.discError(bag,disc);
      const delta=changes(metrics(),metrics(disc)),apply=button((remove?"卸下":"确认装入")+"第 "+(slot+1)+" 格",()=>moveEcho(item,remove?"bag":slot,remove?slot:null),"primary");
      apply.disabled=!!error;
      pane.append(subtitle("目标盘位"),targets,error?tag(error):delta.children.length?delta:tag("角色属性不变"),apply,
        button("取消选择",()=>choose(null,slot)));
      const bar=el("div",undefined,"ar-tools");
      bar.append(button(item.locked?"解锁":"锁定",()=>action(()=>profile.commit(()=>{item.locked=!item.locked}))));
      const upgrade=AshenForge.upgradeQuote(catalog,item);
      if(upgrade){const control=button("强化",()=>reviewForge(item,upgrade));control.dataset.forge="强化";bar.append(control)}
      if(!item.locked&&item.tier!=="unique"&&!item.uniqueId&&item.stats?.length){
        const choice=el("select");choice.setAttribute("aria-label","选择洗练词缀");
        item.stats.forEach((line,i)=>{const op=el("option",(i+1)+" · "+(line.name||UI.stats[line.stat]));op.value=i;choice.append(op)});
        choice.value=String(item.stats.length>1?1:0);
        const roll=button("洗练",()=>{
          const offer=AshenForge.preview(catalog,item,Number(choice.value));
          if(offer)reviewForge(item,offer);
        });
        roll.dataset.forge="洗练";bar.append(choice,roll);
      }
      if(AshenLoot.canSalvage(bag,item))bar.append(button("分解",()=>reviewSalvage([item])));
      pane.append(bar);
    }else{
      pane.append(subtitle(focus==="hero"?"角色档案":"当前主位"));
      const current=active(),lines=hero.disc.flatMap(id=>{const it=itemFor(id);return it?Echoes.lines(it,current):[]});
      if(current)pane.append(machineInfo(current));
      else pane.append(el("b","格拉拉基础动作","ar-name"),el("p","消耗体力起跳，从敌人上方落下造成踩踏伤害。"),subtitle("加护领域"),el("p","主位空缺。击败虚数体并通过所在关卡后，可在图鉴中装备。"));
      if(lines.length){
        pane.append(subtitle("盘上词条"));
        for(const series of new Set(lines.map(line=>line.series))){
          const rows=lines.filter(l=>l.series===series),boosted=rows.filter(l=>l.boosted&&applies(l,current)).length;
          pane.append(el("div",series+"　"+rows.length+" 条"+(boosted?"　◆ "+boosted+" 条加护中":""),boosted?"ar-lit":"ar-line"));
        }
      }
      pane.append(subtitle("盘位 "+(slot+1)),el("p","拖入盘位即装入，拖回背包卸下。也可先点回响，再点目标盘位。"));
      if(itemFor(hero.disc[slot]))pane.append(button("查看当前回响",()=>choose(itemFor(hero.disc[slot]),slot)));
    }
    return pane;
  }
  function gridKey(e){
    const node=e.target.closest(".ar-tile");
    if(!node)return;
    const target=node.dataset.arTarget;
    if((e.key==="Delete"||e.key==="Backspace")&&target!==undefined){
      const i=Number(target),item=itemFor(hero.disc[i]);
      if(item){e.preventDefault();moveEcho(item,"bag",i)}
      return;
    }
    const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-10,ArrowDown:10,Home:-Infinity,End:Infinity};
    if(!(e.key in offsets))return;
    const slots=target!==undefined,list=[...root.querySelectorAll(slots?".ar-slot":"[data-bag-uid]")];
    const pos=list.indexOf(node),step=slots&&Math.abs(offsets[e.key])===10?Math.sign(offsets[e.key])*2:offsets[e.key];
    const next=list[Math.min(list.length-1,Math.max(0,pos+step))];if(next){e.preventDefault();next.focus()}
  }
  function shellEvents(shell){
    shell.ondragover=e=>{
      if(!drag)return;
      hoverDrop(e.target);
      if(!drag.target)return;
      e.preventDefault();e.dataTransfer.dropEffect="move";
    };
    shell.ondragleave=e=>{if(!shell.contains(e.relatedTarget))hoverDrop(null)};
    shell.ondrop=e=>{
      if(!drag)return;
      e.preventDefault();e.stopPropagation();
      if(e.dataTransfer.getData("application/x-ashen-echo")===drag.item.uid)finishDrop(e.target);
      else dragEnd();
    };
    shell.addEventListener("keydown",e=>{
      if(e.key!=="Escape"){gridKey(e);return}
      if(!drag&&focus!=="echo"&&tip.hidden)return;
      e.preventDefault();e.stopPropagation();
      if(drag)dragEnd();else if(focus==="echo")choose(null,slot);else hideTip();
    });
    shell.addEventListener("scroll",hideTip,true);
  }
  function draw(){
    hero=profile.hero;bag=profile.bag;
    equippedStars=GoldStars.counts(bag.items.filter(it=>hero.disc.includes(it.uid)));
    dragEnd();hideTip();
    const focusKey=document.activeElement?.dataset?.focusKey;
    const shell=el("div",undefined,"arsenal"),head=el("div",undefined,"ar-banner"),name=el("div");
    const wallet=tag("");wallet.append(EchoIcon.token("gold"),(bag.gold||0)+" 尼奥德　",EchoIcon.token("shards"),bag.shards+" 碎片");
    name.append(tag("提塔尔耶拉　／　探求者编成"),el("h2","角色与武器盘"));head.append(name,wallet,button("返回",back));
    let preview;const item=itemFor(uid),s=catalog.summons.find(x=>x.id===candidate);
    if(focus==="echo"&&item&&hero.disc[slot]!==item.uid){
      const disc=planItem(item,slot);if(!Echoes.discError(bag,disc))preview=metrics(disc);
    }
    if(focus==="machine"&&s&&Echoes.owns(hero,s.id)){
      if(active()?.id!==s.id)preview=metrics(hero.disc,s.id);
      else if(previewRemoval)preview=metrics(hero.disc,"");
    }
    const center=el("div",undefined,"ar-center");center.append(board(),bagView());
    const layout=el("div",undefined,"ar-layout"),pane=inspect();pane.append(el("div",undefined,"ar-drag-info"));
    layout.append(portraitRail(preview),center,pane);
    const status=el("div",note||profile.problem||(preview?"预览中 · 确认后保存":globalThis.Room?.running?"本关沿用入场编成，变更从下一关起生效。":"编成自动保存"),"ar-status");status.setAttribute("role","status");
    tip=el("div",undefined,"ar-tip");tip.id="arsenal-tooltip";tip.setAttribute("role","tooltip");tip.hidden=true;
    shell.append(head,layout,status,tip);shellEvents(shell);root.replaceChildren(shell);
    if(focusKey){
      const previous=[...shell.querySelectorAll("[data-focus-key]")].find(node=>node.dataset.focusKey===focusKey&&!node.disabled);
      previous?.focus({preventScroll:true});
    }
  }
  const requested=entry?.uid||entry?.itemUid;
  if(requested){
    const idx=listedItems().findIndex(it=>it.uid===requested);
    if(idx>=0){uid=requested;focus="echo";page=Math.floor(idx/pageSize);slot=Math.max(0,hero.disc.indexOf(uid))}
    else note="该回响已不在背包中。";
  }else if(entry?.summonId){
    const machine=catalog.summons.find(row=>row.id===entry.summonId);
    if(machine){candidate=machine.id;focus="machine"}
    else note="当前图鉴没有这台虚数体的资料。";
  }
  draw();
};
