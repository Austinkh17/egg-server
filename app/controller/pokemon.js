const Controller = require('./common');

class PokemonController extends Controller {
    async spiderPokemon() {
        const result = await this.service.pokemon.getPokemonList();
        console.log(result)
        if(result.length){
            for(let i = 0; i < result.length; i++){
                const pokeInfo = await this.service.pokemon.getPokemonDetail(result[i].index)
                if(pokeInfo.length){
                    await this.service.pokemon.savePokemon(pokeInfo)
                }
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
        if(query.hasOwnProperty('ability')){
            const reg = new RegExp(query.ability, 'i') 
            const regex = {$regex: reg}
            query['$or'] = [
                {ability1: regex},
                {ability2: regex},
                {abilityHide: regex}
            ]
            delete query.ability
        }
        if(query.hasOwnProperty('type')){
            const reg = new RegExp(query.type, 'i') 
            const regex = {$regex: reg}
            query['$or'] = [
                {type1: regex},
                {type2: regex}
            ]
            delete query.type
        }
        console.log('查询参数', JSON.stringify(query))
        await Promise.all([
            app.model.Pokemon.count(query),
            app.model.Pokemon.find(query).sort(sortParams).skip(skipNum).limit(Number(pageSize))
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
}

module.exports = PokemonController;
