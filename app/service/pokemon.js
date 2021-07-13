const Service = require('egg').Service;

class PokemonService extends Service {
    async getPokemonList() {
        let res = []
        await this.ctx.curl('https://pokemon.fantasticmao.cn/pokemon/list?generation=0', {
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
    async getPokemonDetail(index) {
        let res = []
        await this.ctx.curl('https://pokemon.fantasticmao.cn/pokemon/detail?index=' + index, {
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
    async savePokemon(list) {
        const { app } = this
        if (!list.length || await app.model.Pokemon.findOne({index: list[0].index})) {
            return this.ctx.body = {
                code: 0,
                msg: list[0].nameZh + '失败'
            }
        }
        await app.model.Pokemon.create(list[0])
        return this.ctx.body = {
            code: 0,
            msg: list[0].nameZh + '成功'
        }
    }
    async getPokemonMove() {
        const res = await this.ctx.curl('https://pokemon.fantasticmao.cn/pokemon/detail?index=' + index)
        .then((res) => {
            if(res.code === 200){
                return res.data
            }
            return []
        })
        .catch((err) => {
            this.logger.error(err)
            return []
        })
    }
    async savePokemonMove(list) {
        const { app } = this
        if (!list.length || await app.model.Pokemon.findOne({index: list[0].index})) {
            return this.ctx.body = {
                code: 0,
                msg: list[0].nameZh + '失败'
            }
        }
        await app.model.Pokemon.create(list[0])
        return this.ctx.body = {
            code: 0,
            msg: list[0].nameZh + '成功'
        }
    }
}

module.exports = PokemonService;
