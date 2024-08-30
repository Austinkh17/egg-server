const Controller = require('../common');
const fs = require('fs');

class SkinController extends Controller {
  async spiderSkin() {
    const result = await this.service.hok.spiderSkinList();
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        await this.service.hok.saveSkin(result[i])
      }
      return this.ctx.body = {
        code: 200,
        message: '皮肤数据更新成功',
      }
    }
  }

  async getSkinList() {
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
    if (!sortParams.hasOwnProperty('online_time_str')) sortParams['online_time_str'] = -1
    sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
    if (query.hasOwnProperty('skin_title')) {
      const reg = new RegExp(query.skin_title, 'i')
      const regex = { $regex: reg }
      query['$or'] = [
        { skin_title: regex }
      ]
      delete query.skin_title
    }
    if (query.hasOwnProperty('series')) {
      const reg = new RegExp(query.series, 'i')
      const regex = { $regex: reg }
      query['$or'] = [
        { series: regex }
      ]
      delete query.series
    }
    if (query.hasOwnProperty('hero_title')) {
      let arr = query.hero_title.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ hero_title: i })
      })
      delete query.hero_title
    }
    if (query.hasOwnProperty('class_names')) {
      let arr = query.class_names.split(',')
      !query['$and'] && (query['$and'] = [])
      arr.forEach(i => {
        if (i === '直售') {
          query['$and'].push({ $nor: [{ class_names: new RegExp('限定', 'i') }] })
        } else {
          query['$and'].push({ class_names: new RegExp(i, 'i') })
        }
      })
      delete query.class_names
      // 并行搜索
      // arr = arr.map(i => {
      //     return new RegExp(i, 'i') 
      // })
      // query.class_names = { $all: arr }
    }
    if (query.hasOwnProperty('quality')) {
      let arr = query.quality.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ quality: i })
      })
      delete query.quality
    }
    //  过滤原皮
    // query.quality = { $ne: 'D' }
    const qualityMap = {
      SS: 6,
      S: 5,
      A: 4,
      B: 3,
      C: 2,
      D: 1
    }
    console.log('查询参数', sortParams, JSON.stringify(query))
    await Promise.all([
      app.model.Skin.count(query),
      sortParams.quality ? app.model.Skin.find(query).collation({ "locale": "en_US", numericOrdering: true }).sort(sortParams).skip(skipNum).limit(Number(pageSize)) : app.model.Skin.find(query).collation({ "locale": "zh", numericOrdering: true }).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
      // app.model.User.find({username: username}),
    ])
      .then((data) => {
        data[1].forEach(async list => {
          let obj = await this.fsImg(list.hero_title, list.skin_title, list)
          list.imgS = obj.imgS
          // list.imgM = obj.imgM
          // list.imgL = obj.imgL
          // if (list.skin_title === "齐天大圣") {
          //   console.log('齐天大圣:', list.imgS)
          // }
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

  async updateSkinAttr() {
    let { ctx, app } = this
    let { skin_id, class_names, quality, username } = ctx.request.body
    const user = await app.model.User.findOne({ username: username })
    if (user) {
      if (user.role == 'admin') {
        if (await app.model.Skin.findOne({ skin_id: skin_id })) {
          let params = quality ? { quality: quality } : { class_names: class_names }
          console.log('更新参数', skin_id, class_names, quality, params);
          await app.model.Skin.updateOne({ skin_id: skin_id }, { $set: params })
          return this.ctx.body = {
            code: 200,
            message: '更新成功'
          }
        } else {
          return this.ctx.body = {
            code: 1,
            message: '查找失败'
          }
        }
      } else {
        return this.ctx.body = {
          code: 1,
          message: '该用户无权限'
        }
      }
    } else {
      return this.ctx.body = {
        code: 1,
        message: '未找到该用户'
      }
    }
  }

  async updateUserSkinsAttr() {
    let { ctx, app } = this
    const req = ctx.request.body
    const user = await app.model.User.findOne({ username: req.username })
    if (user) {
      const index = user.skins.map(i => i.skin_id).indexOf(req.skin_id)
      if (index > -1) {
        await app.model.User.updateOne({ username: req.username, 'skins.skin_id': req.skin_id }, { $set: { 'skins.$.personal_possess': req.personal_possess || user.skins[index].personal_possess, 'skins.$.personal_gain_way': req.personal_gain_way || user.skins[index].personal_gain_way, 'skins.$.personal_intention': req.personal_intention || user.skins[index].personal_intention } })
        return this.ctx.body = {
          code: 200,
          message: '更新成功'
        }
      } else {
        return this.ctx.body = {
          code: 1,
          message: '查找失败'
        }
      }
    } else {
      return this.ctx.body = {
        code: 1,
        message: '未找到该用户'
      }
    }
  }

  // 更新原皮的时间
  async addSkinNewField() {
    const { app } = this
    await app.model.Skin.find()
      .then((res) => {
        res.forEach(async (item) => {
          if (item.quality === 'D' && item.online_time == 0) {
            let hero = await app.model.Hero.findOne({ cname: item.hero_title })
            await app.model.Skin.updateOne({ skin_id: item.skin_id }, { $set: { online_time: hero.online_time, online_time_str: hero.online_time_str } })
              .then((res) => {
              })
              .catch((err) => {
                this.logger.error(err)
                console.log('111', err);
              })
          }
        })
      })
      .catch((err) => {
        this.logger.error(err)
        return []
      })
  }

  async getMaterial() {
    let tagId = this.ctx.request.body.tagId
    let type = this.ctx.request.body.type
    await this.service.hok.getMaterial(tagId, type)
  }
}

module.exports = SkinController;