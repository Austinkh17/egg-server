const Service = require('egg').Service;
const moment = require('moment');
const fs = require('fs');
// const request = require('request');
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
let auth = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjUwODY2MzEuNzgwNDM0LCJpYXQiOjE3MjUwMDAyMzEuNzgwNDM0LCJpc3MiOiJ0ZW5jZW50IiwiY3VzdG9tIjp7ImlkIjoxMjE5MywiYml6IjozOTcsInVzZXJJZCI6MTg0NDkxMzAxNSwiaXNBdXRoIjowLCJpc1BveGlhb0F1dGgiOjAsInJvbGUiOjAsInBveGlhb1JvbGUiOjB9fQ.7QEOGkgCwIrIwfVyunRJPvyjDCjwA4MzYCTzm40DBjI77R1gK3RmKq4JMVjj2OHSbpAPOpnJ3b4AEAyEW7jgtg'
class SkinService extends Service {
  async spiderSkinList() {
    let res = [];
    await this.ctx.curl('https://ricochet.cn/api/skin/score', {
      dataType: 'json',
    })
      .then(result => {
        if (result.status === 200 && result.data.status === 1) {
          res = result.data.data;
        }
      })
      .catch(error => {
        this.logger.error(error);
      });
    return res;
  }

  async saveSkin(list) {
    const { app } = this;
    if (await app.model.Skin.findOne({ skin_id: list.skin_id })) {
      await app.model.Skin.updateOne({ skin_id: list.skin_id }, {
        $set:
        {
          vote_count: list.vote_count,
          score: list.score,
          nga_tid: list.nga_tid,
          official_url: list.official_url,
        },
      });
    } else {
      if (await app.model.Skin.findOne({ skin_title: list.skin_title, hero_title: list.hero_title })) {
        await app.model.Skin.updateOne({ skin_title: list.skin_title, hero_title: list.hero_title }, {
          $set:
          {
            vote_count: list.vote_count,
            score: list.score,
            nga_tid: list.nga_tid,
            official_url: list.official_url,
            skin_id: list.skin_id,
            online_time: list.online_time,
          },
        });
      } else {
        await app.model.Skin.create({
          ...list,
          gain_way: '',
          xingyuan_skin: [],
          online_time_str: moment(list.online_time * 1000).format('YYYY/MM/DD'),
        });
      }
      await app.model.User.find().then(async res => {
        res.forEach(async user => {
          await app.model.User.updateOne({ username: user.username }, {
            $push: {
              skins: {
                skin_id: list.skin_id,
                personal_gain_way: '',
                personal_intention: 'D',
                personal_possess: false,
              },
            },
          });
        });
      });
    }
    return this.ctx.body = {
      code: 200,
      message: '更新皮肤数据成功',
    };

  }

  async spiderHeroList() {
    let res = [];
    // 获取字段ename、cname、title、hero_type、hero_type2、id_name,
    await this.ctx.curl('https://pvp.qq.com/web201605/js/herolist.json', {
      dataType: 'json',
    })
      .then(result => {
        if (result.status === 200) {
          res = result.data;
        }
      })
      .catch(error => {
        this.logger.error(error);
      });
    return res;
  }

  async saveHero(list) {
    const { app } = this;
    if (!await app.model.Hero.findOne({ ename: list.ename })) {
      await app.model.Hero.create({
        ...list,
        iconUrl: 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/' + list.ename + '/' + list.ename + '.jpg'
      });
    } else {
      await app.model.Hero.updateOne({ ename: list.ename }, { $set: { hero_type: list.hero_type, hero_type2: list.hero_type2 } })
    }
  }

  async getHeroTime() {
    let res = [];
    // 获取字段isRework、tagId、pubTime
    await this.ctx.curl('https://icreate.native.qq.com/pvp/hero/list', {
      method: 'POST',
      dataType: 'json',
      // token需要去网站登录更新
      headers: {
        'Authorization': auth,
      }
    })
      .then(result => {
        console.log('111r', result)
        if (result.data.ret === 0) {
          res = result.data.data.list
        } else {
          console.log('111e1', result.data.msg)
          this.logger.error(result.data.msg)
          return this.ctx.body = {
            code: 200,
            message: this.logger
          }
        }
      })
      .catch(error => {
        console.log('111e', error)
        this.logger.error(error)
      })
    return res
  }

