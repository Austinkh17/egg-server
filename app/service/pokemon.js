const Service = require('egg').Service;

class PokemonService extends Service {
  async getPokemonList() {
    let res = []
    await this.ctx.curl('https://pokemon.fantasticmao.cn/pokemon/list?generation=0', {
      dataType: 'json'
    })
      .then((result) => {
        if (result.status === 200 && result.data.code === 200) {
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
        if (result.status === 200 && result.data.code === 200) {
          res = result.data.data
        }
      })
      .catch((error) => {
        this.logger.error(error)
      })
    return res
  }
  async getPokemonBattle(type, index) {
    let res = []
    await this.ctx.curl('http://pm.superyyl.com/pokemonSeason?battleType=' + type + '&page=' + index, {
      dataType: 'json'
    })
      .then((result) => {
        console.log('111', result);
        if (result.status === 200 && result.data.success) {
          res = result.data.root.psList
        }
      })
      .catch((error) => {
        this.logger.error(error)
      })
    return res
  }
  async savePokemonBattle(list) {
    const { app } = this
    if (!list || await app.model.PokemonBattle.findOne({ id: list.id })) {
      return this.ctx.body = {
        code: 0,
        message: list.pokeId + '失败'
      }
    }
    list.pokeId = parseInt(list.pokeId)
    await app.model.PokemonBattle.create(list)
    return this.ctx.body = {
      code: 0,
      message: list.pokeId + '成功'
    }
  }
  async savePokemon(list) {
    const { app } = this
    if (!list.length || await app.model.Pokemon.findOne({ index: list[0].index })) {
      return this.ctx.body = {
        code: 0,
        message: list[0].nameZh + '失败'
      }
    }
    await app.model.Pokemon.create(list[0])
    return this.ctx.body = {
      code: 0,
      message: list[0].nameZh + '成功'
    }
  }
  async getPokemonMove() {
    const res = await this.ctx.curl('https://pokemon.fantasticmao.cn/pokemon/detail?index=' + index)
      .then((res) => {
        if (res.code === 200) {
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
    if (!list.length || await app.model.Pokemon.findOne({ index: list[0].index })) {
      return this.ctx.body = {
        code: 0,
        message: list[0].nameZh + '失败'
      }
    }
    await app.model.Pokemon.create(list[0])
    return this.ctx.body = {
      code: 0,
      message: list[0].nameZh + '成功'
    }
  }

  findRepeats(arr = []) {
    let repeats = []
    let noRepeats = []
    arr.forEach((ele) => {
      if (arr.indexOf(ele) != arr.lastIndexOf(ele) && repeats.indexOf(ele) == -1) {
        repeats.push(ele);
      } else if (arr.indexOf(ele) == arr.lastIndexOf(ele)) {
        noRepeats.push(ele);
      }
    });
    return { repeats, noRepeats };
  }

}

module.exports = PokemonService;
