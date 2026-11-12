// Defaults consumed by the browser and the local game service.
globalThis.ASHEN_CONTENT = {
  version: 9,
  worlds:[
    {id:"shore",name:"简单",level:1,riftGate:0,minPower:1,maxPower:180,hpScale:1,damageScale:1},
    {id:"lantern",name:"普通",level:2,riftGate:0,minPower:160,maxPower:399,hpScale:2,damageScale:1.3},
    {id:"current",name:"困难",level:3,riftGate:0,minPower:320,maxPower:659,hpScale:3.2,damageScale:1.89},
    {id:"crossing",name:"极难",level:4,riftGate:0,minPower:540,maxPower:800,hpScale:5.12,damageScale:2.73},
    {id:"deep",name:"深渊",level:5,riftGate:10,minPower:580,maxPower:800,hpScale:8.19,damageScale:3.96},
    {id:"stars",name:"噩梦",level:6,riftGate:20,minPower:620,maxPower:800,hpScale:13.11,damageScale:5.75},
    {id:"night",name:"炼狱",level:7,riftGate:30,minPower:650,maxPower:800,hpScale:20.97,damageScale:8.33}
  ],
  growth: Array.from({length:20},(_,index)=>({id:"growth_"+(index+1),name:"等级 "+(index+1),level:index+1,
    totalXp:12*index*(index+1),hpBonus:index,staminaBonus:index*2})),
  characters: [
    {id:"glala",sprite:"glala800006",name:"格拉拉",hp:5,move:4.5,color:"#bf905b"}
  ],
  equipment: [
    { id: "light", name: "借力轻靴", slot: "boots", weight: 4, stat: "jump", value: 0, skill: "rebound", dropWeight: 90 },
    { id: "heavy", name: "震波重靴", slot: "boots", weight: 10, stat: "fall", value: 0, skill: "wave", dropWeight: 75 },
    { id: "windstep", name: "信使短靴", slot: "boots", weight: 3, stat: "move", value: 0.35, skill: "rebound", dropWeight: 72 },
    { id: "belfry", name: "钟楼铁履", slot: "boots", weight: 9, stat: "fall", value: 3, skill: "wave", dropWeight: 34 },
    { id: "starsole", name: "摘星软底靴", slot: "boots", weight: 4, stat: "jump", value: 0.85, skill: "rebound", dropWeight: 24 },

    { id: "linen", name: "巡夜布衣", slot: "armor", weight: 1, stat: "move", value: 0.18, skill: "", dropWeight: 95 },
    { id: "gambeson", name: "渡鸦软甲", slot: "armor", weight: 2, stat: "jump", value: 0.45, skill: "", dropWeight: 78 },
    { id: "mail", name: "守门锁甲", slot: "armor", weight: 4, stat: "attack", value: 3, skill: "", dropWeight: 68 },
    { id: "slate", name: "黑岩胸甲", slot: "armor", weight: 6, stat: "fall", value: 3.5, skill: "", dropWeight: 41 },
    { id: "comet", name: "陨星肩铠", slot: "armor", weight: 5, stat: "attack", value: 5, skill: "", dropWeight: 25 },

    { id: "reed", name: "风铃坠", slot: "charm", weight: 0.2, stat: "move", value: 0.22, skill: "", dropWeight: 86 },
    { id: "quill", name: "鸦羽护符", slot: "charm", weight: 0.3, stat: "jump", value: 0.55, skill: "", dropWeight: 72 },
    { id: "plumb", name: "铅锤项坠", slot: "charm", weight: 1.5, stat: "fall", value: 2.8, skill: "", dropWeight: 59 },
    { id: "bell", name: "碎钟护符", slot: "charm", weight: 1.2, stat: "attack", value: 4, skill: "", dropWeight: 37 },
    { id: "meteor", name: "流火星核", slot: "charm", weight: 2, stat: "fall", value: 5.5, skill: "", dropWeight: 18 },

    { id: "tinband", name: "疾行锡戒", slot: "ring", weight: 0.1, stat: "move", value: 0.15, skill: "", dropWeight: 91 },
    { id: "spring", name: "弹簧指环", slot: "ring", weight: 0.3, stat: "jump", value: 0.4, skill: "", dropWeight: 76 },
    { id: "anvil", name: "铁砧印戒", slot: "ring", weight: 0.8, stat: "attack", value: 3, skill: "", dropWeight: 54 },
    { id: "stoneband", name: "坠石戒", slot: "ring", weight: 0.7, stat: "fall", value: 3.8, skill: "", dropWeight: 32 },
    { id: "dawn", name: "晨星指轮", slot: "ring", weight: 0.2, stat: "jump", value: 1.05, skill: "", dropWeight: 17 }
  ],
  skills: [
    { id: "rebound", name: "借力连跳", kind: "rebound", power: 8.4, radius: 0, threshold: 0 },
    { id: "wave", name: "震波践踏", kind: "wave", power: 0.6, radius: 1.25, threshold: 8 }
  ],
  levels: [
    { id: "courtyard", name: "克罗索斯入口", description: "水神神殿下，送信格拉拉的湿爪印从渠岸一路上了城门。", count: 3, front: "sentry", rear: "archer", dropChance: 0.75, bonusChance: 0.15, focusSlot:"boots",focusMultiplier:3 },
    { id: "foundry", name: "沉钟熔炉", description: "炉火早就熄了，铁卫还守着送矿的窄道。", count: 18, front: "forgeguard", rear: "archer", dropChance: 0.52, bonusChance: 0.25, focusSlot:"armor",focusMultiplier:3 },
    { id: "hundred", name: "百影长廊", description: "长廊里听得见弓弦响，却看不清阴影里有多少守卫。", count: 100, front: "shade", rear: "archer", dropChance: 0.40, bonusChance: 0.35, focusSlot:"charm",focusMultiplier:3 },
    { id: "stomp_trial", name: "行会演武场", description: "向右跃过石阶。暴风可以借前排跃向弓手；钢岩带着沉重的回响，落地时能击中多名守卫。", count: 4, front: "trial_guard", rear: "archer", formation:"trial_guard,archer,trial_guard,trial_guard", trialRule:"dual", trialKills:2, trialBoot1:"light", trialBoot2:"heavy", positions: "5.68, 9.67, 6.20, 6.78", dropChance: 1, bonusChance: 0.35 },
    {id:"belltower",name:"断钟圣堂",description:"旧钟楼里，水之机神苏醒了。跃过地面的震击，等装甲张开再靠近。",count:3,front:"trial_guard",rear:"bell_keeper",formation:"trial_guard,bell_keeper,trial_guard",positions:"5.8,8.2,10",dropChance:.75,bonusChance:.15},
    {id:"ember_pass",name:"灰烬栈道",description:"穿过坍塌的栈道，找出躲在石卫身后的弓手。",count:5,front:"trial_guard",rear:"archer",positions:"5.8,9,6.6,12,15",dropChance:.75,bonusChance:.18},
    {id:"crypt_bridge",name:"烬石拱桥",description:"石卫把守桥头，弓手藏在断拱后方。",count:4,front:"sentry",rear:"archer",positions:"6,9.4,6.8,13.8",dropChance:.72,bonusChance:.22}
  ],
  summons: [
    {id:"dione",name:"狄俄涅",boss:"bell_keeper",series:"绀碧",boost:.60,description:"水之机神预言未来、传递希望，挥舞利剑开辟平等与光明的道路。"},
    {id:"mnemosyne",name:"谟涅摩叙涅",boss:"thicket_keeper",series:"暴风",boost:.60,description:"风之机神联结过去、凝聚意志，掀起飓风守护过往，不畏艰难险阻。"},
    {id:"atlas",name:"亚特拉斯",boss:"forge_keeper",series:"钢岩",boost:.60,description:"地之机神维系苍穹、足踏大地，祂的臂膀庇护万物，令生灵不受侵害。"}
  ],
  chapters: [
    {id:"belfry",name:"克罗索斯旧钟楼",theme:"belfry",rooms:"courtyard,crypt_bridge,belltower",color:"#eac181",description:"克罗索斯的委托簿上夹着一枚失去光泽的塞拉斯。送信的格拉拉没能回来，泥爪印一直延伸到旧钟楼。",ending:"钟壳里滚出一枚铃铛。格拉拉听见三短一长的回声：这是失散同伴才懂的呼唤。"},
    {id:"thicket",name:"荆棘修道院",theme:"thicket",rooms:"thorn_gate,thorn_cloister,thorn_apse",color:"#8ab68d",description:"探求者在荆棘间系上布条。跟着标记穿过旧修道院，查明谁把几只格拉拉留在地下。",ending:"祭坛底下住着两只幼崽。它们抱着空宝箱，箱底压着一张通往铸炉的矿车票。"},
    {id:"forge",name:"神代铸炉",theme:"forge",rooms:"forge_lift,forge_hall,forge_throne",color:"#e38b61",description:"神代铸炉的机械守卫还在运转。失踪的领路者曾来这里给塞拉斯充能。",ending:"炉心重启。水绿色的光照出领路者留下的足迹，穿过运矿井，朝北方烽台而去。"},
    {id:"frost",name:"冰水平原的烽台",theme:"frost",rooms:"frost_wall,frost_span,frost_keep",color:"#93c6d9",description:"冰水平原尽头，堡垒的烽火已经熄灭。要接回走散的族群，必须先让塔顶的归途灯亮起来。",ending:"烽火重燃。风雪里终于传来一声「格！」，最后的回音却来自更深处的王庭。"},
    {id:"eclipse",name:"蚀月王庭",theme:"eclipse",rooms:"moon_gate,moon_gallery,moon_court",color:"#c197ca",description:"月影压住了遗迹的出口。领路者用最后一块塞拉斯守着归路，等待同伴接替。",ending:"格拉拉们把塞拉斯一块块传到王座前。归途灯尽数点亮。一枚滚烫的炉印，指向归途尽头的灰烬栈道。"},
    {id:"cinder",name:"归火之路",theme:"forge",rooms:"cinder_watch,cinder_yard,ember_pass",color:"#e79560",description:"沿运矿道送回炉印。山门尽头，红莲机神还守着最后一簇火。",ending:"炉印归位，灰烬里亮起归途灯。按 I 装上红莲主位，连续踩击可叠加灼烧。回到克罗索斯后，可从秘境之门开始下一次远征。"}
  ],
  adventures: [
    {id:"first_bell",name:"第一章 · 失声的钟楼",kind:"story",description:"探求者留下了半张委托书：去旧钟楼找一找，送信的格拉拉还没回来。",rooms:"courtyard,belltower",ending:"钟楼的机关重新转动。失散的同伴从拱门另一侧回了一声「格！」。",shards:6,keys:0},
    {id:"ash_rift",name:"小秘境 · 余烬回廊",kind:"lesser",lesserHpFactor:2.1,lootBaseFactor:1.15,description:"穿过两间战斗房，讨伐尽头的虚数体。通过房间后保留战利品，通关取得钥石。",rooms:"courtyard,ember_pass,belltower",variants:"ember_pass,crypt_bridge",ending:"裂隙平息。钟心凝成了一枚可以开启大秘境的钥石。",shards:8,keys:1},
    {id:"deep_bell",name:"大秘境 · 无尽钟渊",kind:"greater",lootBaseFactor:1.15,lootGrowth:.19,damageGrowth:.16,description:"消耗钥石限时挑战。越深处的怪物越坚韧，通关掉落带有层印的装备。",rooms:"courtyard,ember_pass,belltower",ending:"钟声抵达更深处，你在深渊石碑上留下了一道刻痕。",shards:6,keys:0,keyCost:1,timeLimit:100,maxTier:30,hpGrowth:.22,speedGrowth:.03,tierReward:2,markPower:1}
  ],
  monsters: [
    {id:"bell_keeper",name:"裂钟守门人",kind:"bell",hp:132,speed:.18,color:"#dba960",period:2.0,warning:.9,weakTime:1.3},
    { id: "trial_guard", name: "戈仑", kind: "guard", hp: 29, speed: 0, color: "#a7967a" },
    { id: "sentry", name: "帝国近战兵", kind: "guard", hp: 46, speed: 0.32, color: "#8b9aad" },
    { id: "archer", name: "无名的射手", kind: "bow", rangedEffect:"shot", rangedPower:1, hp: 36, speed: 0, color: "#bc91a3" },
    { id: "forgeguard", name: "帝国精英", kind: "guard", combatSkills:"heavy_cut,bell_wave", hp: 58, speed: 0.42, color: "#d0966d" },
    { id: "shade", name: "仿生猎犬", kind: "guard", hp: 29, speed: 0.58, color: "#9587b3" }
  ],
  affixes: [
    { id: "fleet", name: "疾行", stat: "move", min: 0.06, max: 0.28, weight: 32 },
    { id: "springing", name: "腾跃", stat: "jump", min: 0.12, max: 0.50, weight: 27 },
    { id: "plunging", name: "坠击", stat: "fall", min: 0.5, max: 2.5, weight: 25 },
    { id: "striking", name: "重踏", stat: "attack", min: 1, max: 4, weight: 16 },
    { id: "breath", name: "回息", stat: "regen", min: 1.5, max: 4.0, weight: 20 },
    { id: "quickening", name: "疾起", stat: "haste", min: 12, max: 28, weight: 12 }
  ],
  rarities: [
    { id: "common", name: "N", weight: 54, multiplier: 1, color: "#e3e0da" },
    { id: "fine", name: "R", weight: 31, multiplier: 1.2, color: "#78aeff" },
    { id: "rare", name: "SR", weight: 12, multiplier: 1.55, color: "#f5dd57" },
    { id: "legendary", name: "SSR", weight: 2.7, multiplier: 2, color: "#ff963f" },
    { id: "unique", name: "UR", weight: .3, multiplier: 2, color: "#c4a269" }
  ]
};

