module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
  
    const PokemonBattleSchema = new Schema({
        "battleType": Number,
        "id": Number,
        "pokeId": Number,
        "rank": Number,
        "seasonId": Number
    });

    return mongoose.model('PokemonBattle', PokemonBattleSchema);
};
  