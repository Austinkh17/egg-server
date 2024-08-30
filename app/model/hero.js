module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const HeroSchema = new Schema({
    id: String,
    ename: Number,
    cname: String,
    title: String,
    hero_type: Number,
    hero_type2: Number,
    iconUrl: String,
    isRework: Number,
    tagId: Number,
    online_time: Number,
    online_time_str: String,
    total_skin_score: Number,
    total_xingyuan_score: Number,
    total_score: Number,
    skin_desc: String,
    gender: String,
    role_first: String,
    role_second: String,
    last_skin: Object,
    last_skin_time: String,
    possess_skin: String,
    skin_score_average: Number,
    total_score_average: Number,
    hero_time: String,
    skins: Array,
    abbr_skin_desc: String,
    id_name: String,
  });

  return mongoose.model('Hero', HeroSchema);
};