  // 从素材库获取海报、头像、半身像 
  async getSkinImg() {
    await this.app.model.Hero.find().then(async res => {
      for (let i = 0; i < res.length; i++) {
        if (res[i].cname.indexOf('元流之子') > -1) {
          res[i].cname = '元流之子'
        }
        if (!res[i].tagId) {
          continue;
        }
        await this.ctx.curl('https://icreate.native.qq.com/pvp/tag/list', {
          method: 'POST',
          dataType: 'json',
          contentType: 'json',
          data: { 'pid': res[i].tagId },
          // token需要去网站登录更新
          headers: {
            'Authorization': auth
          },
        })
          .then(async result => {
            // console.log('111r', result, result.data.ret)
            if (result.data.ret === 0) {
              if (result.data.data.list.length) {
                let ids = result.data.data.list.map(a => a.id)
                ids.push(res[i].tagId)
                let idStr = ids.join()
                await this.ctx.curl('https://icreate.native.qq.com/pvp/material/list', {
                  method: 'POST',
                  dataType: 'json',
                  contentType: 'json',
                  // token需要去网站登录更新
                  headers: {
                    'Authorization': auth
                  },
                  data: {
                    "page": 1,
                    "pageSize": 500,
                    "tagId": idStr,
                    "comType": "15"
                  }
                })
                  .then(async result1 => {
                    // console.log('111r1', result1)
                    if (result1.data.ret === 0) {
                      if (result1.data.data.list.length) {
                        if (fs.existsSync('db/hok/' + res[i].cname)) {
                          for (let j = 0; j < result1.data.data.list.length; j++) {
                            if ((res[i].cname === '安琪拉' && result1.data.data.list[j].title.indexOf('橙色警戒') > -1) || (res[i].cname === '赵云' && result1.data.data.list[j].title.indexOf('玄秘纪元') > -1) || (res[i].cname === '钟无艳' && result1.data.data.list[j].title.indexOf('春野之语') > -1)) {
                            } else {
                              let path = 'db/hok/' + res[i].cname + '/' + result1.data.data.list[j].title + '.' + result1.data.data.list[j].format
                              if (fs.existsSync(path)) {
                              } else {
                                console.log('111aa', path)
                                let url = result1.data.data.list[j].url ? result1.data.data.list[j].url : result1.data.data.list[j].cover
                                await this.ctx.curl(url, {
                                  streaming: true,
                                }).then(img => {
                                  img.res.pipe(require('fs').createWriteStream(path))
                                })
                              }
                            }
                          }
                        } else {
                          fs.mkdir('db/hok/' + res[i].cname, async (err) => {
                            if (err) throw err;
                            for (let j = 0; j < result1.data.data.list.length; j++) {
                              let path = 'db/hok/' + res[i].cname + '/' + result1.data.data.list[j].title + '.' + result1.data.data.list[j].format
                              if (fs.existsSync(path)) {
                              } else {
                                console.log('111aa', path)
                                let url = result1.data.data.list[j].url ? result1.data.data.list[j].url : result1.data.data.list[j].cover
                                await this.ctx.curl(url, {
                                  streaming: true,
                                }).then(img => {
                                  img.res.pipe(require('fs').createWriteStream(path))
                                })
                              }
                            }
                          })
                        }
                      }
                    } else {
                      this.logger.error(result.data.msg)
                      return this.ctx.body = {
                        code: 200,
                        message: this.logger
                      }
                    }
                  })
                  .catch(error => {
                    this.logger.error(error)
                  })
              }
            } else {
              this.logger.error(result.data.msg)
              return this.ctx.body = {
                code: 200,
                message: this.logger
              }
            }
          })
          .catch(error => {
            this.logger.error(error)
          })
      }
    })
  }

