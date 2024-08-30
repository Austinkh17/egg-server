const Controller = require('./common');
const fs = require('fs');

class PokemonController extends Controller {
  async spiderPokemonFromDB() {
    const json1 = fs.readFileSync('db/poke_20231220/pokemonList-detail-newnewnew.json');
    const pokemonList = JSON.parse(json1.toString()).pokemon
    for (let i = 0; i < pokemonList.length; i++) {
      await this.service.pokemon.savePokemonNew(pokemonList[i])
    }
    return this.ctx.body = {
      code: 200,
      message: '生成pokemonList成功'
    }
  }

  // todo 
  // sql的.db导出为json时，二进制数据如何转成字符串？
  async pmbattleTo() {
    // const reader = new FileReader()
    // reader.onload = function () {
    //   const content = reader.result
    //   console.log('read', content)
    // }
    // reader.readAsText(db/pmbattle/tb_pokemon.json)
    //   fs.readFile("db/pmbattle/tb_pokemon.json", (err, data) => {
    //     const json = data ? JSON.parse(data) : []
    //     json.length && json.forEach(i => {
    //       // const buf = new Buffer(i.data);
    //       // const buf = new Buffer.from(i.data, "base64").toString("ascii")
    //       const buf = new Buffer.from(i.data, "base64")
    //       var result = encoding.convert(buf, "UTF16", "binary")
    //       var result1 = encoding.convert(i.data, "UTF16", "BASE64")
    //       console.log(
    //         "111",
    //         i.data,
    //         buf.toString(),
    //         result.toString(),
    //         result1,
    //         result1.toString()
    //       )
    //     })
    //     // 读取成功
    //     // fs.writeFile("db/poke/tb_pokemon.json",
    //     //   JSON.stringify(json),
    //     //   err => {
    //     //     if (err) {
    //     //       console.log(err)
    //     //     }
    //     //     // 写入成功
    //     //   }
    //     // )
    //   })
  }

