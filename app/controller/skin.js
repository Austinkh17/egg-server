const Controller = require('./common');

class SkinController extends Controller {
    async spiderSkin() {
        const result = await this.service.skin.getSkinList();
        if(result.length){
            for(let i = 0; i < result.length; i++){
                await this.service.skin.saveSkin(result[i])
            }
        }
    }

    async getSkinList() {
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
        if(!sortParams[sort]) sortParams = {online_time: -1}
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
            arr = arr.map(i => {
                return new RegExp(i, 'i') 
            })
            query.class_names = { $all: arr }
        }
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
            sortParams.quality ? app.model.Skin.find(query).collation({"locale": "en_US", numericOrdering: true}).sort(sortParams).skip(skipNum).limit(Number(pageSize)) : app.model.Skin.find(query).collation({"locale": "zh", numericOrdering: true}).sort(sortParams).skip(skipNum).limit(Number(pageSize))
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

    async updateSkinAttr() {
        let { ctx, app } = this
        let { skin_id, class_names, quality } = ctx.request.body
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
                
                console.log(item.index, item.nameZh, item.type1, item.type2, aganistPoint, aganist, tagList, validTotal, {hp: item.baseStat.hp, defense: item.baseStat.defense, spDefense: item.baseStat.spDefense, speed: item.baseStat.speed, attack: item.baseStat.attack, spAttack: item.baseStat.spAttack, total: item.baseStat.total});
                await this.ctx.model.Pokemon.updateOne({ index: item.index }, { $set: {aganist: aganist, aganistPoint: aganistPoint, tagList: tagList, baseStat: baseStatNew} })
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