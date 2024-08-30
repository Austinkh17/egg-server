const Controller = require('./common');
const fs = require('fs');

class PokemonNewController extends Controller {
  async spiderPokemonFromDB() {
    const json1 = fs.readFileSync('db/poke_20231220/pokemonList-detail-newnewnew.json')
    const pokemonList = JSON.parse(json1.toString()).pokemon
    const json4 = fs.readFileSync('db/poke_20231220/abilitiesList.json')
    const ability = JSON.parse(json4.toString()).ability
    const abilityId = ability.map(i => Number(i.no))
    const json5 = fs.readFileSync('db/poke_20231220/evolution-chain.json')
    const evolution = JSON.parse(json5.toString()).evolutionChain
    const evolutionId = evolution.map(i => Number(i.id))

    pokemonList.forEach(i => {
      if (!i.picName) {
        i.picName = 'a' + i.nationalCode
      }
    })
    const picNameId = pokemonList.map(i => i.picName)

    for (let i = 0; i < pokemonList.length; i++) {
      let texingName = []
      pokemonList[i].texing.forEach(texing => {
        if (texing === null) {
          texingName.push(null)
        } else {
          let index0 = abilityId.indexOf(texing)
          if (index0 > -1) {
            texingName.push(ability[index0].cname)
          }
        }
      })
      const detail = this.computeOtherField({ ...pokemonList[i], texingName })

      let allgen = this.generateAllgen(Number(pokemonList[i].nationalCode))

      let genObj = {}
      let genArr = allgen.map(i => i.gen)
      let sv = genArr.indexOf('sv')
      let swordshield = genArr.indexOf('swordshield')
      let usum = genArr.indexOf('usum')

      let jinhuabiaoIndex = evolutionId.indexOf(detail.jinhuabiao)
      if (jinhuabiaoIndex > -1) {
        detail.jinhuabiao = evolution[jinhuabiaoIndex]
        // 处理蛋招式
        if (detail.jinhuabiao.chain.length && detail.jinhuabiao.chain[0].fromimg !== detail.picName) {
          let picNameIndex = picNameId.indexOf(detail.jinhuabiao.chain[0].fromimg)
          if (picNameIndex > -1) {
            let tuihuaAllgen = this.generateAllgen(Number(pokemonList[picNameIndex].nationalCode))
            let tuihuaAllgenArr = tuihuaAllgen.map(i => i.gen)
            let sv1 = tuihuaAllgenArr.indexOf('sv')
            let swordshield1 = tuihuaAllgenArr.indexOf('swordshield')
            let usum1 = tuihuaAllgenArr.indexOf('usum')
            if (sv > -1 && sv1 > -1) {
              allgen[sv].egg = tuihuaAllgen[sv1].egg
            }
            if (swordshield > -1 && swordshield1 > -1) {
              allgen[swordshield].egg = tuihuaAllgen[swordshield1].egg
            }
            if (usum > -1 && usum1 > -1) {
              allgen[usum].egg = tuihuaAllgen[usum1].egg
            }
          }
        }
      }
      detail.allgen = allgen

      if (sv > -1) {
        genObj = allgen[sv]
      } else if (swordshield > -1) {
        genObj = allgen[swordshield]
      } else if (usum > -1) {
        genObj = allgen[usum]
      }
      let skillField = this.computeGreatSkill(genObj)
      detail.compute = {
        ...detail.compute,
        ...skillField
      }

      await this.service.pokemonNew.savePokemon(detail)
    }

    return this.ctx.body = {
      code: 200,
      message: '生成pokemonList成功'
    }
  }

  async spiderPokemonAbility() {
    const json1 = fs.readFileSync('db/poke_20231220/abilitiesList.json')
    const ability = JSON.parse(json1.toString()).ability
    for (let i = 0; i < ability.length; i++) {
      await this.service.pokemonNew.savePokemonAbility(ability[i])
    }
    return this.ctx.body = {
      code: 200,
      message: '生成pokemon特性成功'
    }
  }

  async spiderPokemonMove() {
    const json1 = fs.readFileSync('db/poke_20231220/movesListNew.json')
    const move = JSON.parse(json1.toString()).skill
    for (let i = 0; i < move.length; i++) {
      await this.service.pokemonNew.savePokemonMove(move[i])
    }
    return this.ctx.body = {
      code: 200,
      message: '生成pokemon动作成功'
    }
  }