  async spiderPokemon() {
    const result = await this.service.pokemon.getPokemonList();
    console.log(result)
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        const pokeInfo = await this.service.pokemon.getPokemonDetail(result[i].index)
        if (pokeInfo.length) {
          await this.service.pokemon.savePokemon(pokeInfo)
        }
      }
    }
  }

  async spiderPokemonBattle() {
    //  每页 30 条数据，总共 150 +，1 为单打，2 为双打
    for (let i = 1; i < 7; i++) {
      const battle = await this.service.pokemon.getPokemonBattle(1, i)
      if (battle.length) {
        battle.forEach(async (item) => {
          await this.service.pokemon.savePokemonBattle(item)
        })
      }
    }
    for (let i = 1; i < 7; i++) {
      const battle = await this.service.pokemon.getPokemonBattle(2, i)
      if (battle.length) {
        battle.forEach(async (item) => {
          await this.service.pokemon.savePokemonBattle(item)
        })
      }
    }
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
    if (query.hasOwnProperty('ability')) {
      const reg = new RegExp(query.ability, 'i')
      const regex = { $regex: reg }
      query["$and"].push({
        $or: [
          { ability1: regex },
          { ability2: regex },
          { abilityHide: regex }
        ]
      })
      delete query.ability
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
      const arr = query.skill.indexOf("、")
        ? query.skill.split("、")
        : [query.skill]
      console.log('111', arr);
      arr.forEach(skill => {
        const reg = new RegExp(skill, "i")
        query["$and"].push({
          $or: [
            { learnSetByLevelingUp: { $elemMatch: { move: reg } } },
            {
              learnSetByTechnicalMachine: { $elemMatch: { move: reg } },
            },
            { learnSetByBreeding: { $elemMatch: { move: reg } } },
          ],
        })
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
      app.model.Pokemon.count(query),
      app.model.Pokemon.find(query).sort(sortParams).skip(skipNum).limit(Number(pageSize))
    ])
      .then((data) => {
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
    await app.model.Pokemon.findOne(index)
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

  //  统计热门宝可梦属性（依据home 单双打前 150+）
  async statisticHotPokemonType() {
    let { ctx, app } = this
    let { battleType, number } = ctx.query
    await app.model.PokemonBattle.aggregate([
      {
        $match: {
          'battleType': {
            $in: [Number(battleType)]
          }
        }
      },
      { $limit: Number(number) },
      {
        $lookup: {
          from: "pokemons",
          localField: 'pokeId',
          foreignField: 'index',
          as: 'info'
        },
      },
      {
        $project: {
          '_id': 0,
          'info': {
            'learnSetByLevelingUp': 0,
            'learnSetByTechnicalMachine': 0,
            'learnSetByBreeding': 0,
            'cultivationPlan': 0,
            'baseStat': 0,
            'against': 0
          }
        }
      }
    ], (err, docs) => {
      if (err) {
        console.log('111', err);
        return ctx.body = {
          code: 1,
          message: err
        }
      }
      const map = {
        '一般': 0,
        '格斗': 0,
        '飞行': 0,
        '毒': 0,
        '地面': 0,
        '岩石': 0,
        '虫': 0,
        '幽灵': 0,
        '钢': 0,
        '火': 0,
        '水': 0,
        '草': 0,
        '电': 0,
        '超能力': 0,
        '冰': 0,
        '龙': 0,
        '恶': 0,
        '妖精': 0
      }
      docs.forEach(item => {
        item.info && item.info.length && item.info[0].type1 in map && map[item.info[0].type1]++
        item.info && item.info.length && item.info[0].type2 in map && map[item.info[0].type2]++
      })
      const sortable = [];
      for (let key in map) {
        sortable.push({ key: key, value: map[key] });
      }
      sortable.sort(function (a, b) {
        return b.value - a.value;
      });
      return ctx.body = {
        code: 200,
        data: {
          total: docs.length,
          battleType: battleType,
          map: map,
          sortable: sortable
        },
        message: '查询成功'
      }
    })
  }

  async addPokemonNewField() {
    const { app } = this
    await app.model.Pokemon.find()
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
          const { repeats, noRepeats } = this.service.pokemon.findRepeats(map[item.type1]['1/2'].concat(map[item.type2]['1/2']))
          against['1/2'] = noRepeats
          against['1/4'] = repeats
          const { repeats: repeats1, noRepeats: noRepeats1 } = this.service.pokemon.findRepeats(map[item.type1]['2'].concat(map[item.type2]['2']))
          against['2'] = noRepeats1
          against['4'] = repeats1
          against['0'].forEach(item => {
            against['1/4'] = against['1/4'].filter(i => i !== item)
            against['1/2'] = against['1/2'].filter(i => i !== item)
            against['2'] = against['2'].filter(i => i !== item)
            against['4'] = against['4'].filter(i => i !== item)
          })
          const { repeats: repeatsNew } = this.service.pokemon.findRepeats(against['1/2'].concat(against['2']))
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
          await this.ctx.model.Pokemon.updateOne({ index: item.index }, { $set: { against: against, againstPoint: againstPoint, tagList: tagList, baseStat: baseStatNew } })
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

  async spiderPokemonDetail() {
    var Crawler = require("crawler");

    var c = new Crawler({
      callback: function (error, res, done) {
        if (error) {
          console.log(error);
        } else {
          let $ = res.$;
          let skill = {};
          let key1 = '';
          let key2 = '';
          let num = 0;
          $("#可学会招式表").parent().nextAll().each((index, ele) => {
            if (ele.name === 'h3') {
              return false;
            } else {
              /*  表头全部定死了，根据顺序依次拿表格数据 */
              // if(ele.name === 'table'){
              //     let theadArr = [];
              //     let tbodyArr = [];
              //     let a = $(ele).find('tbody > tr.bgwhite')
              //     let b = $(ele).find('thead')
              //     let c = $(ele).find('tbody')
              //     $(ele).find('thead > th').each((index1, th) => {
              //         const thead = $(th).find('a').text();
              //         theadArr.push(thead)
              //     })
              //     $(ele).find('tbody > tr.bgwhite').each((index2, tr) => {
              //         let trArr = []
              //         $(tr).find('td').not('.hide').not((index3, el) => {
              //             return $(el).attr('style') === 'display: none';
              //         }).each((index4, td) => {
              //             const tbody = $(td).text() || $(td).find('a').text();
              //             trArr.push(tbody)
              //         })
              //         tbodyArr.push(trArr)
              //     })
              //     let result = theadArr.map((item, i) => {
              //         return {
              //             key: item,
              //             value: tbodyArr[i]
              //         }
              //     })
              //     skill[key1][key2].concat(result)
              //     console.log(ele.name, key1, key2, skill, theadArr, tbodyArr, result);
              // }

              /*  thead就是拿不到，不得不放弃这种了 */

              if (ele.name === 'h4') {
                key1 = $(ele).find('a').text().trim()
                skill[key1] = {}
              } else if (ele.name === 'h5' || ele.name === 'h6') {
                key2 = $(ele).find('.mw-headline').text().trim()
                skill[key1][key2] = []
              } else if (ele.name === 'table') {
                let theadArr = [];
                let tbodyArr = [];
                // let lastTr = $(ele).find('thead > th.headerSort + th.unsortable')
                // let lastTrs = $(ele).find('thead').children()
                // let lastTrss = $(ele).find('thead')
                let a = $(ele).children
                let b = $(ele).find('tr').filter((a, trr) => {
                  let bb = $(trr).attr('class')
                  return !$(trr).attr('class') || !$(trr).attr('class').indexOf('bgl-');
                })
                let c = $(ele).find('th')
                let d = $(ele).find('th.headerSort')
                $(ele).find('th').filter((a, trr) => {
                  return !$(trr).attr('class') || !$(trr).attr('class').indexOf('bgl-');
                }).each((index1, th) => {
                  const thead = $(th).not('.hide').find('a').text().trim();
                  theadArr.push(thead)
                })
                $(ele).find('tbody > tr.bgwhite').each((index2, tr) => {
                  let trArr = []
                  $(tr).find('td').not('.hide').not((index3, el) => {
                    return $(el).attr('style') === 'display: none';
                  }).each((index4, td) => {
                    const tbody = $(td).text().trim() || $(td).find('a').text().trim();
                    trArr.push(tbody)
                  })
                  tbodyArr.push(trArr)
                })
                let result = theadArr.map((item, i) => {
                  return {
                    key: item,
                    value: tbodyArr[i]
                  }
                })
                skill[key1][key2].concat(result)
                console.log(ele.name, key1, key2, skill, theadArr, tbodyArr, result);
              }
            }
            console.log(ele.name, key1, key2, skill);
          })
        }
        done();
      }
    });

    c.queue('https://wiki.52poke.com/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5');
  }

  async spiderPokemonDetail1() {
    var Crawler = require("crawler");

    var c = new Crawler({
      callback: function (error, res, done) {
        if (error) {
          console.log(error);
        } else {
          let $ = res.$;
          $('table').find('thead th').each((index1, th) => {
            const thead = $(th).find('a').text().trim();
            console.log('111', thead);
          })
        }
        done();
      }
    });

    c.queue([{ html: '<table class="roundy bg-超能力 bd-妖精 textblack a-c at-c sortable jquery-tablesorter"><thead><tr><th class="roundytop-6 bgl-超能力" colspan="7"><table class="fulltable"><tbody><tr><th style="font-size: x-large"><a href="/wiki/%E7%AC%AC%E5%85%AB%E4%B8%96%E4%BB%A3" title="第八世代">第八世代</a></th><th><table class="roundy-20 b-超能力 bw-2" style="width: 14em"><tbody><tr><th style="font-size: small">其它世代：</th></tr><tr><th><a href="/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5/%E7%AC%AC%E4%B8%89%E4%B8%96%E4%BB%A3%E6%8B%9B%E5%BC%8F%E8%A1%A8#.E5.8F.AF.E5.AD.A6.E4.BC.9A.E7.9A.84.E6.8B.9B.E5.BC.8F" title="沙奈朵/第三世代招式表">Ⅲ</a>-<a href="/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5/%E7%AC%AC%E5%9B%9B%E4%B8%96%E4%BB%A3%E6%8B%9B%E5%BC%8F%E8%A1%A8#.E5.8F.AF.E5.AD.A6.E4.BC.9A.E7.9A.84.E6.8B.9B.E5.BC.8F" title="沙奈朵/第四世代招式表">Ⅳ</a>-<a href="/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5/%E7%AC%AC%E4%BA%94%E4%B8%96%E4%BB%A3%E6%8B%9B%E5%BC%8F%E8%A1%A8#.E5.8F.AF.E5.AD.A6.E4.BC.9A.E7.9A.84.E6.8B.9B.E5.BC.8F" title="沙奈朵/第五世代招式表">Ⅴ</a>-<a href="/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5/%E7%AC%AC%E5%85%AD%E4%B8%96%E4%BB%A3%E6%8B%9B%E5%BC%8F%E8%A1%A8#.E5.8F.AF.E5.AD.A6.E4.BC.9A.E7.9A.84.E6.8B.9B.E5.BC.8F" title="沙奈朵/第六世代招式表">Ⅵ</a>-<a href="/wiki/%E6%B2%99%E5%A5%88%E6%9C%B5/%E7%AC%AC%E4%B8%83%E4%B8%96%E4%BB%A3%E6%8B%9B%E5%BC%8F%E8%A1%A8#.E5.8F.AF.E5.AD.A6.E4.BC.9A.E7.9A.84.E6.8B.9B.E5.BC.8F" title="沙奈朵/第七世代招式表">Ⅶ</a></th></tr></tbody></table></th></tr></tbody></table></th></tr><tr class="bgl-妖精"><th style="min-width: 2em" data-sort-type="number" class="headerSort" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E7%AD%89%E7%BA%A7" title="等级">等级</a></th><th style="min-width: 2em" data-sort-type="number" class="hide headerSort" tabindex="0" role="columnheader button" title="升序排列"></th><th class="unsortable" style="min-width: 6em;"><a href="/wiki/%E6%8B%9B%E5%BC%8F" title="招式">招式</a></th><th style="min-width: 2.5em" class="headerSort" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E5%B1%9E%E6%80%A7" title="属性">属性</a></th><th class="headerSort" style="min-width: 2.5em" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E4%BC%A4%E5%AE%B3" title="伤害">分类</a></th><th style="min-width: 2.5em" data-sort-type="number" class="headerSort" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E5%A8%81%E5%8A%9B" title="威力">威力</a></th><th style="min-width: 2.5em" data-sort-type="number" class="headerSort" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E5%91%BD%E4%B8%AD" title="命中">命中</a></th><th style="min-width: 2.5em" data-sort-type="number" class="headerSort" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%EF%BC%B0%EF%BC%B0" title="ＰＰ">ＰＰ</a></th><th class="hide headerSort" style="min-width: 2.5em" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E5%AE%9D%E5%8F%AF%E6%A2%A6%E5%8D%8E%E4%B8%BD%E5%A4%A7%E8%B5%9B" title="宝可梦华丽大赛"><span title="华丽大赛">评分</span></a></th><th class="hide headerSort" style="min-width: 4.5em" data-sort-type="number" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E8%A1%A8%E6%BC%94" title="表演">表演</a></th><th class="hide headerSort" style="min-width: 4.5em" data-sort-type="number" tabindex="0" role="columnheader button" title="升序排列"><a href="/wiki/%E5%A6%A8%E5%AE%B3" title="妨害">妨害</a></th></tr></thead><tbody><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">进化</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E9%AD%94%E6%B3%95%E9%97%AA%E8%80%80%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="魔法闪耀（招式）">魔法闪耀</a></b><small><sup><span class="explain" original-title="向对手发射强光，并给予伤害。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>80</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E5%BF%B5%E5%8A%9B%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="念力（招式）">念力</a></b><small><sup><span class="explain" original-title="向对手发送微弱的念力进行攻击。有时会使对手混乱。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>50</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">25</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E9%AD%85%E6%83%91%E4%B9%8B%E5%A3%B0%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="魅惑之声（招式）">魅惑之声</a></b><small><sup><span class="explain" original-title="发出魅惑的叫声，给予对手精神上的伤害。攻击必定会命中。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>40</b></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">15</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E5%8F%AB%E5%A3%B0%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="叫声（招式）">叫声</a><small><sup><span class="explain" original-title="让对手听可爱的叫声，引开注意力使其疏忽，从而降低对手的攻击。">[详]</span></sup></small></td><td class="bg-一般 bd-一般 textwhite" style="border-width:1px;"><a href="/wiki/%E4%B8%80%E8%88%AC%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="一般（属性）">一般</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">40</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E6%92%92%E5%A8%87%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="撒娇（招式）">撒娇</a><small><sup><span class="explain" original-title="可爱地凝视，诱使对手疏忽大意，从而大幅降低对手的攻击。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">20</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E6%9C%88%E4%BA%AE%E4%B9%8B%E5%8A%9B%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="月亮之力（招式）">月亮之力</a></b><small><sup><span class="explain" original-title="借用月亮的力量攻击对手。有时会降低对手的特攻。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>95</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">15</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E6%B2%BB%E6%84%88%E4%B9%8B%E6%84%BF%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="治愈之愿（招式）">治愈之愿</a><small><sup><span class="explain" original-title="虽然自己陷入濒死，但可以治愈后备上场的宝可梦的异常状态以及回复ＨＰ。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E8%96%84%E9%9B%BE%E5%9C%BA%E5%9C%B0%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="薄雾场地（招式）">薄雾场地</a><small><sup><span class="explain" original-title="在５回合内，地面上的宝可梦不会陷入异常状态。龙属性招式的伤害也会减半。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E5%BD%B1%E5%AD%90%E5%88%86%E8%BA%AB%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="影子分身（招式）">影子分身</a><small><sup><span class="explain" original-title="通过快速移动来制造分身，扰乱对手，从而提高闪避率。">[详]</span></sup></small></td><td class="bg-一般 bd-一般 textwhite" style="border-width:1px;"><a href="/wiki/%E4%B8%80%E8%88%AC%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="一般（属性）">一般</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">15</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">—</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E9%AD%94%E6%B3%95%E9%97%AA%E8%80%80%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="魔法闪耀（招式）">魔法闪耀</a></b><small><sup><span class="explain" original-title="向对手发射强光，并给予伤害。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>80</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">9</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E5%82%AC%E7%9C%A0%E6%9C%AF%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="催眠术（招式）">催眠术</a><small><sup><span class="explain" original-title="施以诱导睡意的暗示，让对手陷入睡眠状态。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">60</td><td style="border:1px solid#D8D8D8">20</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">12</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E5%90%B8%E5%8F%96%E4%B9%8B%E5%90%BB%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="吸取之吻（招式）">吸取之吻</a></b><small><sup><span class="explain" original-title="用一个吻吸取对手的ＨＰ。回复给予对手伤害的一半以上的ＨＰ。">[详]</span></sup></small></td><td class="bg-妖精 bd-妖精 textwhite" style="border-width:1px;"><a href="/wiki/%E5%A6%96%E7%B2%BE%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="妖精（属性）">妖精</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>50</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">15</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E7%9E%AC%E9%97%B4%E7%A7%BB%E5%8A%A8%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="瞬间移动（招式）">瞬间移动</a><small><sup><span class="explain" original-title="停止和野生宝可梦战斗并逃走。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">20</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">18</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E5%B9%BB%E8%B1%A1%E5%85%89%E7%BA%BF%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="幻象光线（招式）">幻象光线</a></b><small><sup><span class="explain" original-title="向对手发射神奇的光线进行攻击。有时会使对手混乱。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>65</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">20</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">23</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E7%94%9F%E5%91%BD%E6%B0%B4%E6%BB%B4%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="生命水滴（招式）">生命水滴</a><small><sup><span class="explain" original-title="喷洒出神奇的水，回复自己和场上同伴的ＨＰ。">[详]</span></sup></small></td><td class="bg-水 bd-水 textwhite" style="border-width:1px;"><a href="/wiki/%E6%B0%B4%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="水（属性）">水</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">28</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E7%A5%88%E6%84%BF%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="祈愿（招式）">祈愿</a><small><sup><span class="explain" original-title="在下一回合回复自己或是替换出场的宝可梦最大ＨＰ的一半。">[详]</span></sup></small></td><td class="bg-一般 bd-一般 textwhite" style="border-width:1px;"><a href="/wiki/%E4%B8%80%E8%88%AC%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="一般（属性）">一般</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">35</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E5%86%A5%E6%83%B3%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="冥想（招式）">冥想</a><small><sup><span class="explain" original-title="静心凝神，从而提高自己的特攻和特防。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">20</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">42</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E7%B2%BE%E7%A5%9E%E5%BC%BA%E5%BF%B5%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="精神强念（招式）">精神强念</a></b><small><sup><span class="explain" original-title="向对手发送强大的念力进行攻击。有时会降低对手的特防。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>90</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">49</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><a href="/wiki/%E6%B2%BB%E6%84%88%E6%B3%A2%E5%8A%A8%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="治愈波动（招式）">治愈波动</a><small><sup><span class="explain" original-title="放出治愈波动，从而回复对手最大ＨＰ的一半。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-变化 ts-变化 bd-变化" style="border-width:1px"><a href="/wiki/%E5%8F%98%E5%8C%96%E6%8B%9B%E5%BC%8F" title="变化招式"><span class="bg-变化 ts-变化">变化</span></a></td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">—</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">56</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E9%A3%9F%E6%A2%A6%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="食梦（招式）">食梦</a></b><small><sup><span class="explain" original-title="吃掉正在睡觉的对手的梦进行攻击。回复对手所受到伤害的一半ＨＰ。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>100</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">15</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="at-c bgwhite"><td style="border:1px solid#D8D8D8">63</td><td style="display: none">—</td><td style="border:1px solid#D8D8D8"><b><a href="/wiki/%E9%A2%84%E7%9F%A5%E6%9C%AA%E6%9D%A5%EF%BC%88%E6%8B%9B%E5%BC%8F%EF%BC%89" title="预知未来（招式）">预知未来</a></b><small><sup><span class="explain" original-title="在使用招式２回合后，向对手发送一团念力进行攻击。">[详]</span></sup></small></td><td class="bg-超能力 bd-超能力 textwhite" style="border-width:1px;"><a href="/wiki/%E8%B6%85%E8%83%BD%E5%8A%9B%EF%BC%88%E5%B1%9E%E6%80%A7%EF%BC%89" title="超能力（属性）">超能力</a></td><td class="bg-特殊 ts-特殊 bd-特殊" style="border-width:1px"><a href="/wiki/%E7%89%B9%E6%AE%8A%E6%8B%9B%E5%BC%8F" title="特殊招式"><span class="bg-特殊 ts-特殊">特殊</span></a></td><td style="border:1px solid#D8D8D8"><b>120</b></td><td style="border:1px solid#D8D8D8">100</td><td style="border:1px solid#D8D8D8">10</td><td class="hide"></td><td class="hide"></td><td class="hide"></td></tr><tr class="sortbottom"><td class="roundybottom-6 bgl-妖精" style="font-size:90%;line-height:10px;" colspan="7"><ul><li>点击表格头部的罗马数字可以查看其它世代的招式表。</li><li><b>粗体字</b>的招式为具有<a href="/wiki/%E5%B1%9E%E6%80%A7%E4%B8%80%E8%87%B4%E5%8A%A0%E6%88%90" title="属性一致加成">属性一致加成</a>效果的招式。</li><li><i>斜体字</i>的招式为进化形或<a href="/wiki/%E5%BD%A2%E6%80%81%E5%8F%98%E5%8C%96" title="形态变化">其它形态</a>使用具有<a href="/wiki/%E5%B1%9E%E6%80%A7%E4%B8%80%E8%87%B4%E5%8A%A0%E6%88%90" title="属性一致加成">属性一致加成</a>效果的招式。</li><li>等级中的“—”表示此招式能通过<a href="/wiki/%E6%8B%9B%E5%BC%8F%E6%95%99%E5%AD%B8%E7%8B%82" title="招式教学狂">招式教学</a>习得。</li></ul></td></tr></tbody><tfoot></tfoot></table>			' }]);
  }
}

module.exports = PokemonController;
