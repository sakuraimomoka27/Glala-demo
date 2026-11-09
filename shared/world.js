globalThis.WorldDifficulty=(()=>{
  function lockedReason(catalog,hero,row){
    if(row.level<=3)return "";
    const missing=[];
    if((hero.chapter||0)<catalog.chapters.length)missing.push("通关全部 "+catalog.chapters.length+" 章");
    if((hero.best||0)<row.riftGate)missing.push("限时远征通关 "+row.riftGate+" 层");
    return missing.join("，");
  }
  function current(catalog,hero){
    const row=catalog.worlds.find(r=>r.level===hero.worldTier);
    return row&&!lockedReason(catalog,hero,row)?row:catalog.worlds[0];
  }
  function select(profile,catalog,level){
    if(profile.hero.run)throw Error("请先结束本次秘境，再调整遗迹潮位。");
    const row=catalog.worlds.find(r=>r.level===level);
    if(!row)throw Error("未知遗迹潮位。");
    const reason=lockedReason(catalog,profile.hero,row);
    if(reason)throw Error(reason);
    if(profile.hero.worldTier!==level)profile.commit(()=>{profile.hero.worldTier=level});
  }
  function unlocked(catalog,before,after){
    return catalog.worlds.filter(row=>lockedReason(catalog,before,row)&&!lockedReason(catalog,after,row)).map(row=>row.level+" · "+row.name);
  }
  return {current,select,lockedReason,unlocked};
})();
globalThis.WorldCampaign = (() => {
  const rooms = chapter => chapter.rooms.split(/[,，]/).map(id=>id.trim());
  function cleared(hero, chapters, ci) {
    const chapter=chapters[ci];
    if(!chapter)return 0;
    const count=rooms(chapter).length;
    const saved=hero.explored?.[chapter.id];
    if(saved!==undefined)return Math.min(count,saved);
    if(ci===0 && (hero.completed?.first_bell || hero.chapter>=1))return count;
    return ci===0 && hero.run?.definition?.id==="first_bell" ? Math.min(count-1,hero.run.step) : 0;
  }
  function allowed(hero,chapters,ci,si) {
    return Number.isInteger(ci) && Number.isInteger(si) && !!chapters[ci] && si>=0 &&
      si<rooms(chapters[ci]).length && si<=cleared(hero,chapters,ci) &&
      (ci===0 || cleared(hero,chapters,ci-1)===rooms(chapters[ci-1]).length);
  }
  function enter(profile,chapters,ci,si) {
    if(!allowed(profile.hero,chapters,ci,si)) throw Error("请先通过前一关。");
    if(profile.hero.run && profile.hero.run.definition?.kind!=="story")throw Error("请先完成或结束当前秘境。");
    const ticket={chapter:chapters[ci].id,room:rooms(chapters[ci])[si],resolved:false};
    return ticket;
  }
  function through(profile,chapters,ci,si,ticket,outcome) {
    if(ticket.resolved)return null;
    if(!outcome.win || !allowed(profile.hero,chapters,ci,si) || ticket.chapter!==chapters[ci].id || ticket.room!==rooms(chapters[ci])[si])return null;
    const receipt=profile.commit(()=>{
      const hero=profile.hero, chapter=chapters[ci], previous=cleared(hero,chapters,ci);
      hero.explored ??= {};
      hero.explored[chapter.id]=Math.max(previous,si+1);
      if(hero.run?.definition?.id==="first_bell")delete hero.run;
      const last=si+1===rooms(chapter).length,first=si===previous;
      const gold=8+(si+1)*2+ci*2;
      profile.bag.gold=(profile.bag.gold||0)+gold;
      for(const item of outcome.rewards)AshenLoot.collect(profile.bag,item);
      if(last && first){
        hero.chapter=Math.max(hero.chapter||0,ci+1);
        profile.bag.shards+=6+ci*2;
        if(ci===0){hero.completed??={};hero.completed.first_bell=true}
      }
      const receipt={gold,last,first,xp:outcome.growth?.xp??0,killGold:outcome.growth?.killGold??0,growth:outcome.growth,summons:Echoes.collectSummons(hero,outcome.summonDrops)};
      ticket.recordRoom?.(receipt);
      return receipt;
    });
    ticket.resolved=true;return receipt;
  }
  // A route has two dry lips at grade. The main path and the higher remains
  // are drawn from the same spans that the fixed-step landing check sees.
  function gorgeLayout(theme){
    const platforms=[],decks=[],route=[],hoists=[];
    const sections=[
      // length, cliff lip, lower spans, opposite shore, upper takeoff, first support
      [27,10.4,[[11.55,14.85,.53],[16.05,19.4,.76]],20.6,3.6,"truss"],
      [31,8.9,[[10.2,12.85,.65],[14.15,16.85,1.05],[18.15,21.5,.57]],22.8,4.5,"pier"],
      [29,11.1,[[12.45,15.45,.48],[16.77,20.4,.92]],21.7,3.1,"arch"],
      [33,9.4,[[10.65,13.9,.64],[15.2,18.4,1.12],[19.7,23.3,.61]],24.6,3.8,"truss"]
    ];
    let at=0;
    for(const [i,[n,lip,lower,shore,stair,kind]] of sections.entries()){
      const span=(l,r,y,art)=>({left:at+l,right:at+r,y,art});
      decks.push(span(0,lip,0,"rock"),span(shore,n,0,"rock"));
      for(const [j,[l,r,y]] of lower.entries()){
        const p=span(l,r,y,j%2?"truss":kind);platforms.push(p);route.push(p);
      }
      route.push(decks.at(-1));
      const foot=Math.min(stair,lip-6.3);
      const lifts=[[foot,foot+2,.60],[foot+3.05,lip-.65,1.32],
        [lip+.40,lower[0][1]-.30,2.02],[lower[1][0]+.06,lower[1][1]+.60,2.18]];
      if(lower.length===3)lifts.push([lower[2][0]+.20,lower[2][1]+.20,1.67]);
      for(const [j,[l,r,y]] of lifts.entries())platforms.push({...span(l,r,y,j===0?"pier":j===1?"arch":"truss"),upper:true});
      hoists.push(at+(i%2?shore+3:lip-1.35));at+=n;
    }
    const arenaStart=at,width=at+24;
    decks.push({left:at,right:width,y:0,art:"court"});
    return {scene:"gorge",theme,width,arenaStart,x:width-1.8,y:0,platforms,decks,route,hoists,
      spawnX:[7.1,27+31+7.4,arenaStart+13.4]};
  }
  function exitLayout(chapter,ci,si){
    if(chapter.id==="belfry" && rooms(chapter)[si]==="ember_pass")return gorgeLayout(chapter.theme);
    if(chapter.id==="belfry" && rooms(chapter)[si]==="courtyard"){
      const reach=32.4,streetBlock=24,streetStart=reach*3;
      const platforms=[],decks=[],route=[];
      function add(origin,left,right,y,art,main=false){
        const p={left:origin+left,right:origin+right,y,art};
        platforms.push(p);if(main)route.push(p);return p;
      }
      // Each reach begins and ends on the same low timber deck. The safe centre
      // of the next landing is within a single jump from the preceding lip.
      const spans=[
        [[13.85,16.8,.65,"float"],[17.85,21,.98,"pier"],[22.15,25.15,.64,"float"]],
        [[8.15,11.55,.47,"float"],[12.7,16.35,1.14,"trestle"],[17.55,21.3,1.57,"arcade"],[22.5,25.7,.75,"pier"]],
        [[14.55,17.15,.78,"trestle"],[18.3,21.78,1.49,"pier"],[23.05,26.45,2.16,"arcade"],[27.8,31.85,2.82,"arcade"]]
      ];
      for(let i=0;i<spans.length;i++){
        const origin=i*reach,firstEnd=[12.8,7.05,13.4][i],lastStart=[26.4,26.85,30.2][i];
        decks.push({left:origin,right:origin+firstEnd},{left:origin+lastStart,right:origin+reach});
        add(origin,3.35,5.12,.60,"float");
        for(const [left,right,y,art] of spans[i])add(origin,left,right,y,art,true);
        if(i<spans.length-1)route.push({left:origin+lastStart,right:origin+reach,y:0});
      }
      add(2*reach,26.26,27.72,1.04,"trestle");
      const waterGate={x:2*reach+30.45,y:2.82};
      for(let i=0;i<2;i++){
        const origin=streetStart+i*streetBlock;
        if(i===0){
          add(origin,8.4,11.2,.83,"balcony");add(origin,12.45,15.25,1.53,"arcade");
        }else{
          add(origin,4.5,7.5,.72,"arcade");add(origin,8.8,11.6,1.39,"balcony");
        }
      }
      return {scene:"krosos",theme:chapter.theme,reach,streetStart,streetBlock,waterGate,route,decks,
        width:streetStart+2*streetBlock,x:streetStart+2*streetBlock-1.45,y:0,platforms};
    }
    const high=(si+ci)%3;
    const platforms=high===0?[{left:15.4,right:17.4,y:.82}]:high===1?
      [{left:15.45,right:16.9,y:.68},{left:17.2,right:19.3,y:1.06}]:
      [{left:14.6,right:16.8,y:.82},{left:17.1,right:19.3,y:1.68}];
    return {x:18.65,y:high===0?0:platforms.at(-1).y,platforms,theme:chapter.theme};
  }
  return {rooms,cleared,allowed,enter,through,exitLayout};
})();
