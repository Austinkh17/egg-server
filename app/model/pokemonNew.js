module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CultivationPlanSchema = new Schema({
    moveList: [],
    nature: String,
    item: String,
    level: Number,
    ability: String,
    unitValue: {
      "hp": Number,
      "attack": Number,
      "defense": Number,
      "spAttack": Number,
      "spDefense": Number,
      "speed": Number,
      "total": Number,
      "average": Number
    },
    effortValue: {
      "hp": Number,
      "attack": Number,
      "defense": Number,
      "spAttack": Number,
      "spDefense": Number,
      "speed": Number,
      "total": Number,
      "average": Number
    }
  });

  const learnSetByLevelingUpSchema = new Schema({
    "level1": String,
    "level2": String,
    "move": String,
    "type": String,
    "category": String,
    "power": String,
    "accuracy": String,
    "pp": String
  });

  const learnSetByTechnicalMachineSchema = new Schema({
    "imgUrl": String,
    "technicalMachine": String,
    "move": String,
    "type": String,
    "category": String,
    "power": String,
    "accuracy": String,
    "pp": String
  });

  const learnSetByBreedingSchema = new Schema({
    "parent": String,
    "move": String,
    "type": String,
    "category": String,
    "power": String,
    "accuracy": String,
    "pp": String
  });

  const PokemonSchema = new Schema({
    "nationalCode": String,
    "picName": String,
    "texing": Array,
    "texingName": Array,
    "shengao": Number,
    "tizhong": Number,
    "shuxing": Array,
    "zhongzuzhi": Array,
    "nulizhi": Array,
    "eName": String,
    "zhongzu": String,
    "buhuolv": Number,
    "chushiqingmidu": Number,
    "color": String,
    "egg": Array,
    "jinhuabiao": Object,
    "sidai": String,
    "sex": Number,
    "fuhuabushu": Number,
    "cName": String,
    "jName": String,
    "picNumber": String,
    "skillnum": String,
    "oldname": String,
    "depict": String,
    "diffsex": String,
    "othertype": String,
    "getmode": Array,
    "xingtaibiao": Array,
    "compute": Object,
    "tagList": Array,
    "baseStat": {
      "hp": Number,
      "attack": Number,
      "defense": Number,
      "spAttack": Number,
      "spDefense": Number,
      "speed": Number,
      "total": Number,
      "average": Number,
      "validTotal": Number
    },
    "allgen": Array,
  });

  return mongoose.model('PokemonNew', PokemonSchema);
};
