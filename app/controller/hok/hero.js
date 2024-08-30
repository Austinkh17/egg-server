const Controller = require('../common');
const moment = require('moment');
const fs = require('fs');

class HeroController extends Controller {
  async spiderHero() {
    const result = await this.service.hok.spiderHeroList();
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        await this.service.hok.saveHero(result[i])
      }
    }
    return this.ctx.body = {
      code: 200,
      message: '英雄数据更新成功'
    }
  }

  // 每个英雄添加字段isRework、tagId、pubTime
  async spiderHeroTime() {
    const result1 = await this.service.hok.getHeroTime();
    if (result1.length) {
      for (let i = 0; i < result1.length; i++) {
        await this.service.hok.saveHeroTime(result1[i])
      }
      return this.ctx.body = {
        code: 200,
        message: '英雄isRework、tagId、pubTime数据更新成功'
      }
    }
    else {
      console.log('111err', this.logger)
      return this.ctx.body = {
        code: 200,
        message: this.logger
      }
    }
  }

  // 每个皮肤添加字段tagId
  async spiderSkinTagId() {
    await this.service.hok.spiderSkinTagId()
    return this.ctx.body = {
      code: 200,
      message: '更新成功'
    }
  }

  async spiderSkinImg() {
    await this.service.hok.getSkinImg()
  }

  async spiderSkinIcon() {
    await this.service.hok.spiderSkinIcon()
  }

  async addSkinIcon() {
    await this.service.hok.addSkinIcon()
  }

  async getHeroList() {
    let { ctx, app } = this
    let { sort, sortIndex, pageSize, currentPage, username } = ctx.query
    const skipNum = (Number(currentPage) - 1) * Number(pageSize)
    let query = ctx.query
    delete query.sort
    delete query.sortIndex
    delete query.pageSize
    delete query.currentPage
    delete query.username
    let sortParams = {}
    sortParams[sort] = sortIndex
    if (!sortParams.hasOwnProperty('online_time')) sortParams['online_time'] = -1
    sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
    if (query.hasOwnProperty('role')) {
      let arr = query.role.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ hero_type: i }, { hero_type2: i })
      })
      delete query.role
    }
    if (query.hasOwnProperty('cname')) {
      let arr = query.cname.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ cname: i })
      })
      delete query.cname
    }
    if (query.hasOwnProperty('skinNum')) {
      let arr = query.skinNum.split(',')
      // !query['$or'] && (query['$or'] = [])
      // arr.forEach(i => {
      //   if (i === '星传说') {
      //     query['$or'].push({ abbr_skin_desc: { $nin: /0星传说/ } })
      //   } else if (i === '星史诗') {
      //     query['$or'].push({ abbr_skin_desc: { $nin: /0星史诗/ } })
      //   } else {
      //     query['$or'].push({ abbr_skin_desc: new RegExp(i, 'i') })
      //   }
      // })
      !query['$and'] && (query['$and'] = [])
      arr.forEach(i => {
        if (i === '星传说') {
          query['$and'].push({ abbr_skin_desc: { $nin: /0星传说/ } })
        } else if (i === '星史诗') {
          query['$and'].push({ abbr_skin_desc: { $nin: /0星史诗/ } })
        } else {
          query['$and'].push({ abbr_skin_desc: new RegExp(i, 'i') })
        }
      })
      delete query.skinNum
    }
    console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, Number(pageSize), JSON.stringify(query))
    await Promise.all([
      app.model.Hero.count(query),
      app.model.Hero.find(query).collation({ "locale": "zh", numericOrdering: true }).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
    ])
      .then((data) => {
        data[1].forEach(list => {
          list.skins.forEach(async i => {
            let obj = await this.fsImg(list.cname, i.skin_title, i)
            i.imgS = obj.imgS
            // i.imgM = obj.imgM
            // i.imgL = obj.imgL
            // if (i.skin_title === "齐天大圣") {
            //   console.log('112aa', i.imgS)
            // }
          })
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

  async getAllSkins() {
    let { ctx, app } = this
    let { sort, sortIndex, pageSize, currentPage, username } = ctx.query
    const skipNum = (Number(currentPage) - 1) * Number(pageSize)
    let query = ctx.query
    delete query.sort
    delete query.sortIndex
    delete query.pageSize
    delete query.currentPage
    delete query.username
    let sortParams = {}
    sortParams[sort] = sortIndex
    if (!sortParams.hasOwnProperty('online_time')) sortParams['online_time'] = -1
    sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
    if (query.hasOwnProperty('role')) {
      let arr = query.role.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ hero_type: i }, { hero_type2: i })
      })
      delete query.role
    }
    console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, Number(pageSize), JSON.stringify(query))
    await app.model.Hero.find()
      .then(async (data) => {
        let all = []
        data.forEach(async hero => {
          hero.skins.forEach(async skin => {
            if (skin.isXingyuan) {
              skin.hero_title = hero.cname
            }
            all.push(skin)
          })
        })
        let sortSkins = all.sort((a, b) => moment(b.online_time_str, 'YYYY/MM/DD').valueOf() - moment(a.online_time_str, 'YYYY/MM/DD').valueOf())
        let filterSkins = sortSkins
        for (let key in query) {
          filterSkins = filterSkins.filter(v => {
            if (key === 'quality') {
              return v[key] === query[key]
            } else {
              return v[key] && v[key].indexOf(query[key]) > -1
            }
          })
          console.log('查询参数1', JSON.stringify(query), key, query[key])
        }
        let allSkins = filterSkins.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        allSkins.forEach(async list => {
          let obj = await this.fsImg(list.hero_title, list.skin_title, list)
          list.imgS = obj.imgS
        })
        return ctx.body = {
          code: 200,
          data: allSkins,
          total: filterSkins.length,
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

  async statisticSkin() {
    const { app } = this
    const qualityMap = {
      SS: 16,
      SA: 12,
      S: 8,
      XS: 6,
      A: 4,
      XA: 2,
      B: 1,
      C: 0,
      D: 0
    }
    await app.model.Hero.find()
      .then((res) => {
        res.forEach(async (item) => {
          console.log('111i', item.cname)
          const skins = await app.model.Skin.find({ hero_title: item.cname, status: { $ne: "待上线" } }).sort({ 'online_time_str': -1 })
          // const skins = await app.model.Skin.find({ hero_title: item.cname, quality: { $ne: 'D' }, status: { $ne: "待上线" } }).sort({ 'online_time_str': -1 })
          let skinXingyuan = []
          let total_skin_score = 0
          let total_xingyuan_score = 0
          let skin_desc = ''
          let abbr_skin_desc = ''
          let skinsNew = []
          let skinMap = {
            SS: { num: 0, skins: [], text: '荣耀典藏' },
            SA: { num: 0, skins: [], text: '无双' },
            '限定传说': { num: 0, skins: [], text: '限定传说' },
            S: { num: 0, skins: [], text: '直售传说' },
            '星传说': { num: 0, skins: [], text: '星传说' },
            '限定史诗': { num: 0, skins: [], text: '限定史诗' },
            A: { num: 0, skins: [], text: '直售史诗' },
            '星史诗': { num: 0, skins: [], text: '星史诗' },
            '限定勇者': { num: 0, skins: [], text: '限定勇者' },
            B: { num: 0, skins: [], text: '直售勇者' },
            C: { num: 0, skins: [], text: '伴生' }
          }
          let last_skin = {}
          let last_skin_time = 0
          // let female = ['少司缘', '夏洛特', '阿古朵', '朵莉亚', '芈月', '钟无艳', '姬小满', '雅典娜', '花木兰', '镜', '娜可露露', '阿轲', '露娜', '云缨', '嫦娥', '上官婉儿', '不知火舞', '貂蝉', '海月', '西施', '米莱狄', '杨玉环', '女娲', '王昭君', '安琪拉', '武则天', '甄姬', '妲己', '小乔', '戈娅', '艾琳', '伽罗', '公孙离', '虞姬', '孙尚香', '瑶', '大乔', '蔡文姬']
          // let gender = ''
          // if (female.includes(item.cname)) {
          //   gender = '女'
          // } else {
          //   gender = '男'
          // }
          if (skins.length) {
            skins.forEach((skin, skinIndex) => {
              skin.online_time = moment(skin.online_time_str, 'YYYY/MM/DD').valueOf() / 1000
              let skin_score = 0
              skin.skinIndex = skins.length - skinIndex + 1
              skin.timeBetween = 'XX'
              //  勇者皮有新语音加分，史诗皮有回城、动态封面加分
              if (skin.skin_title === '圣诞老人' || skin.skin_title === '千年之狐' || (skin.skin_title === '末日机甲' && skin.hero_title === '吕布') ||
                skin.skin_title === '苍穹之光' || skin.skin_title === '龙骑士' || skin.skin_title === '暗夜猫娘' || skin.skin_title === '海滩丽影') skin_score += 1
              if (skin.skin_title === '电玩小子') skin_score += 1
              //  史诗标签勇者品质减分
              if (skin.skin_title === '魅力维加斯' || skin.skin_title === '皇家上将' || skin.skin_title === '王者之锤' ||
                skin.skin_title === '魔术师' || skin.skin_title === '乱世虎臣') skin_score -= 2
              if (skin.xingyuan_skin.length) {
                skin.xingyuan_skin.forEach(xingyuan => {
                  let xingyuan_score = 0
                  const quality = xingyuan.class_names.indexOf("星传说") > -1 ? '星传说' : xingyuan.post ? '星史诗' : (xingyuan.skin_title.indexOf("武器") > -1 && xingyuan.num === 1) ? '星元武器' : '普通星元'
                  if (quality === '星传说') {
                    xingyuan_score += 6
                  }
                  if (quality === '星史诗') {
                    xingyuan_score += 2
                  }
                  skinXingyuan.push({
                    online_time_str: xingyuan.online_time_str,
                    gain_way: xingyuan.gain_way,
                    skin_title: xingyuan.skin_title,
                    class_names: xingyuan.class_names,
                    suit: xingyuan.suit,
                    post: xingyuan.post,
                    point: xingyuan.point,
                    num: xingyuan.num,
                    icon: xingyuan.icon,
                    isXingyuan: true,
                    online_time: moment(xingyuan.online_time_str, 'YYYY/MM/DD').valueOf() / 1000,
                    quality: quality,
                    skinScore: xingyuan_score
                  })
                  total_xingyuan_score += xingyuan_score
                })
              }
              if (skin.class_names && skin.class_names.includes('限定') && (skin.quality === 'S' || skin.quality === 'A')) skin_score += 1
              skin_score += qualityMap[skin.quality]
              skin.skinScore = skin_score
              total_skin_score += skin_score
            })
            skin_desc = `皮肤共${skins.length}款，其中`
            // 计算时间差
            let skinsDistance = skins.concat(skinXingyuan).sort((a, b) => a.online_time - b.online_time)
            let prevTime = item.online_time
            skinsDistance.forEach((skin, skinIndex) => {
              // if (item.cname === '孙尚香') {
              //   console.log('111孙尚香：', prevTime, skin.online_time)
              // }
              skin.timeBetween = this.service.hok.timediff(prevTime, skin.online_time)
              prevTime = skin.online_time
            })
            // 皮肤加星元
            skinsNew = skinsDistance.sort((a, b) => b.online_time - a.online_time)
            // if (item.cname === '孙悟空') {
            // console.log('111孙悟空：', skinsNew, skin_desc)
            // }
            skinsNew.forEach((skin, skinIndex) => {
              if (skin.class_names && skin.class_names.includes('限定') && skin.quality === 'S') {
                skinMap['限定传说'].num += 1
                skinMap['限定传说'].skins.push({ skin_title: skin.skin_title, class_names: skin.class_names })
              } else if (skin.class_names && skin.class_names.includes('限定') && skin.quality === 'A') {
                skinMap['限定史诗'].num += 1
                skinMap['限定史诗'].skins.push({ skin_title: skin.skin_title, class_names: skin.class_names })
              } else if (skin.class_names && skin.class_names.includes('限定') && skin.quality === 'B') {
                skinMap['限定勇者'].num += 1
                skinMap['限定勇者'].skins.push({ skin_title: skin.skin_title, class_names: skin.class_names })
              } else if (skinMap[skin.quality]) {
                skinMap[skin.quality].num += 1
                skinMap[skin.quality].skins.push({ skin_title: skin.skin_title, class_names: skin.class_names })
              }
            })
            let temp = null
            Object.values(skinMap).forEach(skin => {
              let text_skin = skin.skins.map(i => i.skin_title).join('、')
              const text_end = skin.num > 0 ? '(' + text_skin + ')，' : '，'
              skin_desc += skin.text + skin.num + '款' + text_end
              if (skin.text === '荣耀典藏') {
                abbr_skin_desc += skin.num + '典藏'
              } else if (skin.text === '无双') {
                abbr_skin_desc += skin.num + '无双'
              } else if (skin.text === '限定传说') {
                temp = skin.num
              } else if (skin.text === '直售传说') {
                abbr_skin_desc += (temp + skin.num) + '传说'
              } else if (skin.text === '星传说') {
                abbr_skin_desc += skin.num + '星传说'
              } else if (skin.text === '限定史诗') {
                temp = skin.num
              } else if (skin.text === '直售史诗') {
                abbr_skin_desc += (temp + skin.num) + '史诗'
              } else if (skin.text === '星史诗') {
                abbr_skin_desc += skin.num + '星史诗'
              } else if (skin.text === '限定勇者') {
                temp = skin.num
              } else if (skin.text === '直售勇者') {
                abbr_skin_desc += (temp + skin.num) + '勇者'
              } else if (skin.text === '伴生') {
                abbr_skin_desc += skin.num + '伴生'
              }
            })
            skin_desc = skin_desc.substring(0, skin_desc.length - 1)
            abbr_skin_desc = abbr_skin_desc || '无皮肤'
            // if (item.cname === '孙悟空') {
            //   console.log('111a', skinsNew, skin_desc)
            // }
            const last_skin_time_str = this.service.hok.timediff(moment(skinsNew[0].online_time_str, 'YYYY/MM/DD').valueOf() / 1000, Date.parse(new Date()) / 1000)
            last_skin = {
              class_names: skinsNew[0].class_names,
              quality: skinsNew[0].quality,
              skin_title: skinsNew[0].skin_title,
              last_skin_time_str
            }
            const diff = Date.parse(new Date()) / 1000 - moment(skinsNew[0].online_time_str, 'YYYY/MM/DD').valueOf() / 1000
            last_skin_time = Math.floor(diff / (24 * 3600))
          }
          const total_score = total_skin_score + total_xingyuan_score
          const online_time = moment(item.online_time_str, 'YYYY/MM/DD').valueOf() / 1000
          const hero_time = Math.floor((Date.parse(new Date()) / 1000 - online_time) / (24 * 3600))
          const skin_score_average = total_skin_score / hero_time
          const total_score_average = total_score / hero_time
          await this.ctx.model.Hero.updateOne({ cname: item.cname }, {
            $set:
            {
              skins: skinsNew, total_skin_score, total_xingyuan_score, total_score, skin_desc, abbr_skin_desc, online_time, last_skin, last_skin_time, skin_score_average, total_score_average, hero_time
            }
          })
        })
        return this.ctx.body = {
          code: 200,
          message: '统计皮肤更新成功'
        }
      })
      .catch((err) => {
        this.logger.error(err)
        console.log('111', err)
        return []
      })
  }

  async getImg() {
    let { ctx } = this
    let { skin } = ctx.request.body

    let i = {}
    let obj = await this.fsAllImg(skin.hero_title, skin.skin_title, skin)
    i.imgS = obj.imgS
    i.imgM = obj.imgM
    i.imgL = obj.imgL
    // if (i.skin_title === "齐天大圣") {
    //   console.log('112aa', i.imgS)
    // }

    return this.ctx.body = {
      code: 200,
      data: i,
      message: '获取图片成功'
    }
  }

  async getSkinIcon() {
    let { ctx } = this
    let { icon } = ctx.query
    let path = 'db/skinIcon/' + icon + '.png'
    if (fs.existsSync(path)) {
      ctx.set('content-type', 'image/png')
      return ctx.body = fs.createReadStream(path);
    }
  }
}

module.exports = HeroController;