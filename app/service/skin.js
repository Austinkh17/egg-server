const Service = require('egg').Service;

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
            await app.model.Skin.updateOne({skin_id: list.skin_id}, {$set: {gain_way: '', vote_count: list.vote_count, score: list.score, nga_tid: list.nga_tid, official_url: list.official_url}})
            return this.ctx.body = {
                code: 0,
                msg: list.skin_title + '更新成功'
            }
        }else{
            await app.model.Skin.create(list)
            return this.ctx.body = {
                code: 0,
                msg: list.skin_title + '创建成功'
            }
        }
    }
}

module.exports = SkinService;
