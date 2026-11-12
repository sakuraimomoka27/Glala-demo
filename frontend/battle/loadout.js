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
  impactDamage(speed,loadout) {
    return Math.max(1,Math.round(this.damage(speed,loadout.attack)*(loadout.jumpMultiplier||1)));
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
        return { height, speed: -body.vy, damage: this.impactDamage(-body.vy,loadout) };
    } while (body.y > 0);
    return { height, speed: null, damage: null };
  }
};
// Both actors supply their base stats and equipment sources to the same modifier resolver.
globalThis.TitanBuild={
  domains:EchoModifiers.domains,supports:EchoModifiers.supports,
  resolve(catalog,character,disc,summon,sampleWeight=0,previewItem=null){
    const equipped=Profile.bag.items.filter(item=>disc.includes(item.uid)).map(item=>item.uid===previewItem?.uid?previewItem:item);
    const effects=EchoModifiers.resolve(catalog,equipped,summon,character,summon);
    const growth=Growth.status(Profile.bag.heroes?.[character.id],catalog);
    let whiteAttack=0,weight=4+sampleWeight,whiteHealth=character.hp+growth.hpBonus;
    for(const item of equipped){
      weight+=item.weight;whiteHealth+=item.baseHealth||0;
      whiteAttack+=(item.baseAttack||0)+(item.upgradeAttack||0)+(item.riftAttack||0);
    }
    const main=MainAbilities.source(catalog,character,summon);
    const t=EchoModifiers.clamp((weight-4)/6,0,1),excess=Math.max(0,weight-10),over=excess/(10+excess);
    const build=MainAbilities.prepare(catalog,{...effects,skillBases:{},titan:summon,weight,whiteAttack,whiteHealth,
      staminaMax:(character.stamina??100)+growth.staminaBonus,regen:character.recovery??15,jumpCost:character.jumpCost??18,
      launch:9.6-1.2*t-.5*over,fall:24+21*t+24*over,move:character.move,attack:whiteAttack},main);
    build.windupTicks=Math.max(1,Math.ceil(build.windup/JumpPhysics.step));
    build.move=EchoModifiers.clamp(build.move,.5,10);
    // Landing uses actual impact damage. A rotation uses the normal-jump preview as its base.
    if(build.wave)build.skillBases.wave.power*=JumpPhysics.preview(build).damage??0;
    return build;
  }
};
globalThis.Loadout = {
  monster(catalog,row,hp,speed,machine){
    if(!row.mainAbility&&![row,machine].some(s=>s&&(s.echoSets||s.echoAffixes||s.echoPowers)))return null;
    const effects=EchoModifiers.resolve(catalog,[],machine,machine,row),power=row.skillPower??row.rangedPower??1;
    const main=MainAbilities.source(catalog,row);
    const build=MainAbilities.prepare(catalog,{...effects,skillBases:{},weight:row.echoWeight??4,whiteHealth:hp,whiteAttack:0,
      attack:power,move:speed,staminaMax:100,regen:15,jumpCost:18,launch:8,fall:24},main,power,row.skillPower??(main?.ability==="shot"?row.rangedPower:undefined));
    if(build.wave)build.skillBases.wave.power*=build.attack*build.jumpMultiplier;
    return build;
  },
  resolve(catalog,character,_legacyBoot,_useOwned,_legacySlots,preview={}){
    const hero=Profile.bag.heroes?.[character.id],disc=preview.disc??hero?.disc??[];
    const id=preview.summon!==undefined?preview.summon:Echoes.owns(hero,hero?.summon)?hero.summon:"";
    return TitanBuild.resolve(catalog,character,disc,catalog.summons?.find(s=>s.id===id),preview.sampleWeight||0,preview.item);
  }
};
