const Controller = require('../common');

class SkinController extends Controller {
    async spiderSkin() {
        const result = await this.service.hok.getSkinList();
        if(result.length){
            for(let i = 0; i < result.length; i++){
                await this.service.hok.saveSkin(result[i])
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
        if(!sortParams.hasOwnProperty('online_time_str')) sortParams['online_time_str'] = -1
        sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
        if(query.hasOwnProperty('skin_title')){
            const reg = new RegExp(query.skin_title, 'i') 
            const regex = {$regex: reg}
            query['$or'] = [
                {skin_title: regex}
            ]
            delete query.skin_title
        }
        if(query.hasOwnProperty('hero_title')){
            let arr = query.hero_title.split(',')
            !query['$or'] && (query['$or'] = [])
            arr.forEach(i => {
                query['$or'].push({hero_title: i}) 
            })
            delete query.hero_title
        }
        if(query.hasOwnProperty('class_names')){
            let arr = query.class_names.split(',')
            !query['$or'] && (query['$or'] = [])
            arr.forEach(i => {
                query['$or'].push({class_names: new RegExp(i, 'i')}) 
            })
            delete query.class_names
            // 并行搜索
            // arr = arr.map(i => {
            //     return new RegExp(i, 'i') 
            // })
            // query.class_names = { $all: arr }
        }
        //  过滤原皮
        query.quality = { $ne: 'D' }
        const qualityMap = {
            SS: 6,
            S: 5,
            A: 4,
            B: 3,
            C: 2,
            D: 1
        }
        console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, Number(pageSize), JSON.stringify(query))
        await Promise.all([
            app.model.Skin.count(query),
            sortParams.quality ? app.model.Skin.find(query).collation({"locale": "en_US", numericOrdering: true}).sort(sortParams).skip(skipNum).limit(Number(pageSize)) : app.model.Skin.find(query).collation({"locale": "zh", numericOrdering: true}).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
            app.model.User.find({username: username}),
        ])
        .then((data) => {
            const result = data[1].map(item => {
                let obj = {}
                for(let i = 0; i < data[2][0].skins.length; i++){
                    if(item.skin_id == data[2][0].skins[i].skin_id){
                        obj = {
                            class_names: item.class_names,
                            hero_title: item.hero_title,
                            low_price: item.low_price,
                            nga_tid: item.nga_tid,
                            official_url: item.official_url,
                            online_time: item.online_time,
                            online_time_str: item.online_time_str,
                            price: item.price,
                            quality: item.quality,
                            score: item.score,
                            skin_id: item.skin_id,
                            skin_title: item.skin_title,
                            vote_count: item.vote_count,
                            gain_way: item.gain_way,
                            personal_button: item.personal_button,
                            xingyuan_skin: item.xingyuan_skin,
                            personal_gain_way: data[2][0].skins[i].personal_gain_way,
                            personal_possess: data[2][0].skins[i].personal_possess,
                            personal_intention: data[2][0].skins[i].personal_intention,
                        }
                        break;
                    }
                }
                return obj
            })
            console.log('111', result);
            return ctx.body = {
                code: 200,
                data: result,
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

    async updateSkinAttr() {
        let { ctx, app } = this
        let { skin_id, class_names, quality, username } = ctx.request.body
        const user = await app.model.User.findOne({username: username})
        if(user){
            if(user.role == 'admin'){
                if(await app.model.Skin.findOne({skin_id: skin_id})){
                    let params = quality ? {quality: quality} : {class_names: class_names}
                    console.log('更新参数', skin_id, class_names, quality, params);
                    await app.model.Skin.updateOne({skin_id: skin_id}, {$set: params})
                    return this.ctx.body = {
                        code: 200,
                        msg: '更新成功'
                    }
                }else{
                    return this.ctx.body = {
                        code: 1,
                        msg: '查找失败'
                    }
                }
            }else{
                return this.ctx.body = {
                    code: 1,
                    msg: '该用户无权限'
                }
            }
        }else{
            return this.ctx.body = {
                code: 1,
                msg: '未找到该用户'
            }
        }
    }

    async updateUserSkinsAttr() {
        let { ctx, app } = this
        const req = ctx.request.body
        const user = await app.model.User.findOne({username: req.username})
        if(user){
            const index = user.skins.map(i => i.skin_id).indexOf(req.skin_id)
            if(index > -1){
                await app.model.User.updateOne({username: req.username, 'skins.skin_id': req.skin_id}, {$set: {'skins.$.personal_possess': req.personal_possess || user.skins[index].personal_possess, 'skins.$.personal_gain_way': req.personal_gain_way || user.skins[index].personal_gain_way, 'skins.$.personal_intention': req.personal_intention || user.skins[index].personal_intention}})
                return this.ctx.body = {
                    code: 200,
                    msg: '更新成功'
                }
            }else{
                return this.ctx.body = {
                    code: 1,
                    msg: '查找失败'
                }
            }
        }else{
            return this.ctx.body = {
                code: 1,
                msg: '未找到该用户'
            }
        }
    }

    async addSkinNewField() {
        const { app } = this
        const qualityMap = {
            SS: 16,
            S: 8,
            A: 4,
            B: 2,
            C: 1,
            D: 0
        }
        await app.model.Skin.find()
        .then((res) => {
            res.forEach(async(item) => {
                const attack = item.quality
                
                console.log(item.index, item.nameZh, item.type1, item.type2, againstPoint, against, tagList, validTotal, {hp: item.baseStat.hp, defense: item.baseStat.defense, spDefense: item.baseStat.spDefense, speed: item.baseStat.speed, attack: item.baseStat.attack, spAttack: item.baseStat.spAttack, total: item.baseStat.total});
                await this.ctx.model.Pokemon.updateOne({ index: item.index }, { $set: {against: against, againstPoint: againstPoint, tagList: tagList, baseStat: baseStatNew} })
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

module.exports = SkinController;