module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const LifeRecordSchema = new Schema({
    name: String,
    desc: String,
    time_str: String,
    status: String,
    category: String,
    tag: Array,
    platform: String,
    feedback: String,
    personal_summary: String,
  });

  return mongoose.model('LifeRecord', LifeRecordSchema);
};
