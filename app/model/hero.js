module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
  
    const HeroSchema = new Schema({
        id: String,
        ename: String,
        cname: String,
        title: String,
        iconUrl: String,
        online_time: Number,
        online_time_str: String,
        skin_score: Number,
        xingyuan_score: Number,
        total_score: Number,
        skin_desc: String,
        xingyuan_desc: String,
        total_desc: String,
        gender: String,
        role_first: String,
        role_second: String,
        last_skin: Object,
        last_skin_time: String,
        possess_skin: String,
        skin_score_average: Number,
        total_score_average: Number,
        hero_time: String,
    });

    return mongoose.model('Hero', HeroSchema);
};
  