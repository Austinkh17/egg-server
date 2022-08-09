module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const SkinsSchema = new Schema({
        "skin_id": String,
        "personal_gain_way": String,
        "personal_possess": Boolean,
        "personal_intention": String,
    });

    const UserSchema = new Schema({
        "password": String,
        "username": String,
        "role": String,
        "skins": [SkinsSchema]
    });
  
    return mongoose.model('User', UserSchema);
};
  