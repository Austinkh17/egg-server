module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
  
    const XingYuanSchema = new Schema({
        online_time_str: String,
        gain_way: String,
        skin_title: String,
        class_names: String,
        suit: Boolean,
        post: Boolean,
        point: Number,
        num: Number,
    });

    const SkinSchema = new Schema({
        class_names: String,
        quality: String,
        hero_title: String,
        nga_tid: Number,
        official_url: String,
        online_time: Number,
        online_time_str: String,
        price: String,
        low_price: String,
        skin_id: Number,
        skin_title: String,
        vote_count: Number,
        score: Number,
        gain_way: String,
        personal_button: {
            online_time_str: String,
            price: String,
            low_price: String,
            title: String,
            personal_possess: Boolean,
        },
        xingyuan_skin: [XingYuanSchema],
    });

    return mongoose.model('Skin', SkinSchema);
};
  