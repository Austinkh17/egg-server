const Controller = require('../common');
const moment = require('moment');

class HeroController extends Controller {
    async spiderHero() {
        const result = await this.service.hok.getHeroList();
        if(result.length){
            for (let i = 0; i < result.length; i++) {
                await this.service.hok.saveHero(result[i])
            }
            return this.ctx.body = {
                code: 0,
                msg: '创建成功'
            }
        }
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
        if(!sortParams.hasOwnProperty('online_time')) sortParams['online_time'] = -1
        sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
        if(query.hasOwnProperty('role')){
            let arr = query.role.split(',')
            !query['$or'] && (query['$or'] = [])
            arr.forEach(i => {
                query['$or'].push({role_first: i}, {role_second: i}) 
            })
            delete query.role
        }
        console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, Number(pageSize), JSON.stringify(query))
        await Promise.all([
            app.model.Hero.count(query),
            app.model.Hero.find(query).collation({"locale": "zh", numericOrdering: true}).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
        ])
        .then((data) => {
            return ctx.body = {
                code: 200,
                data: data[1],
                total: data[0],
                msg: '查询成功'
            }
        })
        .catch((error) => {
            return ctx.body = {
                code: 1,
                msg: error
            }
        })
    }

    async statisticSkin() {
        const { app } = this
        const qualityMap = {
            SS: 16,
            S: 8,
            A: 4,
            B: 2,
            C: 1
        }
        await app.model.Hero.find()
        .then((res) => {
            res.forEach(async(item) => {
                const skins = await app.model.Skin.find({hero_title: item.cname, quality: { $ne: 'D' }}).sort({ 'online_time': -1 })
                let skin_score = 0
                let xingyuan_score = 0
                let skin_desc = ''
                let xingyuan_desc = ''
                let skinMap = {
                    SS: {num: 0, skins: [], text: '荣耀典藏'},
                    S: {num: 0, skins: [], text: '传说'},
                    A: {num: 0, skins: [], text: '史诗'},
                    B: {num: 0, skins: [], text: '勇者'},
                    C: {num: 0, skins: [], text: '伴身'}
                }
                let last_skin = {}
                let last_skin_time = 0
                if(skins.length){
                    skins.forEach(skin => {
                        //  勇者皮有新语音加分，史诗皮有回城、动态封面加分
                        if(skin.skin_title === '圣诞老人' || skin.skin_title === '千年之狐' || (skin.skin_title === '末日机甲' && skin.hero_title === '吕布') || 
                        skin.skin_title === '苍穹之光' || skin.skin_title === '龙骑士' || skin.skin_title === '海滩丽影') skin_score += 1
                        if(skin.skin_title === '电玩小子') skin_score += 2
                        //  史诗标签勇者品质减分
                        if(skin.skin_title === '魅力维加斯' || skin.skin_title === '皇家上将' || (skin.skin_title === '鬼剑武藏' && skin.hero_title === '王者之锤') || 
                        skin.skin_title === '魔术师' || skin.skin_title === '乱世虎臣') skin_score -= 1
                        if(skin.class_names && skin.class_names.includes('星传说限定')){
                            xingyuan_score += 7
                        }else if(skin.class_names && skin.class_names.includes('星传说')){
                            xingyuan_score += 6
                        }
                        if(skin.xingyuan_skin.length){
                            xingyuan_desc = `；星元共${skin.xingyuan_skin.length}款，其中`
                            skin.xingyuan_skin.forEach(xingyuan => {
                                xingyuan_score += xingyuan.point || 0
                                xingyuan_desc += xingyuan.skin_title
                            })
                        }
                        if(skin.personal_button.personal_possess) xingyuan_score += 1
                        if(skin.class_names && skin.class_names.includes('限定')) skin_score += 1
                        skin_score += qualityMap[skin.quality]
                        skinMap[skin.quality].num += 1
                        skinMap[skin.quality].skins.push({skin_title: skin.skin_title, class_names: skin.class_names})
                    })
                    skin_desc = `皮肤共${skins.length}款，其中`
                    Object.values(skinMap).forEach(skin => {
                        let text_skin = ''
                        skin.skins.forEach(i => {
                            if(i.class_names && i.class_names.includes('星传说限定')){
                                i.skin_title += '[星传说限定]'
                            }else if(i.class_names && i.class_names.includes('星传说')){
                                i.skin_title += '[星传说]'
                            }
                            if(i.class_names && i.class_names.includes('限定')) i.skin_title += `[${i.class_names}]`
                            // if(i.class_names && i.class_names.includes('限定') && !i.class_names.includes('源梦') && !i.class_names.includes('赛季') 
                            // && !i.class_names.includes('赛年') && !i.class_names.includes('战令') && !i.class_names.includes('周年') 
                            // && !i.class_names.includes('贵族') && !i.class_names.includes('KPL') && !i.class_names.includes('珍宝阁')) i.skin_title += '[限定]'
                            // if(i.class_names && i.class_names.includes('源梦')) i.skin_title += '[源梦]'
                            // if(i.class_names && i.class_names.includes('战令')) i.skin_title += '[战令]'
                            // if(i.class_names && i.class_names.includes('赛年')) i.skin_title += '[赛年]'
                            // if(i.class_names && i.class_names.includes('赛季')) i.skin_title += '[赛季]'
                            // if(i.class_names && i.class_names.includes('周年')) i.skin_title += '[周年]'
                            // if(i.class_names && i.class_names.includes('V8')) i.skin_title += '[V8]'
                            // if(i.class_names && i.class_names.includes('KPL')) i.skin_title += '[KPL]'
                            // if(i.class_names && i.class_names.includes('珍宝阁')) i.skin_title += '[珍宝阁]'
                        })
                        text_skin = skin.skins.map(i => i.skin_title).join('、')
                        const text_end = skin.num > 0 ? '(' + text_skin + ')，' : '，'
                        skin_desc += skin.text + skin.num + '款' + text_end
                    })
                    skin_desc = skin_desc.substring(0, skin_desc.length - 1)
                    last_skin = skins[0]
                    const diff = Date.parse(new Date()) / 1000 - moment(skins[0].online_time_str, 'YYYY/MM/DD').valueOf() / 1000
                    last_skin_time = Math.floor(diff / (24 * 3600))
                }
                const total_score = skin_score + xingyuan_score
                const total_desc = skin_desc + xingyuan_desc
                const online_time = moment(item.online_time_str, 'YYYY/MM/DD').valueOf() / 1000
                const hero_time = Math.floor((Date.parse(new Date()) / 1000 - online_time) / (24 * 3600))
                const skin_score_average = skin_score / hero_time
                const total_score_average = total_score / hero_time
                await this.ctx.model.Hero.updateOne({ id: item.id }, { $set: 
                    {
                        skin_score, xingyuan_score, total_score, skin_desc, xingyuan_desc, total_desc, online_time, last_skin, last_skin_time, skin_score_average, total_score_average, hero_time
                    } 
                })
                .then(() => {
                    return this.ctx.body = {
                        code: 200,
                        msg: '统计皮肤更新成功'
                    }
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

module.exports = HeroController;