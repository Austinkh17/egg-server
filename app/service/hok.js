const Service = require('egg').Service;
const moment = require('moment');

class SkinService extends Service {
    async getSkinList() {
        let res = []
        await this.ctx.curl('https://ricochet.cn/api/skin/score', {
            dataType: 'json'
        })
        .then((result) => {
            if(result.status === 200 && result.data.status === 1){
                res = result.data.data
            }
        })
        .catch((error) => {
            this.logger.error(error)
        })
        return res
    }

    async saveSkin(list) {
        const { app } = this
        if(await app.model.Skin.findOne({skin_id: list.skin_id})){
            await app.model.Skin.updateOne({skin_id: list.skin_id}, {$set: 
                { 
                    vote_count: list.vote_count, 
                    score: list.score, 
                    nga_tid: list.nga_tid, 
                    official_url: list.official_url,
                }})
            return this.ctx.body = {
                code: 0,
                msg: list.skin_title + '更新成功'
            }
        }else{
            await app.model.Skin.create({
                ...list, 
                gain_way: '', 
                personal_button: {
                    online_time_str: '',
                    price: '',
                    low_price: '',
                    title: '',
                    personal_possess: false,
                },
                xingyuan_skin: [],
                online_time_str: moment(list.online_time * 1000).format('YYYY/MM/DD'),
            })
            await app.model.User.find().then(async(res) => {
                res.forEach(async(user) => {
                    await app.model.User.updateOne({username: user.username}, {$push: {'skins': {
                        skin_id: list.skin_id,
                        personal_gain_way: '',
                        personal_intention: 'D',
                        personal_possess: false
                    }}})
                })
            })
            return this.ctx.body = {
                code: 0,
                msg: list.skin_title + '创建成功'
            }
        }
    }

    async getHeroList() {
        let res = []
        await this.ctx.curl('https://www.jk.cxkf.cc/api_herolist.php', {
            dataType: 'json'
        })
        .then((result) => {
            if(result.status === 200 && result.data.code === 200){
                res = result.data.data
            }
        })
        .catch((error) => {
            this.logger.error(error)
        })
        return res
    }

    async saveHero(list) {
        const { app } = this
        if(!await app.model.Hero.findOne({id: list.id})){
            await app.model.Hero.create({...list, online_time_str: ''})
        }
    }
}

module.exports = SkinService;
