module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const MoveSchema = new Schema({
    "id": String,
    "cname": String,
    "jname": String,
    "ename": String,
    "property": String,
    "type": String,
    "power": String,
    "hit": String,
    "priority": String,
    "PP": String,
    "explain": String,
    "generations": String,
    "oldname": String,
    "remark": String,
    "scope": String,
    "effect": String,
    "change": String,
    "lp": String,
    "drop": String,
    "importv": String
  });

  return mongoose.model('Move', MoveSchema);
};
