module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const AbilitySchema = new Schema({
    "no": String,
    "cname": String,
    "ename": String,
    "synopsis": String,
    "cneffect": String,
    "gen": String,
    "change": String,
    "effect": String
  });

  return mongoose.model('Ability', AbilitySchema);
};