  async saveHeroTime(list) {
    const { app } = this;
    let arr = list.name.split(' ')
    let name = arr[1] === '后裔' ? '后羿' : arr[1]
    if (name === '元流之子') {
      name = '元流之子·坦克'
    }
    let online_time_str = list.pubTime.replace(/-/g, '/')
    await app.model.Hero.updateOne({ cname: name }, { $set: { isRework: list.isRework, tagId: list.tagId, online_time_str: online_time_str } })
  }

  // 每个皮肤添加字段tagId
  async spiderSkinTagId() {
    await this.app.model.Hero.find().then(async res => {
      for (let i = 0; i < res.length; i++) {
        if (res[i].cname.indexOf('元流之子') > -1) {
          res[i].cname = '元流之子'
        }
        if (!res[i].tagId) {
          continue;
        }
        let needTagId = res[i].skins.filter(i => i.quality !== 'D').some(i => !i.tagId)
        if (!needTagId) {
          continue;
        }
        let skinTitleArr = res[i].skins.filter(i => i.quality !== 'D' && !i.tagId).map(i => i.skin_title)
        await this.ctx.curl('https://icreate.native.qq.com/pvp/tag/list', {
          method: 'POST',
          dataType: 'json',
          contentType: 'json',
          data: { "biz": "397", 'pid': res[i].tagId },
          // token需要去网站登录更新
          headers: {
            'Authorization': auth
          },
        })
          .then(async result => {
            if (result.data.ret === 0) {
              if (result.data.data.list.length) {
                for (let a = 0; a < skinTitleArr.length; a++) {
                  for (let b = 0; b < result.data.data.list.length; b++) {
                    if (result.data.data.list[b].name === skinTitleArr[a]) {
                      await this.app.model.Skin.updateOne({ skin_title: skinTitleArr[a], hero_title: res[i].cname }, {
                        $set:
                        {
                          tagId: result.data.data.list[b].id,
                        },
                      });
                      console.log('111', res[i].cname, skinTitleArr[a], result.data.data.list[b].id);
                    }
                  }
                }
              }
            } else {
              this.logger.error(result.data.msg)
              return this.ctx.body = {
                code: 200,
                message: this.logger
              }
            }
          })
          .catch(error => {
            this.logger.error(error)
          })
      }
    })
  }

  // 计算两个时间的间隔，返回x年x天
  timediff(starttime, endtime) {
    // 计算天数
    let timediff = endtime - starttime
    let days = parseInt(timediff / 86400)
    let res = ''
    if (days >= 365) {
      let years = Math.floor(days / 365)
      let newdays = days - years * 365
      res = years + '年' + newdays + '天'
    } else {
      res = days + '天'
    }
    return res
  }

  // 获取某皮肤的素材，14视频，16台词 
  async getMaterial(tagId, type) {
    await this.ctx.curl('https://icreate.native.qq.com/pvp/material/list', {
      method: 'POST',
      dataType: 'json',
      contentType: 'json',
      data: {
        biz: "397", pageSize: 100, comType: type, tagId: tagId
      },
      // token需要去网站登录更新
      headers: {
        'Authorization': auth
      },
    })
      .then(async result => {
        if (result.data.ret === 0) {
          if (result.data.data.list.length) {
            if (type === '14') {
              result.data.data.list.forEach(a => {
                if (a.title.indexOf('动态') > -1) {
                  return this.ctx.body = {
                    code: 200,
                    data: a.url,
                    message: '查询成功'
                  }
                } else {
                  return this.ctx.body = {
                    code: 200,
                    data: null,
                    message: '查询成功'
                  }
                }
              })
            } else if (type === '16') {
              let arr = result.data.data.list.filter(i => {
                return {
                  summary: i.summary,
                  title: i.title,
                }
              })
              arr.reverse()
              return this.ctx.body = {
                code: 200,
                data: arr,
                message: '查询成功'
              }
            }
          }
        } else {
          this.logger.error(result.data.msg)
          return this.ctx.body = {
            code: 200,
            message: this.logger
          }
        }
      })
      .catch(error => {
        this.logger.error(error)
      })
  }