const titanRows=[
  ["prometheus","普罗米修斯","fire_keeper","红莲","burn",6,1,3,0,"跃击点燃敌人；重复命中刷新燃烧，最高五层，层数越高越难继续叠加。装备主位后交替使出重剑横斩和三重喷涌。","火之机神甘忍苦痛、盗取希望，将火种播撒于世，引人们走向文明与繁荣。"],
  ["dione","狄俄涅","bell_keeper","绀碧","shot",14,1.2,1,.34,"周期性向前水平发射水箭。转身改变射向，跳跃改变射线的高度。"],
  ["mnemosyne","谟涅摩叙涅","thicket_keeper","暴风","wind",8.4,0,0,0,"起跳更快。空中再按一次跳跃可二段跳，命中头顶还能借力一次。"],
  ["atlas","亚特拉斯","forge_keeper","钢岩","earth",.6,4,0,1.55,"落地释放冲击波，命中获得护盾。回响越重，冲击越强、范围越大。"],
  ["cronus","克洛诺斯","frost_keeper","辉煌","slash",21,1.5,0,1.05,"剑光周期性扫过身边一小圈。切入近处的敌群，让剑光同时命中多人。","光之机神身正影直，守望英雄们的归宿，所执之剑不带迷茫。"],
  ["hecate","赫卡忒","eclipse_keeper","宵暗","shadow",12,.85,4,1,"起跳时留下残影，残影会寻找敌人、自行跃击。最多同时存在两道。","暗之机神手执燃火权杖，信徒呼唤祂的名讳，在神谕中步上胜利的路途。"]
];
for(const [id,name,boss,series,ability,power,period,duration,radius,abilityText,description] of titanRows){
  let row=ASHEN_CONTENT.summons.find(s=>s.id===id);if(!row){row={id,name,description,boost:.6};ASHEN_CONTENT.summons.push(row)}
  Object.assign(row,{boss,series,ability,power,period,duration,radius,abilityText});if(ability==="burn")row.burnChances="100,80,55,35,15";
}
Object.assign(ASHEN_CONTENT.summons.find(s=>s.id==="prometheus"),{combatSkills:"heavy_cut,eruption",skillPower:4});
ASHEN_CONTENT.monsters.push({id:"fire_keeper",name:"普罗米修斯",kind:"bell",hp:65,speed:.12,color:"#c45443",period:3.1,warning:1.15,weakTime:1.6});
Object.assign(ASHEN_CONTENT.levels.find(l=>l.id==="ember_pass"),{formation:"trial_guard,archer,fire_keeper",rear:"fire_keeper",positions:"5.8,9,13.4",count:3,description:"灰烬里有一串小爪印。栈道尽头，红莲机神正守着一簇火种。"});
// Stable loot IDs are independent of card titles, randomized stats and account history.
// The row order is also the address in the two artwork atlases.
globalThis.EchoEditions=(()=>{
  const rows=[
    ["light",132018,"暴风阿尔法Ⅰ型","借风"],["heavy",132012,"钢岩阿尔法Ⅰ型","沉钟"],
    ["windstep",132405,"鸟的伙伴","风迹"],["belfry",132106,"锻造时间","钟壁"],
    ["starsole",132421,"天耀星煌","摘星"],["linen",132238,"潋滟水岸","巡夜"],
    ["gambeson",132607,"月光下的守望","渡鸦"],["mail",132206,"执剑的信念","守门"],
    ["slate",132301,"矿石与浪漫","黑岩"],["comet",132024,"辉煌阿尔法Ⅰ型","陨星"],
    ["reed",132227,"音之涟漪","风铃"],["quill",132627,"破笼之鸟","鸦羽"],
    ["plumb",132318,"神眠之地·巨灵","铅锤"],["bell",132000,"红莲阿尔法Ⅰ型","碎钟"],
    ["meteor",132119,"浴炎之姿","流火"],["tinband",132628,"游走于都市之夜","疾行"],
    ["spring",132427,"飞舞精灵","弹簧"],["anvil",132304,"芬蒂亚斯之盾","铁砧"],
    ["stoneband",132503,"遗迹漫步","坠石"],["dawn",132527,"辉光所佑之人","晨星"],
    ["homeward",132409,"跃动格拉拉","归途"],
    ["mob_sentry"],["mob_archer"],["mob_shade"],["tidal_bell"]
  ];
  const byId=new Map(rows.map(([key,core,title,legacy],cell)=>[key,Object.freeze({key,core,title,legacy:legacy&&legacy+"的回响",cell})]));
  const aliases={sentry_echo:"mob_sentry",archer_echo:"mob_archer",shade_echo:"mob_shade"};
  function entry(item){
    if(!item)return;
    if(item.uniqueId && byId.has(item.uniqueId))return byId.get(item.uniqueId);
    if(item.starter||item.starterEcho||item.baseId==="tinband"&&item.name==="归途的回响")return byId.get("homeward");
    const key=item.icon||item.baseId||item.id;
    return byId.get(key)||byId.get(aliases[key]);
  }
  function title(item){const art=entry(item);return art?.legacy && item.name===art.legacy?art.title:item?.name}
  return Object.freeze({get:key=>byId.get(key),entry,title});
})();
const seriesByStat={jump:"暴风",haste:"暴风",move:"暴风",fall:"钢岩",attack:"钢岩",regen:"绀碧"};
ASHEN_CONTENT.equipment.forEach((row,i)=>{
  row.echoName=EchoEditions.get(row.id).title;
  row.series=i%4===2?"绀碧":seriesByStat[row.stat];
});
ASHEN_CONTENT.equipment.push(
  {id:"sentry_echo",name:"帝国近战兵的回响",echoName:"帝国近战兵的回响",icon:"mob_sentry",sourceMonster:"sentry",sourceChance:.45,slot:"armor",weight:.6,stat:"attack",value:2,series:"钢岩",skill:"",dropWeight:0},
  {id:"archer_echo",name:"无名的射手的回响",echoName:"无名的射手的回响",icon:"mob_archer",sourceMonster:"archer",sourceChance:.4,slot:"charm",weight:.2,stat:"regen",value:1.5,series:"绀碧",skill:"",dropWeight:0},
  {id:"shade_echo",name:"仿生猎犬的回响",echoName:"仿生猎犬的回响",icon:"mob_shade",sourceMonster:"shade",sourceChance:.4,slot:"ring",weight:.3,stat:"move",value:.18,series:"暴风",skill:"",dropWeight:0}
);
ASHEN_CONTENT.affixes.forEach(row=>row.series=seriesByStat[row.stat]);
const themed=[
  ["红莲","burnDamage","灼伤",14,30],["红莲","ailmentHit","异常命中",12,25],["红莲","burnTime","余火",.4,1],
  ["绀碧","shotDamage","水箭威力",14,30],["绀碧","shotRate","连射",6,14],["绀碧","shotSize","宽流",12,26],
  ["辉煌","slashDamage","锋刃",14,30],["辉煌","slashRate","剑光连动",6,14],["辉煌","slashSize","剑围",12,26],
  ["宵暗","petDamage","残响之牙",14,30],["宵暗","petTime","留影",.5,1.2],["宵暗","petHp","残影生命",1,2],
  ["钢岩","defense","坚壁",8,18],["钢岩","health","生机",1,2],["钢岩","waveDamage","冲击威力",12,28],["钢岩","waveSize","震域",10,24],
  ["暴风","jumpDamage","跃击",10,22]
];
for(const [series,stat,name,min,max] of themed)ASHEN_CONTENT.affixes.push({id:stat.replace(/[A-Z]/g,s=>"_"+s.toLowerCase()),name,stat,series,min,max,weight:16});
const themes={belfry:["红莲","burnDamage",14],meteor:["红莲","burnTime",.5],bell:["红莲","ailmentHit",15],linen:["绀碧","shotRate",7],reed:["绀碧","shotSize",14],mail:["绀碧","shotDamage",14],dawn:["辉煌","slashRate",7],comet:["辉煌","slashDamage",16],stoneband:["辉煌","slashSize",15],gambeson:["宵暗","petHp",1],tinband:["宵暗","petTime",.6],quill:["宵暗","petDamage",15],slate:["钢岩","defense",12],anvil:["钢岩","waveDamage",16],plumb:["钢岩","waveSize",15],heavy:["钢岩","health",1],light:["暴风","jump",.24],starsole:["暴风","jumpDamage",12],windstep:["暴风","move",.25],spring:["暴风","haste",16]};
for(const e of ASHEN_CONTENT.equipment){if(themes[e.id]){const [series,stat,value]=themes[e.id];Object.assign(e,{series,stat,value})}}
const echoBases={boots:[2,1],armor:[1,2],charm:[2,1],ring:[1,1]};
for(const item of ASHEN_CONTENT.equipment){
  [item.baseAttack,item.baseHealth]=echoBases[item.slot];
}
const advancedStats=new Set(["haste","ailmentHit","burnTime","shotRate","shotSize","jumpDamage","defense","waveSize","slashRate","slashSize","petTime"]);
for(const line of ASHEN_CONTENT.affixes)line.minTier=advancedStats.has(line.stat)?"rare":"fine";
ASHEN_CONTENT.powers=[
  {id:"wind_step",name:"逐风",quality:"legendary",kind:"air_step",weight:1,power:1,radius:0,description:"每次离地后可消耗体力额外空跳一次，可与暴风主位连用。"},
  {id:"fault",name:"裂脊",quality:"legendary",kind:"impact_ring",weight:1,power:.55,radius:1.6,description:"跃击踩中敌人时，以命中点为中心震击周围的其他敌人。"},
  {id:"tidal_blade",name:"往复潮痕",quality:"unique",kind:"return_blade",weight:1,power:8,radius:.42,description:"地面起跳时向面朝方向掷出潮刃。潮刃穿敌后折返，去程和回程可各命中同一敌人一次。"},
  {id:"first_bell",name:"叩门",quality:"legendary",kind:"opening_stomp",weight:1,power:30,radius:0,description:"直接踩击满血目标时，本击伤害提高 30%。"},
  {id:"last_breath",name:"逆息",quality:"legendary",kind:"spent_stomp",weight:1,power:35,radius:0,description:"体力越少，直接踩击伤害越高。每失去 10% 体力提高 3.5%，按当前缺口连续计算。"},
  {id:"rill_step",name:"叠泉",quality:"legendary",kind:"repeat_stamina",weight:1,power:7,radius:0,description:"连续两次直接踩伤同一目标时，从第二次起每次回复 7 点体力。换目标重新计数。"},
  {id:"knell",name:"丧钟",quality:"legendary",kind:"kill_wave",weight:1,power:.75,radius:2,description:"直接踩死非残影目标时，在落点发出震波。基础半径 2 米，基础威力为本次踩踏基础伤害的 75%，受冲击词缀加成。"},
  {id:"mend",name:"拾烬",quality:"legendary",kind:"kill_mend",weight:1,power:10,radius:0,description:"击杀非残影目标时，回复当前已损生命的 10%。"},
];
// One tenth of a common power's draw weight per specialist power.
for(const [kind,name,power,description] of [
  ["shot_jet","破浪梭",35,"水箭飞行速度提高 35%。"],
  ["shot_reach","远汐",45,"水箭在空中的最长飞行时间延长 45%。"],
  ["shot_pierce","穿礁",1,"每支水箭可额外穿过 1 个目标，墙体仍会截断弹道。"],
  ["shot_far","长潮尺",30,"水箭飞过 3 米后，伤害提高 30%。"],
  ["shot_close","贴岸",25,"水箭在飞出 1 米内撞上目标时，伤害提高 25%。"],
  ["shot_back","分流",40,"每次发射水箭时向背后补射一箭，威力为正向水箭的 40%。"],
  ["shot_crest","三叠浪",40,"每发出第三支正向水箭，该箭威力提高 40%。"],
  ["shot_spring","汲流",3,"水箭每次实际造成伤害，回复 3 点体力。"],
  ["shot_opening","白沫",25,"水箭命中满血目标时，伤害提高 25%。"],
  ["shot_air","悬河",30,"在空中射出的水箭半径扩大 30%。"],
  ["burn_kindle","双芯",1,"首次成功点燃时额外获得 1 层燃烧，受层数上限限制。"],
  ["burn_cap","炉冠",1,"燃烧层数上限增加 1 层。新增层沿用原最高层的升层概率。"],
  ["burn_fuel","续薪",1,"再次点燃已有燃烧的目标时，刷新后的持续时间额外增加 1 秒。"],
  ["burn_hunt","追烬",25,"目标低于半血时，点燃及升层几率提高 25 个百分点。"],
  ["burn_quick","引线",50,"首次点燃后，第一跳燃烧伤害的等待时间缩短 50%。"],
  ["burn_high","炽心",30,"燃烧达到 3 层时，后续每跳伤害提高 30%。"],
  ["burn_last","回焰",45,"燃烧剩余时间不超过 1 秒时，每跳伤害提高 45%。"],
  ["burn_breath","鼓风囊",4,"已有燃烧成功增加层数时，施加者回复 4 点体力。"],
  ["burn_pack","燎营",12,"每个同时被自己点燃的其他活目标，使每跳伤害提高 12%，最多计入 3 个。"],
  ["burn_flash","火镰",35,"再次施加燃烧时，立即追加当前所有层每秒总威力的 35% 火伤。"],
  ["wave_cost","轻槌",3,"落地震波的体力消耗减少 3 点，最低 1 点。"],
  ["wave_threshold","浅震",2,"触发落地震波所需的下落速度降低 2 米/秒，最低 1 米/秒。"],
  ["wave_heavy","压舱石",35,"负重达到 10 时，震波伤害提高 35%。"],
  ["wave_guard","铸垒",30,"震波命中授予的钢岩盾，其冷却时间缩短 30%。"],
  ["wave_inner","震心",35,"震波内半径一半范围里的敌人受到的震波伤害提高 35%。"],
  ["wave_rim","裂缘",40,"震波外侧三分之一区域的敌人受到的震波伤害提高 40%。"],
  ["wave_shelter","展壁",30,"带盾时发出的震波半径扩大 30%。"],
  ["wave_wound","断层",25,"对半血以下的敌人，震波伤害提高 25%。"],
  ["wave_refund","回砧",4,"一次震波实际伤到至少两个目标时，回复 4 点体力。"],
  ["wave_third","三重锤",50,"每第三次震波的半径扩大 50%。"],
  ["wind_reserve","云阶",1,"已有空跳能力时，每次离地可用空跳增加 1 次。"],
  ["wind_frugal","薄翼",3,"主动空跳消耗减少 3 点体力，最低 1 点。"],
  ["wind_lift","拔羽",12,"主动空跳的向上初速提高 12%。"],
  ["wind_reversal","折风",20,"下落途中发动主动空跳，该次向上初速额外提高 20%。"],
  ["wind_guard","风障",6,"主动空跳可获得抵挡一次攻击的盾，冷却 6 秒，与现有护盾共用冷却。"],
  ["wind_mend","换羽",8,"用尽最后一次空跳时，回复已损生命的 8%。"],
  ["wind_edge","鹰坠",35,"主动空跳后，本次腾空的下一次有效直接踩击伤害提高 35%。"],
  ["wind_cutter","羽箭",35,"主动空跳时向面朝方向发射一支水箭，基础威力为基准踩踏的 35%。"],
  ["wind_blade","回旋翼",30,"用尽最后一次空跳时投出往返风刃，基础威力为基准踩踏的 30%。"],
  ["wind_repay","踏息",6,"主动空跳后，本次腾空的下一次有效直接踩击回复 6 点体力。"],
  ["slash_solo","决斗圈",35,"一次剑光范围内只有一个活目标时，伤害提高 35%。"],
  ["slash_crowd","破阵弧",12,"剑光范围内每多一个活目标，伤害提高 12%，最多计入三个额外目标。"],
  ["slash_rear","回身月",35,"剑光扫中身后目标时，伤害提高 35%。"],
  ["slash_repeat","留锋",25,"目标连续两轮都被剑光伤到时，后一轮对它的伤害提高 25%。"],
  ["slash_third","满月",45,"每第三轮剑光的半径扩大 45%。"],
  ["slash_breath","收锋",4,"一轮剑光实际伤到敌人后回复 4 点体力，每轮一次。"],
  ["slash_mend","饮光",8,"剑光每斩杀一个非残影目标，回复已损生命的 8%。"],
  ["slash_air","飞轮",25,"腾空时扫出的剑光半径扩大 25%。"],
  ["slash_blade","流月",40,"每第四轮剑光沿面朝方向发出往返刃，基础威力为该轮剑光的 40%。"],
  ["slash_guard","镜锋",30,"带盾时扫出的剑光伤害提高 30%。"],
  ["shadow_cap","第三道影",1,"可同时存在的残影增加 1 道，含六件套的双残影。"],
  ["shadow_quick","急行影",20,"残影每次跃向目标所需时间缩短 20%。"],
  ["shadow_reach","长爪",30,"残影落点的攻击半径扩大 30%。"],
  ["shadow_wound","困兽影",45,"残影只剩 1 点生命时，它的跃击伤害提高 45%。"],
  ["shadow_life","借时",1,"每道残影首次实际伤到目标时，寿命延长 1 秒。"],
  ["shadow_stride","渡隙",30,"残影每跳的最大水平位移提高 30%。"],
  ["shadow_third","三叩",45,"残影每第三次实际伤到目标的跃击伤害提高 45%。"],
  ["shadow_veil","薄暮",1,"残影诞生时的保护时间延长 1 秒。"],
  ["shadow_lure","诱影",2,"残影吸引攻击的距离增加 2 米，仍须比角色更靠近攻击者。"],
  ["shadow_burst","暮爆",60,"残影自然消散时，对消散位置 1.4 米内的敌人造成自身跃击威力的 60% 伤害。"],
])ASHEN_CONTENT.powers.push({id:kind,kind,name,power,description,quality:"legendary",weight:.1,radius:0});
ASHEN_CONTENT.uniques=[
  {id:"tidal_bell",name:"归潮双钟",template:"reed",powerId:"tidal_blade",fixedAffixes:"shot_damage,shot_size,springing,breath",dropWeight:1}
];
// These rows are materialized before the studio validates or serializes the default catalog.
for (const [theme, names, front, guardian, color] of [
  ["thicket",["棘门甬道","修士回廊","缠根圣坛"],"sentry","棘冠司祭","#8eb78b"],
  ["forge",["矿井升降台","炉心长厅","王印熔座"],"forgeguard","铸冠巨卫","#d69565"],
  ["frost",["雪封城垛","誓约吊桥","寒钟箭楼"],"sentry","白霜令主","#a3cdd6"],
  ["eclipse",["蚀月城门","观星长廊","无光王座"],"shade","月蚀摄政","#bb91c7"]
]) {
  const chapter=ASHEN_CONTENT.chapters.find(row=>row.theme===theme);
  const index=ASHEN_CONTENT.chapters.indexOf(chapter);
  const boss=theme+"_keeper";
  ASHEN_CONTENT.monsters.push({id:boss,name:guardian,kind:"bell",hp:Math.round((88+index*9)*1.2),speed:.18,color,period:2.2,warning:1,weakTime:1.4});
  chapter.rooms.split(",").forEach((id,i)=>{
    const last=i===2;
    ASHEN_CONTENT.levels.push({id,name:names[i],description:last?"拱门另一侧，传来机关运转的声音。":"前面的石阶上留着一串小爪印。",
      count:last?3:3+i,front,rear:last?boss:"archer",formation:last?front+","+boss+","+front:undefined,
      positions:last?"5.8,9.3,13":i===0?"5.8,8.6,12":"5.8,8.6,10.2,13.2",dropChance:.68,bonusChance:.18,focusSlot:["boots","armor","ring"][i]});
  });
}
ASHEN_CONTENT.levels.push(
  {id:"cinder_watch",name:"余烬哨站",description:"猎犬在断墙前巡逻，弓手守在后方。",count:4,front:"shade",rear:"archer",formation:"shade,shade,archer,archer",positions:"5.8,7,10.4,13.6",dropChance:.70,bonusChance:.20},
  {id:"cinder_yard",name:"运矿前庭",description:"铁卫守住通往山门的高台。",count:5,front:"forgeguard",rear:"archer",formation:"forgeguard,archer,shade,archer,forgeguard",positions:"5.8,8.4,9.4,12,14",dropChance:.70,bonusChance:.20}
);
// Encounter base HP bonus, contact damage multiplier, dropped echo base-stat multiplier.
const campaignBalance=[
  [0,1,1],[0,1,5],[85,4,13],[173,9,31],[320,22,75],[545,54,175]
];
const campaignLessons=[
  ["dione","A、D 移动，空格起跳。从上方踩中守卫，清场后穿过水门。","等弓手拉弓再起跳，越过箭线，优先踩后排射手。","借左侧残台登上机身，等潮汐肩核亮起再落击。过门解锁狄俄涅。"],
  ["mnemosyne","按 I 打开编成，可将狄俄涅设为主位。面向敌人，让水箭沿同一高度命中。","把回息或水箭词缀装入武器盘，留出体力连续越过前排。","从侧台登上机身，避开风刃，在破绽期落击风翼根部。过门解锁风机甲。"],
  ["atlas","可换上风主位。空中再按空格二段跳，调整落点踩向铁卫。","风主位踩头时按住跳跃可借力；先踩前排，再转向后排。","从左侧断桥登上双轨炮，随炮臂升高，肩核开启时跃落。过门解锁亚特拉斯。"],
  ["cronus","试用钢岩主位：在卫兵旁从高处落地，震波命中可获得一层盾。","比较轻重回响的跳高和震波范围，选能越过守卫的配装。","登上侧甲，等剑势收尽，再从上方踩中发亮的执剑腕甲。过门解锁光机甲。"],
  ["hecate","试用辉煌主位：靠近敌群，让同一次剑光扫中多名守卫。","借平台调整距离，等剑光出手后拉开，再找下一次切入点。","利用残台躲开攻击，等破绽期跃击蚀相肩核。过门解锁赫卡忒。"],
  ["prometheus","试用宵暗主位：起跳留下影仆，趁猎犬转向影仆时接近弓手。","选熟悉的主位。先处理后排，落地回体，为下一次攀登留足体力。","穿过断桥登上炉甲；等炉腕亮起，从上方落击。过门解锁普罗米修斯。"]
];
for(const [ci,chapter] of ASHEN_CONTENT.chapters.entries()){
  const [unlockSummon,...lessons]=campaignLessons[ci];
  chapter.unlockSummon=unlockSummon;
  [chapter.monsterHpBonus,chapter.monsterDamageFactor,chapter.echoBaseFactor]=campaignBalance[ci];
  chapter.rooms.split(",").forEach((id,si)=>{
    const stage=ASHEN_CONTENT.levels.find(row=>row.id===id);
    stage.monsterLevel=ci*3+si+1;
    stage.lesson=lessons[si];
  });
}
ASHEN_CONTENT.levels.find(row=>row.id==="ember_pass").storyBossHp=158;
ASHEN_CONTENT.levels.find(row=>row.id==="thorn_gate").storyFrontHp=104;
Object.assign(ASHEN_CONTENT.levels.find(row=>row.id==="thorn_cloister"),{
  storyFrontHp:99,storyRearHp:95,positions:"5.8,7.5,10.2,14"
});
Object.assign(ASHEN_CONTENT.levels.find(row=>row.id==="thorn_apse"),{
  storyFrontHp:90,positions:"6.4,14.5,8.8"
});

