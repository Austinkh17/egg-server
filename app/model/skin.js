module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
  
    const SkinSchema = new Schema({
        class_names: String,
        hero_title: String,
        low_price: String,
        nga_tid: Number,
        official_url: String,
        online_time: Number,
        price: String,
        quality: String,
        score: Number,
        skin_id: Number,
        skin_title: String,
        vote_count: Number,
        gain_way: String
    });

    return mongoose.model('Skin', SkinSchema);
};
  