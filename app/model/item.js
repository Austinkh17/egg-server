module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ItemSchema = new Schema({
    "price": Number,
    "id": Number,
    "type": String,
    "effect": String,
    "explain": String,
    "cname": String,
    "jname": String,
    "ename": String,
    "img": String,
    "ceffect": String
  });

  return mongoose.model('Item', ItemSchema);
};
