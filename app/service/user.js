const Service = require('egg').Service;

class UserService extends Service {
  async editUser(id, updateObj) {
    return await this.ctx.model.User.updateOne({ _id: id }, updateObj);
  }
}

module.exports = UserService;