  async spiderPokemonItem() {
    const json1 = fs.readFileSync('db/poke_20231220/itemList.json')
    const item = JSON.parse(json1.toString()).pokeball
    for (let i = 0; i < item.length; i++) {
      await this.service.pokemonNew.savePokemonItem(item[i])
    }
    return this.ctx.body = {
      code: 200,
      message: '生成pokemon道具成功'
    }
  }

  async getPokemonAbility() {
    let { ctx, app } = this
    await app.model.Ability.find()
      .then((data) => {
        return ctx.body = {
          code: 200,
          data: data,
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  async getPokemonMove() {
    let { ctx, app } = this
    await app.model.Move.find()
      .then((data) => {
        return ctx.body = {
          code: 200,
          data: data,
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  async getPokemonItem() {
    let { ctx, app } = this
    await app.model.Item.find()
      .then((data) => {
        return ctx.body = {
          code: 200,
          data: data,
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  computeGreatSkill(genObj) {
    let greatSkillList = [
      "剑舞-14",
      "吹飞-18",
      "吼叫-46",
      "寄生种子-73",
      "电磁波-86",
      "剧毒-92",
      "自我再生-105",
      "生蛋-135",
      "大蛇瞪眼-137",
      "蘑菇孢子-147",
      "溶化-151",
      "咒术-174",
      "腹鼓-187",
      "撒菱-191",
      "同命-194",
      "终焉之歌-195",
      "喝牛奶-208",
      "高速旋转-229",
      "晨光-234",
      "光合作用-235",
      "月光-236",
      "神速-245",
      "击掌奇袭-252",
      "磷火-261",
      "看我嘛-266",
      "挑衅-269",
      "帮助-270",
      "戏法-271",
      "祈愿-273",
      "哈欠-281",
      "拍落-282",
      "萤火-294",
      "偷懒-303",
      "宇宙力量-322",
      "铁壁-334",
      "健美-339",
      "冥想-347",
      "龙之舞-349",
      "羽栖-355",
      "顺风-366",
      "急速折返-369",
      "毒菱-390",
      "诡计-417",
      "清除浓雾-432",
      "戏法空间-433",
      "隐形岩-446",
      "新月舞-461",
      "磨爪-468",
      "愤怒粉-476",
      "蝶舞-483",
      "盘蜷-489",
      "移花接木-492",
      "破壳-504",
      "换挡-508",
      "巴投-509",
      "龙尾-525",
      "棉花防守-538",
      "黏黏网-564",
      "冷冻干燥-573",
      "抛下狠话-575",
      "爆音波-586",
      "大地掌控-601",
      "蹭蹭脸颊-609",
      "集沙-659",
      "吸取力量-668",
      "号令-689",
      "极光幕-694",
      "电喙-754",
      "鳃咬-755",
      "魂舞烈音爆-775",
      "扑击-776",
      "装饰-777",
      "广域战力-797",
      "青草滑梯-803",
      "电力上升-804",
      "快速折返-812",
      "暗冥强击-817",
      "水流连打-818",
      "雪矛-824",
      "星碎-825",
      "岩斧-830",
      "胜利之舞-837",
      "闭关-842",
      "秘剑・千重涛-845",
      "勇气填充-850",
      "扫墓-854",
      "鼠数儿-860",
      "复生祈祷-863",
      "盐腌-864",
      "晶光转转-866",
      "甩肉-868",
      "千变万花-870",
      "闪焰高歌-871",
      "流水旋舞-872",
      "精神剑-875",
      "水蒸气-876",
      "断尾-880",
      "冷笑话-881",
      "大扫除-882",
      "愤怒之拳-889",
      "棘藤棒-904",
      "再来一次-227",
      "临别礼物-262",
      "黑雾-114",
      "增强拳-612",
      "接棒-226",
      "光墙-113",
      "反射壁-115",
    ]
    let genMap = {
      'sv': '朱紫',
      'swordshield': '剑盾',
      'usum': '究极日月',
    }
    let greatSkillListId = greatSkillList.map(i => {
      return Number(i.split('-')[1])
    })
    let obj = {
      greatSkill: [],
      skillGen: genMap[genObj.gen]
    }
    let arr = []
    let levelup = genObj.levelup.map(i => {
      return i[0]
    })
    let machine = genObj.machine
    let egg = genObj.egg
    if (genObj.gen === 'sv') {
      let evo = genObj.evo
      let recall = genObj.recall
      arr = Array.from(new Set([...levelup, ...machine, ...egg, ...evo, ...recall]))
    } else {
      let tutor = genObj.tutor
      arr = Array.from(new Set([...levelup, ...machine, ...egg, ...tutor]))
    }
    arr.forEach(i => {
      let skillIndex = greatSkillListId.indexOf(i)
      if (skillIndex > -1) {
        let text = greatSkillList[skillIndex].split('-')[0]
        obj.greatSkill.push(text)
      }
    })
    return obj
  }

  computeOtherField(detail) {
    // HP能力值
    // 如果是脱壳忍者：能力值 ＝ 1
    // 如果不是脱壳忍者：能力值 ＝ （种族值×2＋基础点数÷4＋个体值）×等级÷100＋等级＋10
    // 非HP能力值
    // 能力值 ＝ （（种族值×2＋基础点数÷4＋个体值）×等级÷100＋5）×性格修正
    const json = fs.readFileSync('db/util/type.json')
    const typeMap = JSON.parse(json.toString())
    const hp = detail.zhongzuzhi[5]
    const attack = detail.zhongzuzhi[4]
    const defense = detail.zhongzuzhi[3]
    const spAttack = detail.zhongzuzhi[2]
    const spDefense = detail.zhongzuzhi[1]
    const speed = detail.zhongzuzhi[0]
    const total = hp + attack + defense + spAttack + spDefense + speed
    const average = total / 6
    const validTotal = attack > spAttack ? hp + attack + defense + spDefense + speed : hp + defense + spAttack + spDefense + speed
    const max50Hp = (hp * 2 + 63 + 31) * 0.5 + 60
    const max50Defense = ((defense * 2 + 63 + 31) * 0.5 + 5) * 1.1
    const max50SpDefense = ((spDefense * 2 + 63 + 31) * 0.5 + 5) * 1.1
    const max100Hp = (hp * 2 + 63 + 31) * 1 + 110
    const max100Defense = ((defense * 2 + 63 + 31) * 1 + 5) * 1.1
    const max100SpDefense = ((spDefense * 2 + 63 + 31) * 1 + 5) * 1.1
    let type = {}
    const shuxing = detail.shuxing.filter(i => i !== null)
    if (shuxing.length === 1) {
      type = typeMap[shuxing[0]]
    } else if (shuxing.length === 2) {
      let shuxing1 = shuxing[0] + '、' + shuxing[1]
      let shuxing2 = shuxing[1] + '、' + shuxing[0]
      if (typeMap.hasOwnProperty(shuxing1)) {
        type = typeMap[shuxing1]
      } else if (typeMap.hasOwnProperty(shuxing2)) {
        type = typeMap[shuxing2]
      }
    }
    let greatTexingList = [
      "降雨",
      "加速",
      "蓄电",
      "储水",
      "引火",
      "威吓",
      "踩影",
      "神奇守护",
      "飘浮",
      "避雷针",
      "悠游自如",
      "叶绿素",
      "大力士",
      "扬沙",
      "厚脂肪",
      "毅力",
      "神奇鳞片",
      "坚硬脑袋",
      "日照",
      "沙穴",
      "瑜伽之力",
      "电气引擎",
      "轻装",
      "单纯",
      "铁拳",
      "适应力",
      "连续攻击",
      "太阳之力",
      "一般皮肤",
      "魔法防守",
      "无防守",
      "技术高手",
      "纯朴",
      "有色眼镜",
      "引水",
      "降雪",
      "舍身",
      "强行",
      "唱反调",
      "多重鳞片",
      "再生力",
      "拨沙",
      "变身者",
      "自信过度",
      "魔法镜",
      "食草",
      "恶作剧之心",
      "沙之力",
      "变幻自如",
      "强壮之颚",
      "冰冻皮肤",
      "疾风之翼",
      "超级发射器",
      "硬爪",
      "妖精皮肤",
      "飞行皮肤",
      "亲子爱",
      "暗黑气场",
      "妖精气场",
      "始源之海",
      "终结之地",
      "德尔塔气流",
      "水泡",
      "钢能力者",
      "拨雪",
      "电气皮肤",
      "画皮",
      "牵绊变身",
      "毛茸茸",
      "魂心",
      "异兽提升",
      "电气制造者",
      "精神制造者",
      "薄雾制造者",
      "青草制造者",
      "不挠之剑",
      "不屈之盾",
      "自由者",
      "庞克摇滚",
      "冰鳞粉",
      "结冻头",
      "钢之意志",
      "电晶体",
      "龙颚",
      "苍白嘶鸣",
      "漆黑嘶鸣",
      "热交换",
      "洁净之盐",
      "焦香之躯",
      "乘风",
      "搬岩",
      "古代活性",
      "夸克充能",
      "黄金之躯",
      "灾祸之鼎",
      "灾祸之剑",
      "灾祸之简",
      "灾祸之玉",
      "绯红脉动",
      "强子引擎",
      "锋锐",
      "大将",
      "毒满地",
      "食土",
      "款待",
      "面影辉映",
    ]
    let greatTexing = []
    detail.texingName.forEach(texing => {
      if (greatTexingList.includes(texing)) {
        greatTexing.push(texing)
      }
    })
    let compute = {
      ...type,
      greatTexing,
      max50Defense: (max50Hp * max50Defense).toFixed(0),
      max50SpDefense: (max50Hp * max50SpDefense).toFixed(0),
      max100Defense: (max100Hp * max100Defense).toFixed(0),
      max100SpDefense: (max100Hp * max100SpDefense).toFixed(0)
    }
    let detailNew = {
      ...detail,
      "compute": compute,
      "tagList": [],
      "baseStat": {
        "hp": hp,
        "attack": attack,
        "defense": defense,
        "spAttack": spAttack,
        "spDefense": spDefense,
        "speed": speed,
        "total": total,
        "average": average,
        "validTotal": validTotal
      }
    }
    return detailNew
  }

  generateAllgen(nationalCode) {
    const json2 = fs.readFileSync('db/poke_20231220/pokemoveall.json')
    const moveall = JSON.parse(json2.toString()).pokemovelist
    const moveallId = moveall.map(i => i.id)
    const json3 = fs.readFileSync('db/poke_20231220/svskill.json')
    const svskill = JSON.parse(json3.toString())
    const svskillId = svskill.levelup.map(i => Number(i.num))

    let index1 = moveallId.indexOf(nationalCode)
    let index2 = svskillId.indexOf(nationalCode)
    let allgen = []
    if (index1 > -1) {
      allgen = moveall[index1].allgen
    }
    let obj = {
      "gen": "sv",
      "levelup": [],
      "machine": [],
      "egg": [],
      "evo": [],
      "recall": []
    }
    if (index2 > -1) {
      obj.levelup = svskill.levelup[index2].moveId
      const machineId = svskill.machine.map(i => Number(i.num))
      let index3 = machineId.indexOf(nationalCode)
      if (index3 > -1) {
        obj.machine = svskill.machine[index3].moveId
      }

      const eggId = svskill.egg.map(i => Number(i.num))
      let index4 = eggId.indexOf(nationalCode)
      if (index4 > -1) {
        obj.egg = svskill.egg[index4].moveId
      }

      const evoId = svskill.evo.map(i => Number(i.num))
      let index5 = evoId.indexOf(nationalCode)
      if (index5 > -1) {
        obj.evo = svskill.evo[index5].moveId
      }

      const recallId = svskill.recall.map(i => Number(i.num))
      let index6 = recallId.indexOf(nationalCode)
      if (index6 > -1) {
        obj.recall = svskill.recall[index6].moveId
      }

      allgen.push(obj)
    }
    return allgen
  }

  async getPokemonList() {
    let { ctx, app } = this
    let { sort, sortIndex, pageSize, currentPage } = ctx.query
    const skipNum = (Number(currentPage) - 1) * Number(pageSize)
    let query = ctx.query
    delete query.sort
    delete query.sortIndex
    delete query.pageSize
    delete query.currentPage
    let sortParams = {}
    sortParams[sort] = sortIndex
    if (!sortParams[sort]) sortParams = { index: 1 }
    sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
    JSON.stringify(query) !== '{}' && (query["$and"] = [])
    if (query.hasOwnProperty('texing')) {
      query["$and"].push(
        { texing: Number(query.texing) }
      )
      delete query.texing
    }
    if (query.hasOwnProperty('shuxing')) {
      let arr = query.shuxing.split(',')
      if (arr.length > 1) {
        query["$and"].push(
          { shuxing: { $all: arr } }
        )
      } else if (arr.length === 1) {
        query["$and"].push(
          { shuxing: arr[0] }
        )
      }
      delete query.shuxing
    }
    if (query.hasOwnProperty('resistArr')) {
      let arr = query.resistArr.split('、')
      arr.forEach(i => {
        query["$and"].push(
          { 'compute.resistArr': i }
        )
      })
      delete query.resistArr
    }
    if (query.hasOwnProperty('nameZh')) {
      const reg = new RegExp(query.nameZh, 'i')
      const regex = { $regex: reg }
      query["$and"].push({
        $or: [
          { nameZh: regex }
        ]
      })
      delete query.nameZh
    }
    if (query.hasOwnProperty('type')) {
      let arr = query.type.split(',')
      if (arr.length && arr.length === 1) {
        query["$and"].push({
          $or: [
            { type1: arr[0] },
            { type2: arr[0] }
          ]
        })
      } else if (arr.length && arr.length === 2) {
        query["$and"].push({
          $or: [
            { type1: arr[0], type2: arr[1] },
            { type1: arr[1], type2: arr[0] }
          ]
        })
      }
      delete query.type
    }
    if (query.hasOwnProperty('tagList')) {
      let arr = query.tagList.split(',')
      query["$and"].push({ tagList: { $all: arr } })
      delete query.tagList
    }
    if (query.hasOwnProperty('skill')) {
      const arr = query.skill.indexOf(",")
        ? query.skill.split(",")
        : [query.skill]
      arr.forEach(skill => {
        let skillArr = []
        skillArr.push({ 'allgen.levelup': { $elemMatch: { 0: { $eq: Number(skill) } } }, 'allgen.gen': 'sv' })
        skillArr.push({ 'allgen.machine': Number(skill), 'allgen.gen': 'sv' })
        skillArr.push({ 'allgen.egg': Number(skill), 'allgen.gen': 'sv' })
        skillArr.push({ 'allgen.tutor': Number(skill), 'allgen.gen': 'sv' })
        skillArr.push({ 'allgen.evo': Number(skill), 'allgen.gen': 'sv' })
        skillArr.push({ 'allgen.recall': Number(skill), 'allgen.gen': 'sv' })
        query["$and"].push({ $or: skillArr })
      })
      delete query.skill
    }
    Object.keys(query).forEach(field => {
      if (field !== '$and') {
        const obj = {}
        obj[field] = query[field]
        query["$and"].push(obj)
        delete query[field]
      }
    })
    console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams)
    console.dir(query, { depth: null })
    await Promise.all([
      app.model.PokemonNew.count(query),
      app.model.PokemonNew.find(query).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
      app.model.Ability.find(),
    ])
      .then((data) => {
        let abilityMap = {}
        data[2].forEach(i => {
          abilityMap[i.no] = {
            cname: i.cname,
            cneffect: i.cneffect
          }
        })
        data[1].forEach(i => {
          let arr = []
          i.texing.filter(Boolean).forEach(j => {
            arr.push(abilityMap[j])
          })
          i.texing = arr
        })
        return ctx.body = {
          code: 200,
          data: data[1],
          total: data[0],
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  async getPokemonDetail() {
    let { ctx, app } = this
    let { index } = ctx.query
    await app.model.PokemonNew.findOne(index)
      .then((data) => {
        return ctx.body = {
          code: 200,
          data: data,
          total: 1,
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  async addPokemonNewField() {
    const { app } = this
    await app.model.PokemonNew.find()
      .then((res) => {
        res.forEach(async (item) => {
          const attack = item.baseStat.attack > item.baseStat.spAttack ? item.baseStat.attack : item.baseStat.spAttack
          //  有效种族值 = hp + 双防 + 一攻 + 速度
          const validTotal = attack + item.baseStat.hp + item.baseStat.defense + item.baseStat.spDefense + item.baseStat.speed
          // HP能力值
          // 如果是脱壳忍者：能力值 ＝ 1
          // 如果不是脱壳忍者：能力值 ＝ （种族值×2＋基础点数÷4＋个体值）×等级÷100＋等级＋10
          // 非HP能力值
          // 能力值 ＝ （（种族值×2＋基础点数÷4＋个体值）×等级÷100＋5）×性格修正
          const map = {
            '一般': {
              '0': ['幽灵'],
              '1/2': [],
              '2': ['格斗']
            },
            '格斗': {
              '0': [],
              '1/2': ['岩石', '虫', '恶'],
              '2': ['飞行', '超能力', '妖精']
            },
            '飞行': {
              '0': ['地面'],
              '1/2': ['格斗', '虫', '草'],
              '2': ['岩石', '电', '冰']
            },
            '毒': {
              '0': [],
              '1/2': ['格斗', '虫', '草', '毒', '妖精'],
              '2': ['地面', '超能力']
            },
            '地面': {
              '0': ['电'],
              '1/2': ['毒', '岩石'],
              '2': ['水', '草', '冰']
            },
            '岩石': {
              '0': [],
              '1/2': ['一般', '毒', '火', '飞行'],
              '2': ['格斗', '地面', '水', '草', '钢']
            },
            '虫': {
              '0': [],
              '1/2': ['格斗', '地面', '草'],
              '2': ['岩石', '飞行', '火']
            },
            '幽灵': {
              '0': ['一般', '格斗'],
              '1/2': ['毒', '虫'],
              '2': ['幽灵', '恶']
            },
            '钢': {
              '0': ['毒'],
              '1/2': ['一般', '飞行', '岩石', '钢', '虫', '冰', '龙', '草', '超能力', '妖精'],
              '2': ['格斗', '地面', '火']
            },
            '火': {
              '0': [],
              '1/2': ['火', '草', '钢', '虫', '冰', '妖精'],
              '2': ['岩石', '地面', '水']
            },
            '水': {
              '0': [],
              '1/2': ['钢', '火', '水', '冰'],
              '2': ['电', '草']
            },
            '草': {
              '0': [],
              '1/2': ['地面', '水', '草', '电'],
              '2': ['飞行', '毒', '虫', '火', '冰']
            },
            '电': {
              '0': [],
              '1/2': ['飞行', '钢', '电'],
              '2': ['地面']
            },
            '超能力': {
              '0': [],
              '1/2': ['格斗', '超能力'],
              '2': ['虫', '幽灵', '恶']
            },
            '冰': {
              '0': [],
              '1/2': ['冰'],
              '2': ['格斗', '岩石', '钢', '火']
            },
            '龙': {
              '0': [],
              '1/2': ['火', '水', '草', '电'],
              '2': ['冰', '龙', '妖精']
            },
            '恶': {
              '0': ['超能力'],
              '1/2': ['幽灵', '恶'],
              '2': ['格斗', '虫', '妖精']
            },
            '妖精': {
              '0': ['龙'],
              '1/2': ['格斗', '虫', '恶'],
              '2': ['钢', '毒']
            },
            '': {
              '0': [],
              '1/2': [],
              '2': []
            }
          }
          const against = {
            '0': [],
            '1/2': [],
            '1/4': [],
            '2': [],
            '4': []
          }
          against['0'] = map[item.type1]['0'].concat(map[item.type2]['0'])
          const { repeats, noRepeats } = this.service.pokemonNew.findRepeats(map[item.type1]['1/2'].concat(map[item.type2]['1/2']))
          against['1/2'] = noRepeats
          against['1/4'] = repeats
          const { repeats: repeats1, noRepeats: noRepeats1 } = this.service.pokemonNew.findRepeats(map[item.type1]['2'].concat(map[item.type2]['2']))
          against['2'] = noRepeats1
          against['4'] = repeats1
          against['0'].forEach(item => {
            against['1/4'] = against['1/4'].filter(i => i !== item)
            against['1/2'] = against['1/2'].filter(i => i !== item)
            against['2'] = against['2'].filter(i => i !== item)
            against['4'] = against['4'].filter(i => i !== item)
          })
          const { repeats: repeatsNew } = this.service.pokemonNew.findRepeats(against['1/2'].concat(against['2']))
          repeatsNew.forEach(item => {
            against['1/2'] = against['1/2'].filter(i => i !== item)
            against['2'] = against['2'].filter(i => i !== item)
          })
          //  热门属性-2022.1.6根据statisticHotPokemonType统计的单双打对战前 50、100、150
          const hotTypes = ['水', '飞行', '龙', '超能', '火', '妖精', '钢', '电', '地面', '恶', '幽灵', '草']
          const notHotTypes = ['一般', '岩石', '冰', '格斗', '虫', '毒']
          const tagList = []
          if (item.baseStat.speed >= 100 && item.baseStat.attack >= 100) tagList.push('高速物攻打手')
          if (item.baseStat.speed >= 100 && item.baseStat.spAttack >= 100) tagList.push('高速特攻打手')
          if (item.baseStat.hp + item.baseStat.defense >= 180) tagList.push('物盾')
          if (item.baseStat.hp + item.baseStat.spDefense >= 180) tagList.push('特盾')
          if (item.baseStat.speed <= 60 && item.baseStat.attack >= 100) tagList.push('空间物攻打手')
          if (item.baseStat.speed <= 60 && item.baseStat.spAttack >= 100) tagList.push('空间特攻打手')
          if (item.baseStat.hp + item.baseStat.defense + item.baseStat.spDefense >= 240 && item.baseStat.hp + item.baseStat.defense >= 155 && item.baseStat.hp + item.baseStat.spDefense >= 155 && item.baseStat.hp > 69 && item.baseStat.defense > 69 && item.baseStat.spDefense > 69) tagList.push('三维过硬')
          //  假设某属性PM连续遇到18种属性攻击，记正常效果攻击为1，效果拔群攻击为2，收效甚微攻击记为0.5，无效攻击记为0，如果4倍抵抗就计0.25，4倍伤害就计4，然后把这些数值累加，得到的结果是
          const restLength = 18 - (against['0'].length + against['1/4'].length + against['1/2'].length + against['2'].length + against['4'].length)
          const againstPoint = against['0'].length * 0 + against['1/4'].length * 1 / 4 + against['1/2'].length * 1 / 2 + against['2'].length * 2 + against['4'].length * 4 + restLength * 1
          if (againstPoint <= 17) tagList.push('优秀抗性')
          const baseStatNew = {
            ...item.baseStat,
            validTotal
          }
          let skill = item.learnSetByLevelingUp.concat(item.learnSetByTechnicalMachine).concat(item.learnSetByBreeding)
          const attackImprove = ['龙之舞', '剑舞', '健美', '盘蜷', '破壳', '腹鼓', '增强拳', '换挡', '背水一战', '诅咒', '炽魂热舞烈音爆']
          const spAttackImprove = ['蝶舞', '冥想', '诡计', '大地掌控', '破壳', '萤火', '背水一战', '炽魂热舞烈音爆']
          const supportingRole = ['电磁波', '鬼火', '催眠术', '催眠粉', '麻痹粉', '剧毒', '蘑菇孢子', '蹭蹭脸颊', '', '', '', '', '', '', '', '', '', '', '', '']
          const supportingRole2 = ['顺风', '黏黏网', '戏法空间', '', '', '', '', '', '', '', '', '', '']
          const supportingRole3 = ['击掌奇袭', '光墙', '反射壁', '极光幕', '清除浓雾', '哈欠', '吼叫', '挑衅', '接棒', '灭亡之歌', '同命', '', '']
          const supportingRole4 = ['装饰', '帮助', '看我嘛', '愤怒粉', '号令', '', '', '', '', '', '', '', '']
          const supportingRole5 = ['隐形岩', '毒冷', '', '', '', '', '', '', '', '']
          skill.forEach(i => {
            if (attackImprove.includes(i.move)) {
              tagList.push('物攻强化手')
            }
            if (spAttackImprove.includes(i.move)) {
              tagList.push('特攻强化手')
            }
            if (supportingRole.includes(i.move)) {
              tagList.push('辅助手')
            }
          })
          await this.ctx.model.PokemonNew.updateOne({ index: item.index }, { $set: { against: against, againstPoint: againstPoint, tagList: tagList, baseStat: baseStatNew } })
            .then((res) => {
            })
            .catch((err) => {
              this.logger.error(err)
              console.log('111', err);
            })
        })
      })
      .catch((err) => {
        this.logger.error(err)
        return []
      })
  }
}

module.exports = PokemonNewController;
