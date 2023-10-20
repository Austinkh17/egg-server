const Service = require('egg').Service;

class PokemonNewService extends Service {

  async savePokemon(detail) {
    const { app } = this
    await app.model.PokemonNew.create(detail)
  }

  async updatePokemon(obj) {
    const { app } = this
    await app.model.PokemonNew.findOneAndUpdate(obj)
  }

  async savePokemonAbility(detail) {
    const { app } = this
    await app.model.Ability.create(detail)
  }

  async savePokemonMove(detail) {
    const { app } = this
    await app.model.Move.create(detail)
  }

  async savePokemonItem(detail) {
    const { app } = this
    await app.model.Item.create(detail)
  }
}

module.exports = PokemonNewService;
