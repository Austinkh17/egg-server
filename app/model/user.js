module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const UserSchema = new Schema({
        "password": String,
        "username": String
    });
  
    return mongoose.model('User', UserSchema);
};
  