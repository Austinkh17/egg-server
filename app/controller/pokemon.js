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

    async spiderPokemonBattle() {
        //  每页 30 条数据，总共 150 +，1 为单打，2 为双打
        for(let i = 1; i < 7; i++){
            const battle = await this.service.pokemon.getPokemonBattle(1, i)
            if(battle.length){
                battle.forEach(async(item) => {
                    await this.service.pokemon.savePokemonBattle(item)
                })
            }
        }
        for(let i = 1; i < 7; i++){
            const battle = await this.service.pokemon.getPokemonBattle(2, i)
            if(battle.length){
                battle.forEach(async(item) => {
                    await this.service.pokemon.savePokemonBattle(item)
                })
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
        if(!sortParams[sort]) sortParams = {index: 1}
        sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
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
        if(query.hasOwnProperty('nameZh')){
            const reg = new RegExp(query.nameZh, 'i') 
            const regex = {$regex: reg}
            query['$or'] = [
                {nameZh: regex}
            ]
            delete query.nameZh
        }
        if(query.hasOwnProperty('type')){
            let arr = query.type.split(',')
            if(arr.length && arr.length === 1){
                query['$or'] = [
                    {type1: arr[0]},
                    {type2: arr[0]}
                ]
            }else if(arr.length && arr.length === 2){
                query['$or'] = [
                    {type1: arr[0], type2: arr[1]},
                    {type1: arr[1], type2: arr[0]}
                ]
            }
            delete query.type
        }
        if(query.hasOwnProperty('tagList')){
            let arr = query.tagList.split(',')
            query.tagList = { $all: arr }
        }
        console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, JSON.stringify(query))
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

    //  统计热门宝可梦属性（依据home 单双打前 150+）
    async statisticHotPokemonType() {
        let { ctx, app } = this
        let { battleType, number } = ctx.query
        await app.model.PokemonBattle.aggregate([ 
            {
                $match:{
                    'battleType':{
                        $in:[Number(battleType)]
                    }
                }
            },
            {   $limit : Number(number) },
            {
                $lookup:{
                    from:"pokemons",
                    localField: 'pokeId',
                    foreignField: 'index',
                    as: 'info'
                },
            },
            {
                $project: {
                    '_id': 0,
                    'info': {
                        'learnSetByLevelingUp': 0,
                        'learnSetByTechnicalMachine': 0,
                        'learnSetByBreeding': 0,
                        'cultivationPlan': 0,
                        'baseStat': 0,
                        'aganist': 0
                    }
                }
            }
        ],(err, docs)=>{
            if(err){
                console.log('111', err);
                return ctx.body = {
                    code: 1,
                    msg: err
                }
            }
            const map = {
                '一般': 0,
                '格斗': 0,
                '飞行': 0,
                '毒': 0,
                '地面': 0,
                '岩石': 0,
                '虫': 0,
                '幽灵': 0,
                '钢': 0,
                '火': 0,
                '水': 0,
                '草': 0,
                '电': 0,
                '超能力': 0,
                '冰': 0,
                '龙': 0,
                '恶': 0,
                '妖精': 0
            }
            docs.forEach(item => {
                item.info && item.info.length && item.info[0].type1 in map && map[item.info[0].type1]++
                item.info && item.info.length && item.info[0].type2 in map && map[item.info[0].type2]++
            })
            const sortable = [];
            for (let key in map) {
                sortable.push({key: key, value: map[key]});
            }
            sortable.sort(function(a, b) {
                return b.value - a.value;
            });
            return ctx.body = {
                code: 200,
                data: {
                    total: docs.length,
                    battleType: battleType,
                    map: map,
                    sortable: sortable
                },
                msg: '查询成功'
            }
        })
    }

    async addPokemonNewField() {
        const { app } = this
        await app.model.Pokemon.find()
        .then((res) => {
            res.forEach(async(item) => {
                const attack = item.baseStat.attack > item.baseStat.spAttack ? item.baseStat.attack : item.baseStat.spAttack
                //  有效种族值 = hp + 双防 + 一攻 + 速度
                const validTotal = attack + item.baseStat.hp + item.baseStat.defense + item.baseStat.spDefense + item.baseStat.speed
                // HP能力值
                // 如果是脱壳忍者：能力值 ＝ 1
                // 如果不是脱壳忍者：能力值 ＝ （种族值×2＋基础点数÷4＋个体值）×等级÷100＋等级＋10
                // 非HP能力值
                // 能力值 ＝ （（种族值×2＋基础点数÷4＋个体值）×等级÷100＋5）×性格修正
                const map = {
                    '一般': {
                        '0': ['幽灵'],
                        '1/2': [],
                        '2': ['格斗']
                    },
                    '格斗': {
                        '0': [],
                        '1/2': ['岩石', '虫', '恶'],
                        '2': ['飞行', '超能力', '妖精']
                    },
                    '飞行': {
                        '0': ['地面'],
                        '1/2': ['格斗', '虫', '草'],
                        '2': ['岩石', '电', '冰']
                    },
                    '毒': {
                        '0': [],
                        '1/2': ['格斗', '虫', '草', '毒', '妖精'],
                        '2': ['地面', '超能力']
                    },
                    '地面': {
                        '0': ['电'],
                        '1/2': ['毒', '岩石'],
                        '2': ['水', '草', '冰']
                    },
                    '岩石': {
                        '0': [],
                        '1/2': ['一般', '毒', '火', '飞行'],
                        '2': ['格斗', '地面', '水', '草', '钢']
                    },
                    '虫': {
                        '0': [],
                        '1/2': ['格斗', '地面', '草'],
                        '2': ['岩石', '飞行', '火']
                    },
                    '幽灵': {
                        '0': ['一般', '格斗'],
                        '1/2': ['毒', '虫'],
                        '2': ['幽灵', '恶']
                    },
                    '钢': {
                        '0': ['毒'],
                        '1/2': ['一般', '飞行', '岩石', '钢', '虫', '冰', '龙', '草', '超能力', '妖精'],
                        '2': ['格斗', '地面', '火']
                    },
                    '火': {
                        '0': [],
                        '1/2': ['火', '草', '钢', '虫', '冰', '妖精'],
                        '2': ['岩石', '地面', '水']
                    },
                    '水': {
                        '0': [],
                        '1/2': ['钢', '火', '水', '冰'],
                        '2': ['电', '草']
                    },
                    '草': {
                        '0': [],
                        '1/2': ['地面', '水', '草', '电'],
                        '2': ['飞行', '毒', '虫', '火', '冰']
                    },
                    '电': {
                        '0': [],
                        '1/2': ['飞行', '钢', '电'],
                        '2': ['地面']
                    },
                    '超能力': {
                        '0': [],
                        '1/2': ['格斗', '超能力'],
                        '2': ['虫', '幽灵', '恶']
                    },
                    '冰': {
                        '0': [],
                        '1/2': ['冰'],
                        '2': ['格斗', '岩石', '钢', '火']
                    },
                    '龙': {
                        '0': [],
                        '1/2': ['火', '水', '草', '电'],
                        '2': ['冰', '龙', '妖精']
                    },
                    '恶': {
                        '0': ['超能力'],
                        '1/2': ['幽灵', '恶'],
                        '2': ['格斗', '虫', '妖精']
                    },
                    '妖精': {
                        '0': ['龙'],
                        '1/2': ['格斗', '虫', '恶'],
                        '2': ['钢', '毒']
                    },
                    '': {
                        '0': [],
                        '1/2': [],
                        '2': []
                    }
                }
                const aganist = {
                    '0': [],
                    '1/2': [],
                    '1/4': [],
                    '2': [],
                    '4': []
                }
                aganist['0'] = map[item.type1]['0'].concat(map[item.type2]['0'])
                const {repeats, noRepeats} = this.service.pokemon.findRepeats(map[item.type1]['1/2'].concat(map[item.type2]['1/2']))
                aganist['1/2'] = noRepeats
                aganist['1/4'] = repeats
                const {repeats: repeats1, noRepeats: noRepeats1} = this.service.pokemon.findRepeats(map[item.type1]['2'].concat(map[item.type2]['2']))
                aganist['2'] = noRepeats1
                aganist['4'] = repeats1
                aganist['0'].forEach(item => {
                    aganist['1/4'] = aganist['1/4'].filter(i => i !== item)
                    aganist['1/2'] = aganist['1/2'].filter(i => i !== item)
                    aganist['2'] = aganist['2'].filter(i => i !== item)
                    aganist['4'] = aganist['4'].filter(i => i !== item)
                })
                const {repeats: repeatsNew} = this.service.pokemon.findRepeats(aganist['1/2'].concat(aganist['2']))
                repeatsNew.forEach(item => {
                    aganist['1/2'] = aganist['1/2'].filter(i => i !== item)
                    aganist['2'] = aganist['2'].filter(i => i !== item)
                })
                //  热门属性-2022.1.6根据statisticHotPokemonType统计的单双打对战前 50、100、150
                const hotTypes = ['水', '飞行', '龙', '超能', '火', '妖精', '钢', '电', '地面', '恶', '幽灵', '草']
                const notHotTypes = ['一般', '岩石', '冰', '格斗', '虫', '毒']
                const tagList = []
                if(item.baseStat.speed >= 100 && item.baseStat.attack >= 100) tagList.push('高速物攻打手') 
                if(item.baseStat.speed >= 100 && item.baseStat.spAttack >= 100) tagList.push('高速特攻打手')
                if(item.baseStat.hp + item.baseStat.defense >= 180) tagList.push('物盾')
                if(item.baseStat.hp + item.baseStat.spDefense >= 180) tagList.push('特盾')
                if(item.baseStat.speed <= 60 && item.baseStat.attack >= 100) tagList.push('空间物攻打手')
                if(item.baseStat.speed <= 60 && item.baseStat.spAttack >= 100) tagList.push('空间特攻打手')
                if(item.baseStat.hp + item.baseStat.defense + item.baseStat.spDefense >= 240 && item.baseStat.hp + item.baseStat.defense >= 155 && item.baseStat.hp + item.baseStat.spDefense >= 155 && item.baseStat.hp > 69 && item.baseStat.defense > 69 && item.baseStat.spDefense > 69) tagList.push('三维过硬')
                //  假设某属性PM连续遇到18种属性攻击，记正常效果攻击为1，效果拔群攻击为2，收效甚微攻击记为0.5，无效攻击记为0，如果4倍抵抗就计0.25，4倍伤害就计4，然后把这些数值累加，得到的结果是
                const restLength = 18 - (aganist['0'].length + aganist['1/4'].length + aganist['1/2'].length + aganist['2'].length + aganist['4'].length)
                const aganistPoint = aganist['0'].length * 0 + aganist['1/4'].length * 1/4 + aganist['1/2'].length * 1/2 + aganist['2'].length * 2 + aganist['4'].length * 4 + restLength * 1
                if(aganistPoint <= 17) tagList.push('优秀抗性')
                const baseStatNew = {
                    ...item.baseStat,
                    validTotal
                }
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

module.exports = PokemonController;
