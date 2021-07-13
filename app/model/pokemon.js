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
        "index": Number,
        "nameZh": String,
        "nameJa": String,
        "nameEn": String,
        "type1": String,
        "type2": String,
        "ability1": String,
        "ability2": String,
        "abilityHide": String,
        "generation": Number,
        "baseStat": {
            "hp": Number,
            "attack": Number,
            "defense": Number,
            "spAttack": Number,
            "spDefense": Number,
            "speed": Number,
            "total": Number,
            "average": Number
        },
        "detail": {
            "imgUrl": String,
            "category": String,
            "height": String,
            "weight": String,
            "bodyStyle": String,
            "catchRate": String,
            "genderRatio": String,
            "eggGroup1": String,
            "eggGroup2": String,
            "hatchTime": String,
            "effortValue": String
        },
        "learnSetByLevelingUp": [learnSetByLevelingUpSchema],
        "learnSetByTechnicalMachine": [learnSetByTechnicalMachineSchema],
        "learnSetByBreeding": [learnSetByBreedingSchema],
        "cultivationPlan": [CultivationPlanSchema]
    });
  
    const MoveSchema = new Schema({
        accuracy: String,
        category: String,
        generation: Number,
        id: Number,
        nameEn: String,
        nameJa:	String,
        nameZh:	String,
        power: String,
        pp:	String,
        type: String
    });
    
    const AbilitySchema = new Schema({
        "desc": String,
        "effect": String,
        "generation": Number,
        "id": Number,
        "nameEn": String,
        "nameJa": String,
        "nameZh": String,
        "pokemons": String
    });

    const ItemSchema = new Schema({
        "desc": String,
        "generation": Number,
        "id": Number,
        "imgUrl": String,
        "nameEn": String,
        "nameJa": String,
        "nameZh": String,
        "type": String
    });

    return mongoose.model('Pokemon', PokemonSchema);
};
  