  // 获取所有的皮肤标签，更新到141-狐妖小红娘
  async spiderSkinIcon() {
    for (let number = 1; number < 142; number++) {
      let url = 'https://game.gtimg.cn/images/yxzj/ingame/skin/icon/' + number + '.png'
      let path = 'db/skinIcon/' + number + '.png'
      if (fs.existsSync(path)) {
      } else {
        console.log('111aa', path)
        await this.ctx.curl(url, {
          streaming: true,
        }).then(img => {
          img.res.pipe(require('fs').createWriteStream(path))
        })
      }
    }
  }

  // 给每个英雄的皮肤添加皮肤标签的字段
  // 官网没有的icon，1000-星史诗，1001-星梦，1002-全国大赛，1003-Hello Kitty，1004-美少女战士，1005-龙年珍藏，1006-新版典藏战令，1007-新版战队赛限定
  // 1-勇者，12-史诗，15-传说，5-限定，127-无双，26-典藏，世冠FMVP-38，冬冠FMVP-107，星传说-42，
  async addSkinIcon() {
    await this.app.model.Hero.find()
      .then(async (data) => {
        for (let i = 0; i < data.length; i++) {
          let skins = data[i].skins.filter(item => !item.icon && item.icon !== 0)
          // if (data[i].cname === '兰陵王') {
          //   console.log('111', skins)
          // }
          let skinTitles = []
          for (let j = 0; j < skins.length; j++) {
            if (skins[j].quality === '星传说') {
              await this.app.model.Skin.updateOne({ hero_title: data[i].cname, 'xingyuan_skin.skin_title': skins[j].skin_title }, { $set: { 'xingyuan_skin.$.icon': 42 } })
            } else if (skins[j].quality === '星史诗') {
              await this.app.model.Skin.updateOne({ hero_title: data[i].cname, 'xingyuan_skin.skin_title': skins[j].skin_title }, { $set: { 'xingyuan_skin.$.icon': 1000 } })
            } else if (skins[j].quality === '普通星元') {
              await this.app.model.Skin.updateOne({ hero_title: data[i].cname, 'xingyuan_skin.skin_title': skins[j].skin_title }, { $set: { 'xingyuan_skin.$.icon': 0 } })
            } else if (skins[j].quality === '星元武器') {
              await this.app.model.Skin.updateOne({ hero_title: data[i].cname, 'xingyuan_skin.skin_title': skins[j].skin_title }, { $set: { 'xingyuan_skin.$.icon': 0 } })
            } else {
              skinTitles.push({ title: skins[j].skin_title, id: skins[j].skin_id })
            }
          }
          skinTitles.length && await this.service.hok.addPrevSkinIcon(data[i].id_name, skinTitles)
        }
        return this.ctx.body = {
          code: 200,
          message: '查询成功'
        }
      })
      .catch((error) => {
        return this.ctx.body = {
          code: 1,
          message: error
        }
      })
  }

  async addPrevSkinIcon(heroName, skinTitles) {
    await this.ctx.curl('https://pvp.qq.com/web201605/herodetail/' + heroName + '.shtml')
      .then(async res => {
        let html = iconv.decode(res.data, 'gb2312')
        // console.log('打印HTML', html);
        const $ = cheerio.load(html, { decodeEntities: false });
        // 获取指定元素
        let str = $('.pic-pf-list').data('imgname');
        let arr = str.split('|');
        let obj = {};
        arr.forEach(i => {
          let arr1 = i.split('&');
          let icon = arr1.length === 1 ? '0' : arr1[1];
          obj[arr1[0]] = Number(icon);
        })
        // console.log('111obj: ', obj);
        for (let a = 0; a < skinTitles.length; a++) {
          if (skinTitles[a].title in obj) {
            await this.app.model.Skin.updateOne({ skin_id: skinTitles[a].id }, { $set: { icon: Number(obj[skinTitles[a].title]) } })
            console.log('111icon: ', skinTitles[a].title, obj[skinTitles[a].title]);
          }
        }
      })
  }
}

module.exports = SkinService;
