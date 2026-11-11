/* Display settled outcomes only. Selecting a room or drop never grants a reward. */
globalThis.ExpeditionReportView = (()=>{
  "use strict";
  const pageSize=8;
  const total=(rooms,field)=>rooms.reduce((sum,room)=>sum+(Number(room[field])||0),0);
  const positive=n=>n>0?"+"+n:String(n);
  const {el,button}=UI;
  function victoryPainting(chapter){
    const seal=el("figure",undefined,"report-stamp"),art=WorldFolio.landmark(chapter?.id);
    if(art)seal.append(art);
    const tag=el("figcaption","已归档");tag.prepend(WorldFolio.badge("won"));seal.append(tag);return seal;
  }
  function collect(catalog,rooms){
    const records=[];
    rooms.forEach((room,index)=>{
      for(const id of room.summons||[]){
        const machine=catalog.summons.find(row=>row.id===id);
        records.push({room,index,summon:machine||{id,name:"未知虚数体"}});
      }
      for(const item of room.items||[])records.push({room,index,item});
    });
    return records.sort((a,b)=>Number(!!b.summon)-Number(!!a.summon) ||
      (a.item&&b.item?AshenLoot.compare(b.item,a.item):0));
  }
  function location(item){
    const holder=Profile.locateEcho(item.uid);
    if(holder?.place==="bag")return {label:holder.equipped?"已装盘":"角色背包",canInspect:true};
    if(holder?.place==="shared")return {label:"共享仓库",canInspect:false};
    if(holder?.place==="other"){
      return {label:"存档 "+holder.number+" · "+holder.name+(holder.equipped?" · 已装盘":" · 背包"),canInspect:false};
    }
    // Transfers preserve the UID. Recycling is the only exit from the three bags
    // and shared vault. Older receipts without a settlement flag have no such proof.
    const known=typeof item.salvaged==="boolean" && !!item.uid && Number.isInteger(item.rank);
    if(known&&(item.format===2||item.salvaged===true))return {label:"已分解 · "+AshenLoot.salvageValue(item)+" 碎片",canInspect:false};
    return {label:known||item.salvaged===true?"已分解":"当前未持有",canInspect:false};
  }
  function picture(record,format){
    const canvas=el("canvas");
    if(record.summon)SummonArt.draw(canvas,record.summon);
    else EchoIcon.draw(canvas,record.item,format);
    canvas.setAttribute("aria-hidden","true");return canvas;
  }
  function metric(label,value,sub){
    const box=el("div",undefined,"report-metric");
    const title=el("span",label);if(label==="尼奥德"||label==="碎片")title.prepend(EchoIcon.token(label==="尼奥德"?"gold":"shards"));
    box.append(title,el("b",value));
    if(sub)box.append(el("small",sub));
    return box;
  }

  return function show(root,catalog,report,actions){
    const rooms=report.rooms||[],chapter=catalog.chapters.find(row=>row.id===report.chapterId);
    const records=collect(catalog,rooms),screen=el("section",undefined,"expedition-report");
    const banner=el("div",undefined,"report-banner"),heading=el("div",undefined,"report-heading");
    heading.append(el("small",actions.back?"探求手记　／　远征归档":"探求者导报　／　远征归档"),el("h1",actions.back?"章节收获":"章节胜利"),el("b",chapter?.name||"遗迹远征"));
    const story=el("div",undefined,"report-story"),start=rooms[0]?.number,end=rooms.at(-1)?.number;
    if(start)story.append(el("b","本次行程　"+start+(start!==end?" → "+end:""),"report-route"));
    story.append(el("p",chapter?.ending||"此次远征已结束。","report-ending"));
    if(report.unlockedWorlds?.length)story.append(el("b","关卡难度已开放　"+report.unlockedWorlds.map(CatalogRules.archivedWorldLabel).join("、"),"report-route"));
    banner.append(heading,story,victoryPainting(chapter));
    const metrics=el("div",undefined,"report-metrics");
    const bounty=total(rooms,"gold"),earnings=total(rooms,"killGold"),first=rooms[0],last=rooms.at(-1);
    const levels=first?.levelStart!==undefined && last?.levelEnd!==undefined
      ? "等级 "+first.levelStart+(last.levelEnd!==first.levelStart?" → "+last.levelEnd:""):"";
    metrics.append(
      metric("击杀",total(rooms,"kills"),"完成 "+rooms.length+" 关"),
      metric("经验",positive(total(rooms,"xp")),levels),
      metric("尼奥德",positive(bounty+earnings),"赏金 "+bounty+" · 击杀 "+earnings),
      metric("回响",records.filter(row=>row.item).length+" 件","虚数体 "+records.filter(row=>row.summon).length+" 台"),
      metric("碎片",positive(total(rooms,"shards")))
    );
    const layout=el("div",undefined,"report-layout");
    const trail=el("section",undefined,"report-trail"),trailHead=el("div",undefined,"report-section-title");
    trailHead.append(el("h2","行程记录"));
    const roomList=el("div",undefined,"report-room-list");trail.append(trailHead,roomList);
    const gallery=el("section",undefined,"report-gallery"),galleryHead=el("div",undefined,"report-section-title");
    const galleryCount=el("small");
    galleryHead.append(el("h2","战利品"),galleryCount);
    const tiles=el("div",undefined,"report-tiles"),pager=el("div",undefined,"report-pager");
    gallery.append(galleryHead,tiles,pager);
    const detail=el("section",undefined,"report-detail");detail.setAttribute("aria-live","polite");
    layout.append(trail,gallery,detail);
    const nav=el("nav",undefined,"report-nav");nav.setAttribute("aria-label",actions.back?"手记导航":"远征去向");
    if(actions.back)nav.append(button("返回手记",actions.back,"primary"));
    for(const [name,action,primary] of [["返回大地图",actions.map,false],["回到城镇",actions.town,false],["重游本章",actions.replay,false],["查看下一章",actions.next,true]]){
      if(typeof action==="function")nav.append(button(name,action,primary?"primary":""));
    }
    screen.append(banner,metrics,layout,nav);root.replaceChildren(screen);

    let roomIndex=-1,page=0,selected=null,refreshLocation=()=>{};
    function chooseRoom(i){
      roomIndex=i;page=0;selected=null;
      for(const key of roomList.children)key.setAttribute("aria-pressed",String(Number(key.dataset.room)===i));
      drawPage();
    }
    function roomKey(label,subtitle,i){
      const key=button("",()=>chooseRoom(i),"report-room");
      key.dataset.room=i;key.append(el("b",label),el("span",subtitle));return key;
    }
    roomList.append(roomKey("全部行程",rooms.length+" 关", -1));
    rooms.forEach((room,i)=>{
      roomList.append(roomKey(room.number+"　"+room.name,
        "击杀 "+room.kills+"　·　尼奥德 "+((room.gold||0)+(room.killGold||0))+"　·　经验 "+(room.xp||0),i));
    });
    function drawDetail(record){
      refreshLocation=()=>{};
      detail.hidden=!record;
      if(!record){
        detail.replaceChildren();return;
      }
      const {item,summon,room}=record,art=picture(record,"detail");
      detail.dataset.kind=summon?"summon":"echo";
      const top=el("div",undefined,"report-item-heading"),about=el("div");
      about.append(el("small",summon?"获得虚数体":UI.qualityText(item,catalog.rarities.find(t=>t.id===item.tier)?.name??item.tierName)),el("h3",summon?.name||item.name));
      const status=el("span",summon?"已收录":"","report-location");about.append(status);
      top.append(art,about);
      const source=el("p","来自 "+room.number+"　"+room.name,"report-source");
      detail.replaceChildren(el("h2","掉落详情"),top,source);
      if(summon){
        const known=catalog.summons.some(row=>row.id===summon.id);
        detail.append(el("p",summon.abilityText||summon.description||"当前图鉴没有这台虚数体的资料。"));
        if(known)detail.append(el("p","主位加护 · "+summon.series+"系词条 +"+Math.round(summon.boost*100)+"%","report-source"));
        const inspect=button("",()=>{if(known&&Echoes.owns(Profile.hero,summon.id))actions.inspect?.({summonId:summon.id})},"report-inspect");
        inspect.dataset.inspectSummon=summon.id;detail.append(inspect);
        refreshLocation=()=>{
          const owned=Echoes.owns(Profile.hero,summon.id),active=owned&&Profile.hero.summon===summon.id;
          status.textContent=active?"当前主位":owned?"已获得 · 未装备":"未收录";
          inspect.hidden=!owned||!known||typeof actions.inspect!=="function";
          inspect.textContent=active?"查看当前主位":"预览装为主位";
        };
        refreshLocation();
        return;
      }
      const monsterId=item.sourceMonster||item.monsterId||catalog.equipment.find(row=>row.id===item.baseId)?.sourceMonster;
      const monster=catalog.monsters.find(row=>row.id===monsterId);
      if(monster)source.textContent+="　／　"+monster.name;
      if(EchoIcon.origin(item))source.textContent+="　／　"+EchoIcon.origin(item);
      const stats=el("ul",undefined,"report-stats");
      if(item.baseAttack!==undefined)detail.append(el("p",UI.baseText(item)));
      if(item.power)detail.append(el("p",UI.powerText(item),"report-source"));
      for(const line of item.stats||[]){
        const li=el("li");
        li.append(el("span",[line.name,line.series].filter(Boolean).join(" · ")||"固有属性"),
          el("b",(UI.stats[line.stat]||line.stat)+" "+UI.statValue(line.stat,line.value)+UI.rangeText(line)));
        stats.append(li);
      }
      if(stats.children.length)detail.append(stats);
      const jump=button("在角色面板定位",()=>{
        if(location(item).canInspect && typeof actions.inspect==="function")actions.inspect({uid:item.uid});
        refreshLocation();
      },"report-inspect");
      detail.append(jump);
      refreshLocation=()=>{
        const where=location(item);
        status.textContent=where.label;jump.hidden=!where.canInspect||typeof actions.inspect!=="function";
      };
      refreshLocation();
    }
    function selectRecord(record){
      selected=record;
      for(const cell of tiles.children)cell.setAttribute("aria-pressed",String(cell.reportRecord===record));
      drawDetail(record);
    }
    function drawPage(){
      const visible=roomIndex<0?records:records.filter(record=>record.index===roomIndex);
      const pages=Math.max(1,Math.ceil(visible.length/pageSize));
      page=Math.max(0,Math.min(pages-1,page));
      const slice=visible.slice(page*pageSize,(page+1)*pageSize);
      galleryCount.textContent=(roomIndex<0?"全部":rooms[roomIndex].number)+"　"+visible.length+" 项";
      tiles.replaceChildren();pager.replaceChildren();
      for(const record of slice){
        const cell=button("",()=>selectRecord(record),"report-tile");
        const color=record.item?.color||"#d9bb82";
        cell.style.setProperty("--drop-color",color);
        cell.reportRecord=record;
        const type=record.summon?"虚数体":catalog.rarities.find(t=>t.id===record.item.tier)?.name??record.item.tierName;
        cell.append(picture(record),el("b",record.summon?.name||record.item.name),el("span",type));
        cell.setAttribute("aria-label",record.room.number+" "+type+" "+(record.summon?.name||record.item.name));
        tiles.append(cell);
      }
      if(!slice.length){
        const empty=el("div",undefined,"report-empty"),card=el("canvas"),note=el("div");
        GlalaArt.draw(card,null,"portrait");card.setAttribute("aria-hidden","true");
        note.append(el("h3",roomIndex<0?"本次远征没有掉落":"本关无掉落"));
        const story=roomIndex<0?chapter?.description:catalog.levels.find(level=>level.id===rooms[roomIndex].id)?.description;
        if(story)note.append(el("p",story));
        empty.append(card,note);tiles.append(empty);
      }
      if(pages>1){
        const prev=button("‹ 上一页",()=>{page--;drawPage();}),next=button("下一页 ›",()=>{page++;drawPage();});
        prev.disabled=page===0;next.disabled=page===pages-1;
        pager.append(prev,el("span",(page+1)+" / "+pages),next);
      }
      selectRecord(slice.includes(selected)?selected:slice[0]||null);
    }
    screen.addEventListener("focusin",()=>refreshLocation());
    screen.addEventListener("game-reveal",()=>refreshLocation());
    chooseRoom(-1);
  };
})();
