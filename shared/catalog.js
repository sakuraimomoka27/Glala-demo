globalThis.CatalogRules = (() => {
// The editor uses this same field list to build its forms and dropdowns.
const idAndName = [
  { key: "id", label: "固定 ID", type: "text" },
  { key: "name", label: "名称", type: "text" }
];
const number = (key, label, min, max) => ({ key, label, type: "number", min, max });
const ref = (key, label, table) => ({ key, label, type: "ref", ref: table });
const choice = (key, label, options) => ({ key, label, type: "select", options });
const color = { key: "color", label: "像素色", type: "color" };
const stat = choice("stat", "属性", EchoModifiers.statIds);

const formerWorldNames={shore:"巡岸",lantern:"循灯",current:"探潮",crossing:"渡隙",deep:"沉渊",stars:"逆星",night:"尽夜"};
function worldName(world){
  if(formerWorldNames[world.id]===world.name){
    return globalThis.ASHEN_CONTENT.worlds.find(row=>row.id===world.id)?.name??world.name;
  }
  return world.name;
}
// Older expedition reports stored the rendered unlock label instead of the world id.
function archivedWorldLabel(label){
  const world=globalThis.ASHEN_CONTENT.worlds.find(row=>label===row.level+" · "+formerWorldNames[row.id]);
  return world?world.level+" · "+world.name:label;
}
const mainAbility={...ref("mainAbility","固有主位能力（引用虚数体）","summons"),optional:true};
const fieldAttack={...choice("fieldAttack","普通攻击出手方式",Object.keys(FieldCombat.profiles)),optional:true};
const combatSkills={key:"combatSkills",label:"战斗技能顺序",type:"skillList",optional:true};
const echoSets={key:"echoSets",label:"固有回响套装（套装 ID:件数）",type:"echoSets",optional:true};
const echoAffixes={key:"echoAffixes",label:"固有回响词条（词条 ID 或 ID:数值）",type:"echoAffixes",refList:"affixes",optional:true};
const echoPowers={key:"echoPowers",label:"固有回响威能（威能 ID）",type:"echoPowers",refList:"powers",optional:true};
const skillPower={...number("skillPower","技能基础伤害",.01,1000),optional:true};
const skillInterval={...number("skillInterval","技能轮转间隔（秒）",.1,60),optional:true};
const schema = {
  worlds:[...idAndName,number("level","难度阶数",1,30),number("riftGate","所需大秘境通关层数",0,100),
    number("minPower","掉落强度下限",1,800),number("maxPower","掉落强度上限",1,800),
    number("hpScale","怪物生命倍率",1,50),number("damageScale","怪物伤害倍率",1,50)],
  growth:[...idAndName,number("level","等级",1,100),number("totalXp","达到此级所需累计经验",0,10000000),
    number("hpBonus","相对一级的生命上限增量",0,1000),number("staminaBonus","相对一级的体力上限增量",0,2000)],
  characters: [mainAbility,fieldAttack,combatSkills,echoSets,echoAffixes,echoPowers,skillPower,skillInterval,
    ...idAndName, choice("sprite","角色形象",["glala800006","witch","knight","scout"]), number("hp", "生命", 1, 100), number("move", "移动速度（米/秒）", 0.1, 15),
    {...ref("boot", "旧版初始装备", "equipment"),optional:true}, color,
    {...number("stamina","体力上限",30,500),optional:true},{...number("recovery","每秒回体",3,100),optional:true},{...number("jumpCost","起跳体力",1,30),optional:true}
  ],
  equipment: [
    number("baseAttack","回响固定攻击",1,100),number("baseHealth","回响固定生命",1,100),
    ...idAndName, {key:"icon",label:"回响图像 ID",type:"text",optional:true},{...ref("sourceMonster","限定掉落怪物","monsters"),optional:true},{...number("sourceChance","小怪回响掉率",0,1),optional:true},{key:"echoName",label:"掉落回响名称",type:"text",optional:true},{key:"series",label:"固定技能系列",type:"text",optional:true},choice("slot", "掉落分组", ["boots", "armor", "charm", "ring"]),
    number("weight", "装备负重", 0, 30), {...stat,label:"底材偏好属性"}, number("value", "偏好属性掷值下限", 0, 100),
    {...number("upgradeCap","强化上限（默认 3）",0,10),optional:true},
    {...number("upgradePower","每级攻击白值（默认 2）",0,30),optional:true},
    {...number("upgradeCost","强化费用基数（默认 4 碎片）",1,100),optional:true},
    ref("skill", "附带技能（可空）", "skills"), number("dropWeight", "掉落权重", 0, 10000)
  ],
  skills: [
    ...idAndName, choice("kind", "技能机制", ["rebound", "wave"]),
    number("power", "反弹初速 / 震波倍率", 0.01, 30),
    number("radius", "震波半径（米）", 0, 20), number("threshold", "触发落速（米/秒）", 0, 50)
  ],
  levels: [
    ...idAndName, { key: "description", label: "关卡说明", type: "text" },
    {...number("monsterLevel","剧情怪物等级",1,60),optional:true},
    {...number("storyBossHp","剧情首领基础生命",1,10000),optional:true},
    {...number("storyFrontHp","剧情前排基础生命",1,10000),optional:true},
    {...number("storyRearHp","剧情后排普通怪基础生命",1,10000),optional:true},
    {key:"lesson",label:"剧情操作引导",type:"text",optional:true},
    { key: "positions", label: "敌人横坐标（米，逗号分隔；留空自动布阵）", type: "text" },
    {key:"formation",label:"怪物 ID 顺序（逗号分隔，循环布阵）",type:"text",optional:true,refList:"monsters"},
    {...choice("trialRule","验收目标",["none","dual","chain","multi"]),optional:true},
    {...number("trialKills","单踏击杀目标数",1,100),optional:true},
    {...ref("trialBoot1","暴风演练参照","equipment"),optional:true,bootsOnly:true},
    {...ref("trialBoot2","钢岩演练参照","equipment"),optional:true,bootsOnly:true},
    {...choice("focusSlot","偏好掉落部位",["boots","armor","charm","ring"]),optional:true},
    {...number("focusMultiplier","偏好部位权重倍率",1,20),optional:true},
    number("count", "同时入场数", 1, 100), ref("front", "前排怪物", "monsters"),
    ref("rear", "后排怪物", "monsters"), number("dropChance", "首次掉落概率（0–1）", 0, 1),
    number("bonusChance", "额外掉落概率（0–1）", 0, 1)
  ],
  summons:[combatSkills,echoSets,echoAffixes,echoPowers,skillPower,skillInterval,...idAndName,{...choice("ability","主位能力",["burn","shot","wind","earth","slash","shadow"]),optional:true},{key:"abilityText",label:"固有能力说明",type:"text",optional:true},{key:"burnChances",label:"按层燃烧命中率（%），最多 8 层",type:"text",optional:true},...[["power","基础威力"],["period","间隔/冷却（秒）"],["radius","范围（米）"],["duration","持续（秒）"]].map(([k,t])=>({...number(k,t,0,100),optional:true})),{...ref("boss","对应掉落 Boss","monsters"),optional:true},{...number("dropChance","首次机体掉率",0,1),optional:true},{key:"portrait",label:"机体形象 ID",type:"text",optional:true},{key:"series",label:"加护系列",type:"text"},number("boost","技能增幅（0.6 为 +60%）",0,5),{key:"description",label:"虚数体档案",type:"text"}],
  chapters: [
    ...idAndName, color, choice("theme","区域景观",["belfry","thicket","forge","frost","eclipse"]),
    {...ref("unlockSummon","章末解锁机甲","summons"),optional:true},
    {...number("monsterHpBonus","章节怪物基础生命加成（首领双倍）",0,10000),optional:true},
    {...number("monsterDamageFactor","章节怪物伤害倍率",0.1,1000),optional:true},
    {...number("echoBaseFactor","章节掉落装备攻血倍率",1,1000),optional:true},
    {key:"rooms",label:"关卡 ID（按解锁顺序）",type:"text",refList:"levels"},
    {key:"description",label:"章节引言",type:"text"},{key:"ending",label:"通章叙事",type:"text"}
  ],
  adventures: [
    ...idAndName,choice("kind","冒险类型",["story","lesser","greater"]),
    {key:"description",label:"营地委托",type:"text"},
    {key:"rooms",label:"有序房间 ID（逗号分隔）",type:"text",refList:"levels"},
    {key:"variants",label:"可抽取的中间房间 ID",type:"text",refList:"levels",optional:true},
    {key:"ending",label:"通关叙事",type:"text"},
    number("shards","通关碎片",0,1000),number("keys","通关钥石",0,20),
    {...number("keyCost","消耗钥石",1,10),optional:true},
    {...number("timeLimit","挑战秒数",5,1800),optional:true},
    {...number("maxTier","最高层",1,100),optional:true},
    {...number("lesserHpFactor","小秘境相对末关生命倍率",1,100),optional:true},
    {...number("lootBaseFactor","秘境起始掉落相对末章底材倍率",1,100),optional:true},
    {...number("lootGrowth","大秘境逐层掉落底材增幅",0,3),optional:true},
    {...number("damageGrowth","大秘境逐层伤害增幅",0,3),optional:true},
    {...number("hpGrowth","大秘境逐层生命增幅",0,3),optional:true},
    {...number("speedGrowth","每层移速增幅",0,1),optional:true},
    {...number("tierReward","每层追加碎片",0,100),optional:true},
    {...number("markPower","每层层印伤害",0,10),optional:true}
  ],
  monsters: [mainAbility,fieldAttack,combatSkills,echoSets,echoAffixes,echoPowers,skillPower,{...number("echoWeight","套装判定负重（默认 4）",0,300),optional:true},
    ...idAndName, choice("kind", "行为", ["guard", "bow","bell"]), number("hp", "生命", 1, 10000),
    {...choice("rangedEffect","弓手射击效果（原生弓手留空时用已激活的水箭，否则用普通箭）",Object.keys(ProjectileEffects.definitions)),optional:true},
    {...number("rangedPower","弓手基础伤害（默认 1）",.01,100),optional:true},
    number("speed", "移动速度（米/秒）", 0, 15), color,
    {...number("xp","击杀经验",0,10000),optional:true},{...number("goldMin","击杀尼奥德下限",0,10000),optional:true},
    {...number("goldMax","击杀尼奥德上限",0,10000),optional:true},
    {...choice("bossStyle","首领招式组（留空跟随机体）",["burn","shot","wind","earth","slash","shadow"]),optional:true},
    {...number("bossScale","首领战场大小倍率",.85,1.25),optional:true},
    {...number("bossOpener","起手招式（1 或 2）",1,2),optional:true},
    {...number("period","首领两轮间隔（秒）",.3,30),optional:true},
    {...number("warning","首领招式预警（秒）",.2,5),optional:true},
    {...number("weakTime","弱点时间（秒）",.2,10),optional:true}
  ],
  rarities: [
    ...idAndName, number("weight", "品质权重", 0, 10000),
      number("multiplier", "旧版存档迁移倍率", 0.1, 10), color
  ],
  affixes: [
    choice("minTier","最低可出品质",["fine","rare"]),
    ...idAndName, stat, {key:"series",label:"词条系列",type:"text",optional:true}, number("min", "随机下限", 0, 100), number("max", "随机上限", 0, 100),
    number("weight", "词条权重", 0, 10000)
  ],
  powers:[...idAndName,choice("quality","威能品质",["legendary","unique"]),choice("kind","行为",["air_step","impact_ring","return_blade","opening_stomp","spent_stomp","repeat_stamina","kill_wave","kill_mend",...EchoModifiers.machineKinds]),
    number("weight","抽取权重",0,10000),number("power","威力或次数",.01,100),number("radius","半径（米）",0,6),
    {key:"description",label:"威能描述",type:"text"}],
  uniques:[...idAndName,ref("template","回响底材","equipment"),ref("powerId","专属特效","powers"),
    {key:"fixedAffixes",label:"固定词缀 ID（逗号分隔）",type:"text",refList:"affixes"},number("dropWeight","UR 相对权重",0,10000)]
};

const tableLabels = {
  worlds:"关卡难度",powers:"威能",uniques:"UR 回响",growth:"等级成长",summons:"虚数体", chapters:"世界章节", adventures:"冒险", characters: "角色", equipment: "装备", skills: "技能", levels: "关卡",
  monsters: "怪物", rarities: "品质", affixes: "词条"
};
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const reserved = new Set([...Object.getOwnPropertyNames(Object.prototype), "prototype"]);
const splitIds = value => value.split(/[,，]/).map(id=>id.trim());

function fieldError(table, row, field, indices) {
  const value = row[field.key];
  if(field.optional && (value===undefined || value===""))return "";
  if(field.key==="fieldAttack"&&row.kind==="bell")return "普通攻击出手方式适用于近战怪和弓手";
  if(field.type==="echoSets"){
    try{EchoSets.parse(value);return ""}catch(error){return error.message}
  }
  if(field.type==="echoAffixes"||field.type==="echoPowers"){
    try{
      const refs=EchoModifiers.entries(value,field.type==="echoAffixes");
      const bad=refs.find(({id})=>!indices[field.refList]?.has(id));
      return bad?"引用了不存在的"+tableLabels[field.refList]+"「"+bad.id+"」":"";
    }catch(error){return error.message}
  }
  if(field.type==="skillList"){
    if(typeof value!=="string")return "须为技能 ID 列表";
    const invalid=splitIds(value).find(id=>!CombatSkills.ids.includes(id));
    return invalid===undefined?"":"包含无效技能「"+invalid+"」";
  }
  if(field.key==="burnChances"){const rates=typeof value==="string"?value.split(/[,，]/).map(v=>v.trim()!==""?Number(v):NaN):[];return rates.length>=1&&rates.length<=8&&rates.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=100&&(i===0||n<=rates[i-1]))?"":"须为从高到低的 1～8 个百分数"}
  if(field.refList){
    if(typeof value!=="string")return "须为逗号分隔的 ID";
    const ids=splitIds(value);
    if(table==="chapters" && new Set(ids).size!==ids.length)return "章节内不能重复引用同一关卡";
    if(field.refList==="levels" && ids.length>12)return "最多支持 12 个房间";
    if(ids.length>row.count)return "阵形长度不能超过入场人数";
    const bad=ids.find(id=>!indices[field.refList].has(id));
    return bad===undefined?"":"引用了不存在的"+tableLabels[field.refList]+"「"+bad+"」";
  }
  if (table === "levels" && field.key === "positions") {
    if (value === undefined || value === "") return "";
    if (typeof value !== "string") return "须为逗号分隔的坐标";
    const cells = value.split(/[,，]/);
    if (cells.length !== row.count) return "坐标数须与入场数相同";
    return cells.every(cell => cell.trim() && Number.isFinite(Number(cell)) && Number(cell) >= .55 && Number(cell) <= 19.3)
      ? "" : "每个坐标须在 0.55～19.3 米之间";
  }
  if (table === "characters" && field.key === "sprite" && value === undefined) return "";
  if (field.type === "number") {
    if (!Number.isFinite(value) || value < field.min || value > field.max)
      return `须为 ${field.min}～${field.max} 内的数值`;
    if (["monsterLevel","storyBossHp","storyFrontHp","storyRearHp","bossOpener","hp","count","trialKills","shards","keys","upgradeCost","upgradeCap","maxTier","timeLimit","keyCost","tierReward","level","totalXp","hpBonus","staminaBonus","xp","goldMin","goldMax"].includes(field.key) && !Number.isInteger(value)) return "须为整数";
    return "";
  }
  if (table === "equipment" && field.key === "skill" && value === "") return "";
  if (typeof value !== "string" || !value.trim()) return "不能为空";
  if (field.key === "id" && (!/^[a-z][a-z0-9_-]{0,47}$/.test(value) || reserved.has(value)))
    return "须为 1～48 位小写字母、数字、下划线或连字符，以字母开头且避开保留名";
  if (field.type === "text" && value.length > (["description","ending","abilityText","lesson"].includes(field.key) ? 256 : 48))
    return "文本过长";
  if (field.type === "color" && !/^#[\da-f]{6}$/i.test(value)) return "须为六位十六进制颜色";
  if (field.type === "select" && !field.options.includes(value))
    return `请选择 ${field.options.join(" / ")}`;
  if (field.type === "ref") {
    const target = indices[field.ref].get(value);
    if (!target) return `引用了不存在的${tableLabels[field.ref]}「${value}」`;
    if(field.key==="mainAbility"&&!target.ability&&!globalThis.ASHEN_CONTENT.summons.some(s=>s.id===target.id&&s.ability))
      return "须引用已配置主位能力的虚数体";
    if ((field.bootsOnly || table === "characters" && field.key === "boot") && target.slot !== "boots")
      return "须引用靴子部位";
  }
  return "";
}

function validateCatalog(catalog) {
  if (!record(catalog)) return ["配置根节点须为对象"];
  const errors = [];
  const indices = {};
  const oldLoot=catalog.powers===undefined&&catalog.uniques===undefined;
  if (![1,2,3,4,5,6,7,8,9].includes(catalog.version)) errors.push("配置版本须为 1 至 9 的整数");
  for (const key of Object.keys(catalog))
    if (key !== "version" && !Object.hasOwn(schema, key)) errors.push(`未知配置表「${key}」`);

  // Resolve references in a second pass so table order does not matter.
  for (const table of Object.keys(schema)) {
    const rows = catalog[table];
    const index = new Map();
    indices[table] = index;
    if(oldLoot&&["powers","uniques"].includes(table))continue;
    if(["adventures","chapters","summons","growth","worlds"].includes(table) && rows===undefined)continue; // Older studio catalogs are extended on load.
    if (!Array.isArray(rows) || !rows.length) {
      errors.push(`${tableLabels[table]}表至少需要一条记录`);
      continue;
    }
    for (const [position, row] of rows.entries()) {
      const location = `${tableLabels[table]} · 第 ${position + 1} 行`;
      if (!record(row)) { errors.push(`${location} 须为对象`); continue; }
      if (index.has(row.id)) errors.push(`${location} 的 ID「${row.id}」重复`);
      index.set(row.id, row);
    }
  }

  for (const [table, fields] of Object.entries(schema)) {
    const rows = catalog[table];
    if (!Array.isArray(rows)) continue;
    const keys = new Set(fields.map(field => field.key));
    for (const [position, row] of rows.entries()) {
      if (!record(row)) continue;
      const location = `${tableLabels[table]} · 第 ${position + 1} 行`;
      for (const field of fields) {
        if(oldLoot && ["baseAttack","baseHealth","minTier"].includes(field.key) && row[field.key]===undefined)continue;
        const error = fieldError(table, row, field, indices);
        if (error) errors.push(`${location} · ${field.label}${error}`);
      }
      for (const key of Object.keys(row))
        if (!keys.has(key)) errors.push(`${location} 包含未知字段「${key}」`);
      if(table==="monsters" && row.goldMax<row.goldMin)errors.push(location+" 尼奥德上限须大于等于下限");
      if(table==="worlds"){
        const previous=rows[position-1];
        if(row.level!==position+1||![row.minPower,row.maxPower,row.riftGate].every(Number.isInteger))errors.push(location+" 难度须连续，强度及门槛须为整数");
        if(row.minPower>row.maxPower||row.maxPower>(row.level<=2?399:row.level===3?659:800))errors.push(location+" 掉落强度超出该难度允许范围");
        if(row.level>=4&&row.maxPower<660)errors.push(location+" 第四档起须能产出源铸回响");
        if(row.level>4&&previous&&(row.minPower<=previous.minPower||row.maxPower<previous.maxPower))errors.push(location+" 高阶难度须提升掉落强度下限并保持或提高上限");
        if(row.level<=4?row.riftGate!==0:!(row.riftGate>(previous?.riftGate??0)))errors.push(location+" 前四档秘境门槛须为零，后续门槛须逐档提升");
      }
      if(table==="equipment" && [row.baseAttack,row.baseHealth].some(v=>v!==undefined&&!Number.isInteger(v)))errors.push(location+" 白值须为整数");
      if(table==="growth"){
        if(row.level!==position+1)errors.push(location+" 等级须从 1 开始连续排列");
        if(position===0 && (row.totalXp!==0||row.hpBonus!==0||row.staminaBonus!==0))errors.push(location+" 一级的累计经验及属性增量须为零");
        const previous=rows[position-1];
        if(previous && (row.totalXp<=previous.totalXp || row.hpBonus<previous.hpBonus || row.staminaBonus<previous.staminaBonus))
          errors.push(location+" 升级阈值须递增，生命与体力增量不能下降");
      }
      if (table === "affixes" && row.max < row.min)
        errors.push(`${location} 随机上限须大于等于下限`);
      if(table==="levels" && ["multi","dual"].includes(row.trialRule) && (row.trialKills||2)>row.count)
        errors.push(location+" 群杀目标不能超过入场人数");
      if(table==="levels" && row.focusSlot && ![...indices.equipment.values()].some(e=>e?.slot===row.focusSlot && !e.sourceMonster && e.dropWeight>0))
        errors.push(location+" 偏好部位没有可掉落的装备");
      if(table==="levels" && ["chain","dual"].includes(row.trialRule)){
        const ids=row.formation?String(row.formation).split(/[,，]/).map(s=>s.trim()):[row.front,row.rear];
        if(row.front===row.rear || row.count<2 || !ids.includes(row.front) || !ids.includes(row.rear))errors.push(location+" 连踩阵形须含不同的前排与后排怪物");
      }
    }
  }
  const bosses=new Set(),native=new Set();
  if(Array.isArray(catalog.worlds)&&catalog.worlds.length<4)errors.push("难度表须包含初始三档和通关档位");
  if(Array.isArray(catalog.adventures)&&Array.isArray(catalog.worlds)){
    const maxDepth=Math.max(0,...catalog.adventures.filter(a=>a?.kind==="greater").map(a=>a.maxTier??30));
    if(catalog.worlds.some(w=>w?.riftGate>maxDepth))errors.push("难度解锁层数超过已配置的限时远征最高层");
  }
  if(!oldLoot){
    if(catalog.rarities?.map?.(row=>row?.id).join(",")!=="common,fine,rare,legendary,unique")errors.push("品质须按N、R、SR、SSR、UR排列");
    const affixes=[...indices.affixes.values()].filter(row=>row?.weight>0);
    if(new Set(affixes.filter(row=>row.minTier==="fine").map(row=>row.stat)).size<2 || new Set(affixes.map(row=>row.stat)).size<4)
      errors.push("掉落池至少需要两种R 品质可用属性及四种不同的可用属性");
    const powers=[...indices.powers.values()];
    if(!powers.some(p=>p?.quality==="legendary"&&p.weight>0))errors.push("SSR 威能池须有可抽取的威能");
    for(const p of powers){
      if((p.kind==="return_blade")!==(p.quality==="unique"))errors.push("折返刃为UR 专属机制："+p.id);
      if(p.kind==="air_step" && p.power!==1)errors.push("逐风的额外空跳次数须为 1");
      if(["impact_ring","return_blade","kill_wave"].includes(p.kind) && !(p.radius>0))errors.push("攻击威能半径须大于零："+p.id);
    }
    const uniqueRows=[...indices.uniques.values()],names=new Set();
    if(!uniqueRows.some(u=>u.dropWeight>0))errors.push("UR 池须有可抽取的回响");
    for(const u of uniqueRows){
      if(names.has(u.name))errors.push("UR 名称不能重复："+u.name);names.add(u.name);
      if(indices.powers.get(u.powerId)?.quality!=="unique")errors.push("UR 须使用专属特效："+u.id);
      if(indices.equipment.get(u.template)?.sourceMonster)errors.push("UR 底材不可占用小怪专属回响："+u.id);
      const ids=typeof u.fixedAffixes==="string"?splitIds(u.fixedAffixes):[];
      if(ids.length!==4||new Set(ids.map(id=>indices.affixes.get(id)?.stat)).size!==4)errors.push("UR 须绑定四种不同的固定属性："+u.id);
    }
  }
  for(const row of Array.isArray(catalog.summons)?catalog.summons:[]){
    if(!row?.boss)continue;
    if(indices.monsters.get(row.boss)?.kind!=="bell" || bosses.has(row.boss))errors.push("虚数体必须对应独立的守关 Boss："+row.boss);
    bosses.add(row.boss);
  }
  for(const row of Array.isArray(catalog.equipment)?catalog.equipment:[]){
    if(!row?.sourceMonster)continue;
    if(indices.monsters.get(row.sourceMonster)?.kind==="bell")errors.push("小怪的专属回响不可绑定守关 Boss："+row.sourceMonster);
    if(native.has(row.sourceMonster))errors.push("小怪的专属回响重复："+row.sourceMonster);
    native.add(row.sourceMonster);
  }
  if(Array.isArray(catalog.equipment)&&!catalog.equipment.some(row=>row && !row.sourceMonster && row.dropWeight>0))errors.push("通用掉落池至少需要一件有权重的回响");
  for (const [table, key] of [["equipment", "dropWeight"], ["rarities", "weight"], ["affixes", "weight"]]) {
    const rows = catalog[table];
    if (Array.isArray(rows) && rows.length && !rows.some(row => record(row) && row[key] > 0))
      errors.push(`${tableLabels[table]}表至少需要一条权重大于零的记录`);
  }
  return errors;
}

// Only upgrade old data on a detached draft. New trials never depend on their IDs.
function migrate(catalog){
  const defaults=globalThis.ASHEN_CONTENT;
  if(catalog.version===1){
    const oldHp={sentry:38,archer:30,trial_guard:24,forgeguard:48,shade:24,bell_keeper:110,
      thicket_keeper:97,forge_keeper:106,frost_keeper:115,eclipse_keeper:124,fire_keeper:54};
    for(const monster of catalog.monsters){
      const fresh=defaults.monsters.find(row=>row.id===monster.id);
      if(fresh&&monster.hp===oldHp[monster.id])monster.hp=fresh.hp;
    }
    const finale=catalog.levels.find(stage=>stage.id==="ember_pass");
    if(finale?.storyBossHp===132)finale.storyBossHp=158;
    const oldScales={lantern:[1.35,1.3],current:[1.8,1.7],crossing:[2.65,2.4],
      deep:[3.15,2.85],stars:[3.65,3.3],night:[4.2,3.75]};
    for(const world of catalog.worlds||[]){
      const old=oldScales[world.id],fresh=defaults.worlds.find(row=>row.id===world.id);
      if(!old||!fresh)continue;
      if(world.hpScale===old[0])world.hpScale=fresh.hpScale;
      if(world.damageScale===old[1])world.damageScale=fresh.damageScale;
    }
  }else if(catalog.version===2){
    const sentry=catalog.monsters.find(row=>row.id==="sentry");
    if(sentry?.hp===44)sentry.hp=46;
  }
  const previousTroops={trial_guard:"演武石卫",sentry:"巡廊守卫",archer:"灰弓游魂",forgeguard:"炉心铁卫",shade:"奔袭暗影"};
  for(const row of catalog.monsters){
    if(row.name===previousTroops[row.id])row.name=defaults.monsters.find(m=>m.id===row.id)?.name||row.name;
  }
  for(const row of catalog.equipment){
    if(!Object.hasOwn(previousTroops,row.sourceMonster))continue;
    const old=previousTroops[row.sourceMonster]+"的回响",updated=defaults.equipment.find(e=>e.id===row.id);
    for(const key of ["name","echoName"])if(updated&&row[key]===old)row[key]=updated[key];
  }
  const entrance=catalog.levels.find(row=>row.id==="courtyard");
  if(entrance?.name==="月影门庭")entrance.name=defaults.levels.find(row=>row.id==="courtyard").name;
  if(entrance?.description==="克罗索斯送来的信在门庭前断了线索。石阶上的泥爪印还没干。")
    entrance.description=defaults.levels.find(row=>row.id==="courtyard").description;
  function addMissingRoom(id){
    if(catalog.levels.some(row=>row.id===id))return;
    const template=defaults.levels.find(row=>row.id===id);
    if(!template)throw Error("旧配置缺少可恢复的关卡「"+id+"」");
    const monsters=[template.front,template.rear,...(template.formation?splitIds(template.formation):[])];
    for(const monster of new Set(monsters)){
      if(catalog.monsters.some(row=>row.id===monster))continue;
      const source=defaults.monsters.find(row=>row.id===monster);
      if(!source)throw Error("关卡「"+id+"」缺少怪物「"+monster+"」");
      catalog.monsters.push(structuredClone(source));
    }
    catalog.levels.push(structuredClone(template));
  }
  const oldRoutes=catalog.adventures===undefined,oldSummons=catalog.summons===undefined,legacyTitan=!catalog.characters.some(row=>row.id==="glala");
  if(oldRoutes){
    catalog.adventures=structuredClone(defaults.adventures);
    for(const adventure of catalog.adventures){
      splitIds(adventure.rooms).forEach(addMissingRoom);
      if(adventure.variants)splitIds(adventure.variants).forEach(addMissingRoom);
    }
  }
  for(const l of catalog.levels)if(l.id==="stomp_trial" && l.trialRule===undefined){
    l.trialRule=l.count>1&&l.front!==l.rear?"dual":"multi";l.trialKills=Math.min(2,l.count);
    for(const [key,id] of [["trialBoot1","light"],["trialBoot2","heavy"]])
      if(catalog.equipment.some(e=>e.id===id&&e.slot==="boots"))l[key]=id;
  }
  if(catalog.chapters===undefined || oldRoutes) {
    catalog.chapters??=structuredClone(defaults.chapters);
    for(const chapter of catalog.chapters)splitIds(chapter.rooms).forEach(addMissingRoom);
    if(!catalog.affixes.some(row=>row.id==="breath"))catalog.affixes.push(structuredClone(defaults.affixes.find(row=>row.id==="breath")));
  }
  if(catalog.summons===undefined){
    catalog.summons=structuredClone(defaults.summons);
    const legacyNames={wayfarer:"逐月旅巫",warden:"铁钟守卫",courier:"逐风信使"};
    for(const row of catalog.characters)if(row.name===legacyNames[row.id])row.name="格拉拉";
    for(const row of catalog.equipment){
      const base=defaults.equipment.find(item=>item.id===row.id);
      row.echoName??=base?.echoName||row.name+"回响";
      row.series??=base?.series||"暴风";
    }
    for(const row of catalog.affixes)row.series??=defaults.affixes.find(item=>item.id===row.id)?.series||"暴风";
  }
  // Import the new source bindings only for the previous shipped catalog format.
  if(catalog.summons.length && (oldSummons || catalog.summons.every(row=>row.boss===undefined)) &&
      catalog.equipment.every(row=>!row.sourceMonster)){
    for(const row of catalog.summons){
      const boss=defaults.summons.find(entry=>entry.id===row.id)?.boss;
      if(boss && catalog.monsters.some(m=>m.id===boss&&m.kind==="bell"))row.boss=boss;
    }
    for(const row of defaults.equipment.filter(item=>item.sourceMonster)){
      if(catalog.monsters.some(m=>m.id===row.sourceMonster) && !catalog.equipment.some(item=>item.id===row.id))catalog.equipment.push(structuredClone(row));
    }
  }
  if(legacyTitan){
    catalog.characters.push(structuredClone(defaults.characters.find(c=>c.id==="glala")));
    // Keep custom records and the editor's saved revision. Upgrade missing official rows in memory only.
    for(const s of defaults.summons){
      if(!catalog.monsters.some(m=>m.id===s.boss))catalog.monsters.push(structuredClone(defaults.monsters.find(m=>m.id===s.boss)));
      // A designer may already have assigned this boss to a renamed or replacement machine.
      if(!catalog.summons.some(v=>v.id===s.id || v.boss===s.boss))catalog.summons.push(structuredClone(s));
    }
    for(const a of defaults.affixes)if(!catalog.affixes.some(v=>v.id===a.id))catalog.affixes.push(structuredClone(a));
    const pass=catalog.levels.find(v=>v.id==="ember_pass"),fresh=defaults.levels.find(v=>v.id==="ember_pass");
    if(pass && !pass.formation && pass.front==="trial_guard" && pass.count===5){for(const k of ["formation","rear","count","positions"])pass[k]=fresh[k]}
  }
  for(const row of catalog.summons){const s=defaults.summons.find(v=>v.id===row.id);if(s && !row.ability)for(const k of ["ability","abilityText","power","period","duration","radius","burnChances"])row[k]=s[k]}
  for(const row of catalog.summons)if(row.boss && !catalog.monsters.some(m=>m.id===row.boss) && oldSummons)delete row.boss;
  // Add the sixth chapter to the shipped five-chapter route; retain designer routes and values.
  const original=["belfry","thicket","forge","frost","eclipse"];
  const sameRoute=(a,b)=>splitIds(a).join(",")===splitIds(b).join(",");
  const fireMachine=catalog.summons.find(s=>s.boss==="fire_keeper");
  if(catalog.chapters.length===5 && original.every((id,i)=>catalog.chapters[i].id===id)
      && sameRoute(catalog.chapters[0].rooms,"courtyard,ember_pass,belltower") && fireMachine){
    const finale=structuredClone(defaults.chapters.find(c=>c.id==="cinder"));
    finale.unlockSummon=fireMachine.id;
    for(const id of ["crypt_bridge",...splitIds(finale.rooms)])addMissingRoom(id);
    catalog.chapters[0].rooms=defaults.chapters[0].rooms;
    catalog.chapters.push(finale);
  }
  for(const ch of catalog.chapters){
    const template=defaults.chapters.find(row=>row.id===ch.id && sameRoute(row.rooms,ch.rooms));
    if(!template)continue;
    if(catalog.version<6)for(const key of ["monsterHpBonus","monsterDamageFactor","echoBaseFactor"])ch[key]??=template[key];
    const boss=defaults.summons.find(s=>s.id===template.unlockSummon)?.boss;
    const machine=catalog.summons.find(s=>s.boss===boss);
    if(machine)ch.unlockSummon??=machine.id;
    for(const id of splitIds(ch.rooms)){
      const stage=catalog.levels.find(l=>l.id===id),base=defaults.levels.find(l=>l.id===id);
      if(catalog.version<(id==="thorn_gate"?4:5) && base.storyFrontHp!==undefined && stage.front===base.front)
        stage.storyFrontHp??=base.storyFrontHp;
      if(catalog.version<5 && base.storyRearHp!==undefined && stage.rear===base.rear)
        stage.storyRearHp??=base.storyRearHp;
      if(catalog.version<5 && stage.front===base.front && stage.rear===base.rear && stage.formation===base.formation){
        if(id==="thorn_cloister" && stage.positions==="5.8,8.6,10.2,13.2")stage.positions=base.positions;
        if(id==="thorn_apse" && stage.positions==="5.8,9.3,13")stage.positions=base.positions;
      }
      for(const key of ["lesson","monsterLevel","storyBossHp"])if(base[key]!==undefined)stage[key]??=base[key];
    }
  }
  if(catalog.version<7){
    const archer=catalog.monsters.find(m=>m.id==="archer" && m.kind==="bow");
    if(archer && archer.rangedEffect===undefined)archer.rangedEffect=defaults.monsters.find(m=>m.id==="archer")?.rangedEffect;
  }
  if(catalog.version<8 && catalog.powers){
    const added=["first_bell","last_breath","rill_step","knell","mend"];
    for(const power of defaults.powers.filter(p=>added.includes(p.id))){
      if(!catalog.powers.some(p=>p.id===power.id))catalog.powers.push(structuredClone(power));
    }
  }
  if(catalog.version<9&&catalog.powers){
    const existing=new Set(catalog.powers.map(p=>p.id));
    for(const power of defaults.powers)
      if(EchoModifiers.machineKinds.includes(power.id)&&!existing.has(power.id))catalog.powers.push(structuredClone(power));
  }
  catalog.version=9;
  catalog.growth??=structuredClone(defaults.growth);
  if(!catalog.worlds){
    const depth=Math.max(0,...catalog.adventures.filter(a=>a.kind==="greater").map(a=>a.maxTier??30));
    catalog.worlds=structuredClone(defaults.worlds.slice(0,4+Math.min(depth,3)));
    if(depth<30){
      const gates=catalog.worlds.slice(4);
      gates.forEach((world,i)=>{world.riftGate=Math.ceil(depth*(i+1)/gates.length)});
    }
  }
  if(catalog.powers===undefined&&catalog.uniques===undefined){
    catalog.powers=structuredClone(defaults.powers);
    catalog.uniques=structuredClone(defaults.uniques);
    const old=new Map(catalog.rarities.map(row=>[row.id,row]));
    catalog.rarities=defaults.rarities.map(row=>({...row,...old.get(row.id),name:row.name,color:row.color}));
    for(const row of catalog.equipment){
      const base=defaults.equipment.find(e=>e.id===row.id);
      row.baseAttack??=base?.baseAttack??1;row.baseHealth??=base?.baseHealth??1;
    }
    for(const row of catalog.affixes)row.minTier??=defaults.affixes.find(a=>a.id===row.id)?.minTier??"fine";
    for(const unique of catalog.uniques){
      if(!catalog.equipment.some(e=>e.id===unique.template))unique.template=catalog.equipment.find(e=>!e.sourceMonster)?.id;
      if(splitIds(unique.fixedAffixes).some(id=>!catalog.affixes.some(a=>a.id===id))){
        unique.fixedAffixes=[...new Map(catalog.affixes.map(a=>[a.stat,a.id])).values()].slice(0,4).join(",");
      }
    }
  }
  for(const world of catalog.worlds)world.name=worldName(world);
  const previousNames={common:"普通",fine:"魔法",rare:"稀有",legendary:"传奇",unique:"暗金"};
  for(const rarity of catalog.rarities){
    if(rarity.name===previousNames[rarity.id])rarity.name=defaults.rarities.find(row=>row.id===rarity.id).name;
  }
  for(const m of catalog.monsters){
    const boss=m.kind==="bell";
    m.xp??=boss?24:8;m.goldMin??=boss?8:1;m.goldMax??=boss?12:3;
  }
  return catalog;
}
function prepareCatalog(data){
  const rawIssues=validateCatalog(data);
  if(rawIssues.length)throw Error(rawIssues.slice(0,5).join("\n"));
  const catalog=migrate(structuredClone(data));
  const migratedIssues=validateCatalog(catalog);
  if(migratedIssues.length)throw Error(migratedIssues.slice(0,5).join("\n"));
  return catalog;
}
function references(data){
  const found=[],targets=Object.fromEntries(Object.keys(schema).map(t=>[t,new Set(data[t].map(r=>r.id))]));
  for(const [table,fields] of Object.entries(schema))for(const [index,row] of data[table].entries()){
    for(const f of fields){const target=f.ref||f.refList;if(!target||!row[f.key])continue;
      const ids=f.refList?splitIds(String(row[f.key])).map(entry=>f.type==="echoAffixes"?entry.split(/[:：]/)[0].trim():entry):[row[f.key]];
      for(const id of new Set(ids))found.push({table,index,field:f.key,label:f.label,target,id,
        broken:!targets[target].has(id)});
    }
  }
  return found;
}
return {schema,validateCatalog,prepareCatalog,migrate,references,worldName,archivedWorldLabel};})();