for(const monster of ASHEN_CONTENT.monsters){
  const boss=monster.kind==="bell";
  Object.assign(monster,{xp:boss?24:8,goldMin:boss?8:1,goldMax:boss?12:3});
}

// BEGIN verified fantasy card sources
globalThis.FANTASY_CARDS={"cards":{"132000":{"name":"红莲阿尔法Ⅰ型","tier":"rare","element":1,"cell":0},"132001":{"name":"红莲贝塔Ⅰ型","tier":"rare","element":1,"cell":1},"132002":{"name":"红莲伽玛Ⅰ型","tier":"rare","element":1,"cell":2},"132003":{"name":"红莲阿尔法Ⅱ型","tier":"legendary","element":1,"cell":3},"132004":{"name":"红莲贝塔Ⅱ型","tier":"legendary","element":1,"cell":4},"132005":{"name":"红莲伽玛Ⅱ型","tier":"legendary","element":1,"cell":5},"132006":{"name":"绀碧阿尔法Ⅰ型","tier":"rare","element":2,"cell":6},"132007":{"name":"绀碧贝塔Ⅰ型","tier":"rare","element":2,"cell":7},"132008":{"name":"绀碧伽玛Ⅰ型","tier":"rare","element":2,"cell":8},"132009":{"name":"绀碧阿尔法Ⅱ型","tier":"legendary","element":2,"cell":9},"132010":{"name":"绀碧贝塔Ⅱ型","tier":"legendary","element":2,"cell":10},"132011":{"name":"绀碧伽玛Ⅱ型","tier":"legendary","element":2,"cell":11},"132012":{"name":"钢岩阿尔法Ⅰ型","tier":"rare","element":3,"cell":12},"132013":{"name":"钢岩贝塔Ⅰ型","tier":"rare","element":3,"cell":13},"132014":{"name":"钢岩伽玛Ⅰ型","tier":"rare","element":3,"cell":14},"132015":{"name":"钢岩阿尔法Ⅱ型","tier":"legendary","element":3,"cell":15},"132016":{"name":"钢岩贝塔Ⅱ型","tier":"legendary","element":3,"cell":16},"132017":{"name":"钢岩伽玛Ⅱ型","tier":"legendary","element":3,"cell":17},"132018":{"name":"暴风阿尔法Ⅰ型","tier":"rare","element":4,"cell":18},"132019":{"name":"暴风贝塔Ⅰ型","tier":"rare","element":4,"cell":19},"132020":{"name":"暴风伽玛Ⅰ型","tier":"rare","element":4,"cell":20},"132021":{"name":"暴风阿尔法Ⅱ型","tier":"legendary","element":4,"cell":21},"132022":{"name":"暴风贝塔Ⅱ型","tier":"legendary","element":4,"cell":22},"132023":{"name":"暴风伽玛Ⅱ型","tier":"legendary","element":4,"cell":23},"132024":{"name":"辉煌阿尔法Ⅰ型","tier":"rare","element":5,"cell":24},"132025":{"name":"辉煌贝塔Ⅰ型","tier":"rare","element":5,"cell":25},"132026":{"name":"辉煌伽玛Ⅰ型","tier":"rare","element":5,"cell":26},"132027":{"name":"辉煌阿尔法Ⅱ型","tier":"legendary","element":5,"cell":27},"132028":{"name":"辉煌贝塔Ⅱ型","tier":"legendary","element":5,"cell":28},"132029":{"name":"辉煌伽玛Ⅱ型","tier":"legendary","element":5,"cell":29},"132030":{"name":"宵暗阿尔法Ⅰ型","tier":"rare","element":6,"cell":30},"132031":{"name":"宵暗贝塔Ⅰ型","tier":"rare","element":6,"cell":31},"132032":{"name":"宵暗伽玛Ⅰ型","tier":"rare","element":6,"cell":32},"132033":{"name":"宵暗阿尔法Ⅱ型","tier":"legendary","element":6,"cell":33},"132034":{"name":"宵暗贝塔Ⅱ型","tier":"legendary","element":6,"cell":34},"132035":{"name":"宵暗伽玛Ⅱ型","tier":"legendary","element":6,"cell":35},"132036":{"name":"并肩作战","tier":"legendary","element":1,"cell":36},"132037":{"name":"红莲德尔塔Ⅱ型","tier":"legendary","element":1,"cell":37},"132038":{"name":"未来冒险","tier":"legendary","element":2,"cell":38},"132039":{"name":"绀碧德尔塔Ⅱ型","tier":"legendary","element":2,"cell":39},"132040":{"name":"乐园金秋","tier":"legendary","element":3,"cell":40},"132041":{"name":"钢岩德尔塔Ⅱ型","tier":"legendary","element":3,"cell":41},"132042":{"name":"悦动音符","tier":"legendary","element":4,"cell":42},"132043":{"name":"暴风德尔塔Ⅱ型","tier":"legendary","element":4,"cell":43},"132044":{"name":"无声守护","tier":"legendary","element":5,"cell":44},"132045":{"name":"辉煌德尔塔Ⅱ型","tier":"legendary","element":5,"cell":45},"132046":{"name":"午后一刻","tier":"legendary","element":6,"cell":46},"132047":{"name":"宵暗德尔塔Ⅱ型","tier":"legendary","element":6,"cell":47},"132106":{"name":"锻造时间","tier":"legendary","element":1,"cell":48},"132110":{"name":"果报","tier":"legendary","element":1,"cell":77,"access":"通关活动长林余辉内关卡概率掉落","stage":509217,"pack":50921701,"powerId":"burn_last"},"132111":{"name":"堕入混沌","tier":"legendary","element":1,"cell":76,"access":"通关活动虚实理想城内关卡概率掉落","stage":802005,"pack":80200501,"powerId":"burn_high"},"132117":{"name":"黄雷啸天","tier":"legendary","element":1,"cell":75,"access":"通关活动雷舞苍风内关卡概率掉落","stage":806001,"pack":80600101,"powerId":"burn_quick"},"132118":{"name":"神眠之地·熔岩","tier":"legendary","element":1,"cell":72,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400006,"pack":40000601,"powerId":"burn_cap"},"132121":{"name":"彻底粉碎","tier":"legendary","element":1,"cell":55,"access":"通关幻象征伐战-阿耆尼征伐战[真源]概率掉落","stage":523001,"pack":52300101,"powerId":"fault"},"132122":{"name":"旅程伊始","tier":"legendary","element":1,"cell":56,"access":"通关幻象征伐战-阿耆尼征伐战[真源]概率掉落","stage":523001,"pack":52300101,"powerId":"first_bell"},"132127":{"name":"绘本诵读时间","tier":"legendary","element":1,"cell":73,"access":"通关英杰击退战-泰芙努特击退战[真源]概率掉落","stage":525001,"pack":52500101,"powerId":"burn_fuel"},"132128":{"name":"温泉旅行","tier":"legendary","element":1,"cell":78,"access":"通关英杰击退战-泰芙努特击退战[真源]概率掉落","stage":525001,"pack":52500101,"powerId":"burn_breath"},"132206":{"name":"执剑的信念","tier":"legendary","element":2,"cell":49},"132210":{"name":"千钧一发","tier":"legendary","element":2,"cell":57,"access":"通关活动盘旋上空的阴影内关卡概率掉落","stage":504203,"pack":21900278,"powerId":"last_breath"},"132211":{"name":"夏日笔记","tier":"legendary","element":2,"cell":61,"access":"通关活动粼粼夏色行内关卡概率掉落","stage":911039,"pack":91103901,"powerId":"shot_jet"},"132217":{"name":"海誓山盟","tier":"legendary","element":2,"cell":62,"access":"通关活动晓色誓言内关卡概率掉落","stage":809001,"pack":80900101,"powerId":"shot_reach"},"132218":{"name":"神眠之地·礼赞","tier":"legendary","element":2,"cell":70,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400014,"pack":40001401,"powerId":"shot_air"},"132221":{"name":"懒散的午后","tier":"legendary","element":2,"cell":65,"access":"通关幻象征伐战-胡尔瓦塔特征伐战[真源]概率掉落","stage":523011,"pack":52301101,"powerId":"shot_close"},"132222":{"name":"她们的闲暇时光","tier":"legendary","element":2,"cell":69,"access":"通关幻象征伐战-胡尔瓦塔特征伐战[真源]概率掉落","stage":523011,"pack":52301101,"powerId":"shot_opening"},"132227":{"name":"音之涟漪","tier":"legendary","element":2,"cell":58,"access":"通关英杰击退战-狄奥斯库洛伊击退战[真源]概率掉落","stage":525011,"pack":52501101,"powerId":"rill_step"},"132228":{"name":"月下独酌","tier":"legendary","element":2,"cell":64,"access":"通关英杰击退战-狄奥斯库洛伊击退战[真源]概率掉落","stage":525011,"pack":52501101,"powerId":"shot_far"},"132306":{"name":"少女的日常","tier":"legendary","element":3,"cell":50},"132310":{"name":"久违的对决","tier":"legendary","element":3,"cell":88,"access":"通关活动寒芒铭光内关卡概率掉落","stage":590053,"pack":21900477,"powerId":"wave_wound"},"132311":{"name":"篝火之夜","tier":"legendary","element":3,"cell":89,"access":"通关活动灼光惊岁内关卡概率掉落","stage":506201,"pack":21900667,"powerId":"wave_refund"},"132317":{"name":"星夜随想","tier":"legendary","element":3,"cell":86,"access":"通关活动雾隐星明内关卡概率掉落","stage":509171,"pack":21902015,"powerId":"wave_rim"},"132318":{"name":"神眠之地·巨灵","tier":"legendary","element":3,"cell":83,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400022,"pack":40002201,"powerId":"wave_heavy"},"132321":{"name":"鸡尾酒的新配方","tier":"legendary","element":3,"cell":68,"access":"通关幻象征伐战-麒麟征伐战[真源]概率掉落","stage":523021,"pack":52302101,"powerId":"shot_spring"},"132322":{"name":"珍视之物","tier":"legendary","element":3,"cell":87,"access":"通关幻象征伐战-麒麟征伐战[真源]概率掉落","stage":523021,"pack":52302101,"powerId":"wave_shelter"},"132323":{"name":"五方雷启","tier":"legendary","element":3,"cell":90,"access":"通关活动雷舞苍风内关卡概率掉落","stage":806004,"pack":80600401,"powerId":"wave_third"},"132327":{"name":"两人的日常","tier":"legendary","element":3,"cell":81,"access":"通关英杰击退战-埃该翁击退战[真源]概率掉落","stage":525021,"pack":52502101,"powerId":"wave_cost"},"132406":{"name":"短暂的休息","tier":"legendary","element":4,"cell":51},"132410":{"name":"掌中星火","tier":"legendary","element":4,"cell":60,"access":"通关活动灼光惊岁内关卡概率掉落","stage":506301,"pack":21900675,"powerId":"mend"},"132411":{"name":"再会的约定","tier":"legendary","element":4,"cell":99,"access":"通关活动长林余辉内关卡概率掉落","stage":509221,"pack":50922101,"powerId":"wind_blade"},"132418":{"name":"神眠之地·迷雾","tier":"legendary","element":4,"cell":95,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400030,"pack":40003001,"powerId":"wind_guard"},"132421":{"name":"天耀星煌","tier":"legendary","element":4,"cell":91,"access":"通关幻象征伐战-楼陀罗讨伐战[真源]概率掉落","stage":523031,"pack":52303101,"powerId":"wind_reserve"},"132422":{"name":"回忆中的味道","tier":"legendary","element":4,"cell":96,"access":"通关幻象征伐战-楼陀罗讨伐战[真源]概率掉落","stage":523031,"pack":52303101,"powerId":"wind_mend"},"132423":{"name":"芽月铃兰","tier":"legendary","element":4,"cell":92,"access":"通关活动恋染轻纱内关卡概率掉落","stage":801341,"pack":80134101,"powerId":"wind_frugal"},"132427":{"name":"飞舞精灵","tier":"legendary","element":4,"cell":54,"access":"通关英杰击退战-宁利勒击退战[真源]概率掉落","stage":525031,"pack":52503101,"powerId":"wind_step"},"132428":{"name":"训练结束","tier":"legendary","element":4,"cell":100,"access":"通关英杰击退战-宁利勒击退战[真源]概率掉落","stage":525031,"pack":52503101,"powerId":"wind_repay"},"132506":{"name":"落樱之宴","tier":"legendary","element":5,"cell":52},"132511":{"name":"决胜一局","tier":"legendary","element":5,"cell":101,"access":"通关活动粼粼夏色行内关卡概率掉落","stage":911045,"pack":91104501,"powerId":"slash_solo"},"132517":{"name":"梅开三枝","tier":"legendary","element":5,"cell":67,"access":"通关活动虚实理想城内关卡概率掉落","stage":802002,"pack":80200201,"powerId":"shot_crest"},"132518":{"name":"神眠之地·浊光","tier":"legendary","element":5,"cell":109,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400038,"pack":40003801,"powerId":"slash_blade"},"132521":{"name":"红叶之邀","tier":"legendary","element":5,"cell":108,"access":"通关幻象征伐战-天照征伐战[真源]概率掉落","stage":523041,"pack":52304101,"powerId":"slash_air"},"132522":{"name":"午茶时间","tier":"legendary","element":5,"cell":106,"access":"通关幻象征伐战-天照征伐战[真源]概率掉落","stage":523041,"pack":52304101,"powerId":"slash_breath"},"132527":{"name":"辉光所佑之人","tier":"legendary","element":5,"cell":110,"access":"通关英杰击退战-百勒努斯击退战[真源]概率掉落","stage":525041,"pack":52504101,"powerId":"slash_guard"},"132528":{"name":"储蓄计划","tier":"legendary","element":5,"cell":104,"access":"通关英杰击退战-百勒努斯击退战[真源]概率掉落","stage":525041,"pack":52504101,"powerId":"slash_repeat"},"132606":{"name":"王座之上","tier":"legendary","element":6,"cell":53},"132617":{"name":"旧战再启","tier":"legendary","element":6,"cell":117,"access":"通关活动旧时梦影内关卡概率掉落","stage":809029,"pack":80902901,"powerId":"shadow_third"},"132618":{"name":"神眠之地·歧路","tier":"legendary","element":6,"cell":116,"access":"通关活动神狱桃源乡内关卡概率掉落","stage":400046,"pack":40004601,"powerId":"shadow_stride"},"132621":{"name":"光影之间","tier":"legendary","element":6,"cell":119,"access":"通关幻象征伐战-太阴星君讨伐战[真源]概率掉落","stage":523051,"pack":52305101,"powerId":"shadow_lure"},"132622":{"name":"秘书官的鞭策","tier":"legendary","element":6,"cell":113,"access":"通关幻象征伐战-太阴星君讨伐战[真源]概率掉落","stage":523051,"pack":52305101,"powerId":"shadow_reach"},"132623":{"name":"影居幕后","tier":"legendary","element":6,"cell":118,"access":"通关活动炎夏逐浪内关卡概率掉落","stage":509695,"pack":50969501,"powerId":"shadow_veil"},"132627":{"name":"破笼之鸟","tier":"legendary","element":6,"cell":114,"access":"通关英杰击退战-芬里尔击退战[真源]概率掉落","stage":525051,"pack":52505101,"powerId":"shadow_wound"},"132628":{"name":"游走于都市之夜","tier":"legendary","element":6,"cell":112,"access":"通关英杰击退战-芬里尔击退战[真源]概率掉落","stage":525051,"pack":52505101,"powerId":"shadow_quick"},"132823":{"name":"篝火下的舞步","tier":"legendary","element":3,"cell":82,"access":"通关活动魔境密谭·维斯菲拉特之贤者内关卡概率掉落","stage":509320,"pack":50932001,"powerId":"wave_threshold"},"132923":{"name":"崇光之护","tier":"legendary","element":3,"cell":84,"access":"通关活动魔境密谭·维斯菲拉特之贤者内关卡概率掉落","stage":509324,"pack":50932401,"powerId":"wave_guard"},"133001":{"name":"狂乱之爪","tier":"legendary","element":1,"cell":74,"access":"通关活动紫微歼星战·贪狼内关卡概率掉落","stage":551013,"pack":22700320,"powerId":"burn_hunt"},"133002":{"name":"星之桎梏","tier":"legendary","element":2,"cell":63,"access":"通关活动紫微歼星战·文曲内关卡概率掉落","stage":551113,"pack":21900930,"powerId":"shot_pierce"},"133003":{"name":"钢之天灾","tier":"legendary","element":3,"cell":85,"access":"通关活动紫微歼星战·巨门内关卡概率掉落","stage":551213,"pack":21901071,"powerId":"wave_inner"},"133004":{"name":"夜曲徜徉","tier":"legendary","element":4,"cell":93,"access":"通关活动紫微歼星战·禄存内关卡概率掉落","stage":551313,"pack":21901268,"powerId":"wind_lift"},"133005":{"name":"热情之光","tier":"legendary","element":5,"cell":107,"access":"通关活动紫微歼星战·武曲内关卡概率掉落","stage":551413,"pack":21901398,"powerId":"slash_mend"},"133006":{"name":"白梦之灯","tier":"legendary","element":6,"cell":115,"access":"通关活动紫微歼星战·廉贞内关卡概率掉落","stage":551513,"pack":21900741,"powerId":"shadow_life"},"133023":{"name":"似曾相识","tier":"legendary","element":1,"cell":80,"access":"通关活动境界线上的探求者内关卡概率掉落","stage":817044,"pack":81704401,"powerId":"burn_flash"},"133123":{"name":"苏醒时分","tier":"legendary","element":1,"cell":71,"access":"通关活动境界线上的探求者内关卡概率掉落","stage":817049,"pack":81704901,"powerId":"burn_kindle"},"133323":{"name":"封魔之刃","tier":"legendary","element":5,"cell":102,"access":"通关活动魔境密谭·奥雷利安之圣咏内关卡概率掉落","stage":818090,"pack":81809001,"powerId":"slash_crowd"},"133723":{"name":"雾岛惊魂夜","tier":"legendary","element":6,"cell":120,"access":"通关活动雾梦明珠内关卡概率掉落","stage":824000,"pack":82400001,"powerId":"shadow_burst"},"133823":{"name":"在你身边","tier":"legendary","element":6,"cell":111,"access":"通关活动雾梦明珠内关卡概率掉落","stage":824010,"pack":82401001,"powerId":"shadow_cap"},"134023":{"name":"月下往昔","tier":"legendary","element":5,"cell":105,"access":"通关活动不夜尘嚣内关卡概率掉落","stage":848043,"pack":82904201,"powerId":"slash_third"},"134123":{"name":"舞之邀","tier":"legendary","element":5,"cell":103,"access":"通关活动不夜尘嚣内关卡概率掉落","stage":848048,"pack":82904701,"powerId":"slash_rear"},"134223":{"name":"重逢之祝","tier":"legendary","element":2,"cell":66,"access":"通关活动泪之终焉·断孽千年之挽歌内关卡概率掉落","stage":832045,"pack":83204501,"powerId":"shot_back"},"134323":{"name":"灾厄陨灭","tier":"legendary","element":2,"cell":59,"access":"通关活动泪之终焉·断孽千年之挽歌内关卡概率掉落","stage":832050,"pack":83205001,"powerId":"knell"},"134823":{"name":"单独小聚","tier":"legendary","element":1,"cell":79,"access":"通关活动星鲨奇遇内关卡概率掉落","stage":854015,"pack":85401501,"powerId":"burn_pack"},"135123":{"name":"蔷薇剑圣","tier":"legendary","element":4,"cell":97,"access":"通关活动蔷薇悲歌内关卡概率掉落","stage":859021,"pack":85902101,"powerId":"wind_edge"},"135423":{"name":"修行中的重逢","tier":"legendary","element":4,"cell":94,"access":"通关活动蔷薇悲歌内关卡概率掉落","stage":863027,"pack":86302701,"powerId":"wind_reversal"},"135523":{"name":"滨边的神射","tier":"legendary","element":4,"cell":98,"access":"通关活动绒尾特工队内关卡概率掉落","stage":863031,"pack":86303101,"powerId":"wind_cutter"}},"fights":{"prometheus":{"hard":{"stage":521003,"pack":52100301,"ids":[132003,132004,132005,132000,132001,132002]},"origin":{"stage":521004,"pack":52100401,"ids":[132003,132004,132005,132036,132037]}},"dione":{"hard":{"stage":521013,"pack":52101301,"ids":[132009,132010,132011,132006,132007,132008]},"origin":{"stage":521014,"pack":52101401,"ids":[132009,132010,132011,132038,132039]}},"atlas":{"hard":{"stage":521023,"pack":52102301,"ids":[132015,132016,132017,132012,132013,132014]},"origin":{"stage":521024,"pack":52102401,"ids":[132015,132016,132017,132040,132041]}},"mnemosyne":{"hard":{"stage":521033,"pack":52103301,"ids":[132021,132022,132023,132018,132019,132020]},"origin":{"stage":521034,"pack":52103401,"ids":[132021,132022,132023,132042,132043]}},"cronus":{"hard":{"stage":521043,"pack":52104301,"ids":[132027,132028,132029,132024,132025,132026]},"origin":{"stage":521044,"pack":52104401,"ids":[132027,132028,132029,132044,132045]}},"hecate":{"hard":{"stage":521053,"pack":52105301,"ids":[132033,132034,132035,132030,132031,132032]},"origin":{"stage":521054,"pack":52105401,"ids":[132033,132034,132035,132046,132047]}}},"exchange":[{"trade":406010,"id":132106,"price":240,"currency":700802},{"trade":406011,"id":132206,"price":240,"currency":700802},{"trade":406012,"id":132306,"price":240,"currency":700802},{"trade":406013,"id":132406,"price":240,"currency":700802},{"trade":406014,"id":132506,"price":240,"currency":700802},{"trade":406015,"id":132606,"price":240,"currency":700802}],"carriers":{"wind_step":132427,"fault":132121,"first_bell":132122,"last_breath":132210,"rill_step":132227,"knell":134323,"mend":132410,"shot_jet":132211,"shot_reach":132217,"shot_pierce":133002,"shot_far":132228,"shot_close":132221,"shot_back":134223,"shot_crest":132517,"shot_spring":132321,"shot_opening":132222,"shot_air":132218,"burn_kindle":133123,"burn_cap":132118,"burn_fuel":132127,"burn_hunt":133001,"burn_quick":132117,"burn_high":132111,"burn_last":132110,"burn_breath":132128,"burn_pack":134823,"burn_flash":133023,"wave_cost":132327,"wave_threshold":132823,"wave_heavy":132318,"wave_guard":132923,"wave_inner":133003,"wave_rim":132317,"wave_shelter":132322,"wave_wound":132310,"wave_refund":132311,"wave_third":132323,"wind_reserve":132421,"wind_frugal":132423,"wind_lift":133004,"wind_reversal":135423,"wind_guard":132418,"wind_mend":132422,"wind_edge":135123,"wind_cutter":135523,"wind_blade":132411,"wind_repay":132428,"slash_solo":132511,"slash_crowd":133323,"slash_rear":134123,"slash_repeat":132528,"slash_third":134023,"slash_breath":132522,"slash_mend":133005,"slash_air":132521,"slash_blade":132518,"slash_guard":132527,"shadow_cap":133823,"shadow_quick":132628,"shadow_reach":132622,"shadow_wound":132627,"shadow_life":133006,"shadow_stride":132618,"shadow_third":132617,"shadow_veil":132623,"shadow_lure":132621,"shadow_burst":133723}};
// END verified fantasy card sources
