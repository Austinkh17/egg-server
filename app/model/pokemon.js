module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
  
    const CultivationPlanSchema = new Schema({
    });

    const UserSchema = new Schema({
        "pokedex_number": String,
        "name": String,
        "german_name": String,
        "japanese_name": String,
        "generation": String,
        "status": String,
        "species": String,
        "type_number": String,
        "type_1": String,
        "type_2": String,
        "height_m": String,
        "weight_kg": String,
        "abilities_number": String,
        "ability_1": String,
        "ability_2": String,
        "ability_hidden": String,
        "total_points": String,
        "hp": String,
        "attack": String,
        "defense": String,
        "sp_attack": String,
        "sp_defense": String,
        "speed": String,
        "catch_rate": String,
        "base_friendship": String,
        "base_experience": String,
        "growth_rate": String,
        "egg_type_number": String,
        "egg_type_1": String,
        "egg_type_2": String,
        "percentage_male": String,
        "egg_cycles": String,
        "against_normal": String,
        "against_fire": String,
        "against_water": String,
        "against_electric": String,
        "against_grass": String,
        "against_ice": String,
        "against_fight": String,
        "against_poison": String,
        "against_ground": String,
        "against_flying": String,
        "against_psychic": String,
        "against_bug": String,
        "against_rock": String,
        "against_ghost": String,
        "against_dragon": String,
        "against_dark": String,
        "against_steel": String,
        "against_fairy": String,
        "cultivationPlan": [CultivationPlanSchema],
        "skill": {}
    });
  
    return mongoose.model('Poke', UserSchema);
};
  