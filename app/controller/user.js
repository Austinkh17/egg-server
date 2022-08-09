const Controller = require('./common');
const svgCaptcha = require('svg-captcha');

class UserController extends Controller {
    async editUser() {
        let { id, updateObj } = this.ctx.request.body
        const result = await this.service.user.editUser(id, updateObj);
    }
    async refreshUserSkin() {
        let { ctx, app } = this
        let { username } = ctx.request.body
        // 用户是否存在
        const user = await app.model.User.findOne({username})
        if (user) {
          return ctx.body = {
            code: 200,
            msg: '用户已经存在'
          }
        }
        const userSkin = user.skins.map(i => i.skin_id)
        // 插入用户数据
        let skins = await app.model.Skin.find()
        skins = skins.map(i => {
            const index = userSkin.indexOf(i.skin_id)
            if(index > -1){
                return userSkin[index]
            }else{
                return {skin_id: i.skin_id, personal_gain_way: '', personal_possess: false, personal_intention: 'D'}
            }
        })
        await app.model.User.update({ username }, { $set: { skins } })
    }
    async register() {
        let { ctx, app } = this
        let { username, password } = ctx.request.body
        //参数验证
        ctx.validate({
          username: {type: 'string', required: true, desc: '用户名', range: {min: 3, max: 15}},
          password: {type: 'string', required: true, desc: '密码' }
        });
        // 校验失败返回
        if (ctx.paramErrors) {
          return ctx.body = {
            code: 200,
            msg: '参数校验不通过'
          }
        }
        // 用户是否存在
        if (await app.model.User.findOne({username})) {
          return ctx.body = {
            code: 200,
            msg: '用户已经存在，无须注册'
          }
        }
        // 插入用户数据
        let skins = await app.model.Skin.find()
        skins = skins.map(i => {
            return {skin_id: i.skin_id, personal_gain_way: '', personal_possess: false, personal_intention: 'D'}
        })
        let user = await app.model.User.create({username, password, skins})
        if (!user) {
          return ctx.body = {
            code: 200,
            msg: '创建用户失败'
          }
        }else{
          return ctx.body = {
            code: 0,
            data: user,
            msg: '注册成功'
          }
        }
    }
    async login() {
        let { ctx, app } = this
        let { username, password } = ctx.request.body
        // 参数验证
        ctx.validate({
            username: {type: 'string', required: true, desc: '用户名', range: {min: 3, max: 15}},
            password: {type: 'string', required: true, desc: "密码" },
        });
        if (ctx.paramErrors) {
            return ctx.body = {
                code: 200,
                msg: '参数校验不通过'
            }
        }
        this.checkCaptcha(ctx);
        // 验证用户是否存在
        let userinfo = await app.model.User.findOne({username});
        if (!userinfo) {
            return ctx.body = {
                code: 200,
                msg: '用户不存在'
            }
        }
        // 校验密码是否正确
        if(userinfo.password != password){
            return ctx.body = {
                code: 200,
                msg: '密码不正确'
            }
        }
        let userinfoarr = JSON.parse(JSON.stringify({username: userinfo.username, password: userinfo.password}));
        // 生成token
        let token = await this.getToken(userinfoarr);
        
        // 加入session/cookie/缓存中
        ctx.session.userinfo = userinfoarr;
        ctx.session.token = token;

        // 返回用户信息和token
        return ctx.body = {
            code: 0,
            data: {token: token, username: userinfo.username},
            msg: '登录成功'
        }
    }
      
    //  生成验证码
    async getCaptcha() {
        const { ctx } = this;
        const options = {
            width: 150,
            height: 40,
            fontSize: 80,
            color: true,
            noise: 4,
            size: 6
        }
        const captcha = svgCaptcha.createMathExpr(options);
        ctx.session.captcha = captcha.text;
        ctx.session.maxAge = 1000 * 60 * 60;
        ctx.body = {
            code: 0,
            captcha: captcha.data
        }
    }

    async logout() {
        this.ctx.session = null;
        return ctx.body = {
            code: 0,
            msg: '注销成功'
        }
    }
}

module.exports = UserController;
