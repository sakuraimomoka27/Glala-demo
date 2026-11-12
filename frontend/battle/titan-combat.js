// Equipment and set bonuses decide when the player's shared skills fire.
globalThis.TitanCombat=(()=>{
  function create(b,width=20){
    const runtime=CombatSkills.create(width,false,b),{sets}=runtime;
    const baseStomp=()=>JumpPhysics.preview(b).damage??JumpPhysics.damage(8,b.attack);
    function ignite(e,h,p=e){runtime.main.ignite(p,e,h)}
    function land(p,h){runtime.main.land(p,{...h,baseStomp})}
    function shield(p,h){runtime.main.shield(p,h,baseStomp)}
    function clearProjectilesAndSummons(){runtime.clear()}
    return {...runtime,baseStomp,ignite,shield,land,stomp:sets.stomp,clearProjectilesAndSummons};
  }
  return {create};
})();
