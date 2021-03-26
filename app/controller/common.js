const Controller = require('egg').Controller;
const svgCaptcha = require('svg-captcha');

class CommonController extends Controller {
    async createPassword(password) {
        const hmac = crypto.createHash("sha256", this.config.crypto.secret);
        hmac.update(password);
        return hmac.digest("hex");
    }
    // 验证密码
    async checkPassword(password, hash_password) {
        // 先对需要验证的密码进行加密
        password = await this.createPassword(password);
        return password === hash_password;  
    }
    // 生成token
    async getToken(arr) {
        return this.app.jwt.sign(arr, this.app.config.jwt.secret);
    }
    //验证token
    async checkToken(token) {
        return this.app.jwt.verify(token, app.config.jwt.secret)
    }
    
    //  校验验证码
    async checkCaptcha(ctx) {
        const { code } = ctx.query;
        const { captcha } = ctx.session;
        if(code === captcha){
            ctx.body = {
                code: 0,
                msg: '验证成功'
            }
        }else{
            ctx.body = {
                code: 0,
                msg: '验证失败'
            }
        }
    }
}

module.exports = CommonController;
