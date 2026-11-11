globalThis.JumpPhysics = {
  step: 1/120,
  headHeight: .6,
  advance(body, loadout) {
    const gravity = body.vy > 0 ? 24 : loadout.fall;
    body.y += body.vy * this.step - .5 * gravity * this.step ** 2;
    body.vy -= gravity * this.step;
  },
  damage(speed, attack) {
    return Math.max(1, Math.round(20 + 4 * Math.max(0, Math.min(8, speed - 4)) + attack));
  },
  preview(loadout) {
    // Same fixed ticks and head crossing as a normal jump from flat ground.
    const body = { y: 0, vy: loadout.launch };
    let height = 0;
    do {
      const previous = body.y;
      this.advance(body, loadout);
      height = Math.max(height, body.y);
      if (body.vy < 0 && previous >= this.headHeight && body.y <= this.headHeight)
        return { height, speed: -body.vy, damage: Math.max(1,Math.round(this.damage(-body.vy, loadout.attack)*(loadout.jumpMultiplier||1))) };
    } while (body.y > 0);
    return { height, speed: null, damage: null };
  }
};
// Resolve once at room entry; the same pure calculation powers preview and combat.
globalThis.TitanBuild={
  domains:{burn:["burnDamage","ailmentHit","burnTime"],shot:["shotDamage","shotRate","shotSize"],earth:["waveDamage","waveSize"],slash:["slashDamage","slashRate","slashSize"],shadow:["petHp","petTime","petDamage"]},
  supports(stat,kind){const group=Object.keys(this.domains).find(key=>this.domains[key].includes(stat));return !group||group===kind},
  resolve(catalog,character,disc,summon,sampleWeight=0,previewItem=null){
    const items=Profile.bag.items.filter(item=>disc.includes(item.uid)),totals=Object.create(null);
    let weight=4+sampleWeight,whiteAttack=0,echoHealth=0;
    const stars=GoldStars.counts(items),powers={};
    for(const owned of items){
      const it=owned.uid===previewItem?.uid?previewItem:owned;
      weight+=it.weight;
      whiteAttack+=(it.baseAttack||0)+(it.upgradeAttack||0)+(it.riftAttack||0);
      echoHealth+=it.baseHealth||0;
      if(it.power && (!powers[it.power.kind]||it.power.power>powers[it.power.kind].power))powers[it.power.kind]=it.power;
      for(const l of Echoes.lines(it,summon))totals[l.stat]=(totals[l.stat]||0)+l.effective;}
    const val=k=>totals[k]||0,pct=k=>1+val(k)/100;
    const kind=summon?.ability||"",wind=kind==="wind",earth=kind==="earth";
    const shooter=kind==="shot"?summon:stars.tide>=6?catalog.summons.find(s=>s.ability==="shot"):null;
    const shadow=kind==="shadow"?summon:stars.shade>=6?catalog.summons.find(s=>s.ability==="shadow"):null;
    const growth=Growth.status(Profile.bag.heroes?.[character.id],catalog);
    const impactMass=Math.max(0,Math.min(2,(weight-4)/8));
    const t=Math.max(0,Math.min(1,(weight-4)/6)),over=Math.max(0,weight-10)/(10+Math.max(0,weight-10));
    const limit=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),power=summon?.power??0,radius=summon?.radius??0;
    const duration=summon?.duration??(kind==="shadow"?4:3),period=summon?.period??(kind==="shot"?1.2:kind==="slash"?1.5:kind==="shadow"?.85:4);
    const rate=(period,stat)=>Math.max(.30,period*(1-limit(val(stat)/100,0,.75)));
    const launch=limit(9.6-1.2*t-.5*over+(wind?.7:0)+val("jump"),7.3,15);
    const whiteHealth=character.hp+growth.hpBonus+echoHealth,blade=powers.return_blade;
    const baseMaxHp=Math.max(1,whiteHealth+Math.floor(val("health")));
    return {titan:summon,kind,weight,whiteAttack,whiteHealth,powers,stars,baseMaxHp,maxHp:(stars.stone>=2?Math.floor(baseMaxHp*115/100):baseMaxHp),defense:limit((val("defense")+(powers.stone?.power||0))/100,0,.7),
      windupTicks:Math.max(1,Math.ceil(((wind?44:68)-val("haste"))/(1000*JumpPhysics.step))),
      staminaMax:(character.stamina??100)+growth.staminaBonus+(stars.tide>=2?20:0),regen:(character.recovery??15)+val("regen")+(powers.tide?.power||0),jumpCost:Math.max(1,(character.jumpCost??18)-(powers.wind?.power||0)),reboundCost:8,waveCost:6,
      launch,fall:limit(24+21*t+24*over+val("fall"),8,75),move:limit(character.move+(wind?.7:0)+val("move")+(stars.wind>=2?.6:0),.5,10),
      attack:whiteAttack+val("attack"),jumpMultiplier:1+(val("jumpDamage")+(powers.light?.power||0)+(stars.ember>=2?10:0))/100,extraJumps:(wind?1:0)+(powers.air_step?1:0)+(stars.wind>=4?1:0),
      bladeDamage:blade?(blade.power+.65*whiteAttack)*pct("shotDamage"):0,bladeSize:blade?limit(blade.radius*pct("shotSize"),.12,1.5):0,
      rebound:wind?{name:"暴风借力",power,threshold:0}:null,wave:earth?{name:"钢岩冲击",power:power*pct("waveDamage")*(.52+impactMass*.88),radius:limit(radius*pct("waveSize")*(.52+impactMass*.64),.2,4),threshold:8}:null,
      shieldPeriod:stars.stone>=6?4:earth?(summon.period??4):0,burnDamage:kind==="burn"?power*pct("burnDamage"):0,burnTime:kind==="burn"?limit(duration+val("burnTime"),.5,12):0,burnChances:kind==="burn"?(summon.burnChances||"100,80,55,35,15").split(/[,，]/).map(n=>limit(Number(n)/100,0,1)):[],ailmentHit:limit(val("ailmentHit")/100,0,1),
      shotDamage:shooter?(shooter.power+.65*whiteAttack)*pct("shotDamage"):0,shotPeriod:shooter?rate(shooter.period??1.2,"shotRate"):0,shotSize:shooter?limit(shooter.radius*pct("shotSize"),.08,1.5):0,
      slashDamage:kind==="slash"?(power+.85*whiteAttack)*pct("slashDamage"):0,slashPeriod:kind==="slash"?rate(period,"slashRate"):0,slashRadius:kind==="slash"?limit(radius*pct("slashSize"),.2,2.4):0,
      shadowDamage:shadow?(shadow.power+(stars.shade>=6?.6*whiteAttack:0))*pct("petDamage"):0,shadowLife:shadow?limit((shadow.duration??4)+val("petTime"),.5,12):0,
      shadowHp:shadow?2+Math.floor(val("petHp")):0,shadowPeriod:shadow?Math.max(.35,shadow.period??.85):0,shadowRadius:shadow?shadow.radius:0};
  }
};
globalThis.Loadout = {
  resolve(catalog,character,_legacyBoot,_useOwned,_legacySlots,preview={}){
    const hero=Profile.bag.heroes?.[character.id],disc=preview.disc??hero?.disc??[];
    const id=preview.summon!==undefined?preview.summon:Echoes.owns(hero,hero?.summon)?hero.summon:"";
    return TitanBuild.resolve(catalog,character,disc,catalog.summons?.find(s=>s.id===id),preview.sampleWeight||0,preview.item);
  }
};
