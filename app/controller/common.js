const Controller = require('egg').Controller;
const svgCaptcha = require('svg-captcha');
const fs = require('fs');

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
    if (code === captcha) {
      ctx.body = {
        code: 0,
        message: '验证成功'
      }
    } else {
      ctx.body = {
        code: 0,
        message: '验证失败'
      }
    }
  }

  // 从本地获取图片
  async fsImgCommon(hero_title, skin_title, item, type) {
    let imgS = []
    let path1 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '.png'
    let path2 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '.jpg'
    let path3 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '.jpeg'
    let path4 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（星元）_' + type + '.png'
    let path5 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（星元）_' + type + '.jpg'
    let path6 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（星元）_' + type + '.jpeg'
    let path7 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '星元_' + type + '.png'
    let path8 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '星元_' + type + '.jpg'
    let path9 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '星元_' + type + '.jpeg'
    let path10 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '_自制' + '.png'
    let path11 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '_自制' + '.jpg'
    let path12 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '_' + type + '_自制' + '.jpeg'
    if (fs.existsSync(path1)) {
      imgS.push(fs.readFileSync(path1).toString('base64'))
    } else if (fs.existsSync(path2)) {
      imgS.push(fs.readFileSync(path2).toString('base64'))
    } else if (fs.existsSync(path3)) {
      imgS.push(fs.readFileSync(path3).toString('base64'))
    } else if (fs.existsSync(path4)) {
      imgS.push(fs.readFileSync(path4).toString('base64'))
    } else if (fs.existsSync(path5)) {
      imgS.push(fs.readFileSync(path5).toString('base64'))
    } else if (fs.existsSync(path6)) {
      imgS.push(fs.readFileSync(path6).toString('base64'))
    } else if (fs.existsSync(path7)) {
      imgS.push(fs.readFileSync(path7).toString('base64'))
    } else if (fs.existsSync(path8)) {
      imgS.push(fs.readFileSync(path8).toString('base64'))
    } else if (fs.existsSync(path9)) {
      imgS.push(fs.readFileSync(path9).toString('base64'))
    } else if (fs.existsSync(path10)) {
      imgS.push(fs.readFileSync(path10).toString('base64'))
    } else if (fs.existsSync(path11)) {
      imgS.push(fs.readFileSync(path11).toString('base64'))
    } else if (fs.existsSync(path12)) {
      imgS.push(fs.readFileSync(path12).toString('base64'))
    }
    if (item.quality === "SA") {
      let pathSA1 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '.png'
      let pathSA2 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '.jpg'
      let pathSA3 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '.jpeg'
      let pathSA4 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（闪卡版）_' + type + '.png'
      let pathSA5 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（闪卡版）_' + type + '.jpg'
      let pathSA6 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '（闪卡版）_' + type + '.jpeg'
      let pathSA7 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '_自制' + '.png'
      let pathSA8 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '_自制' + '.jpg'
      let pathSA9 = 'db/hok/' + hero_title + '/' + hero_title + '_' + skin_title + '2_' + type + '_自制' + '.jpeg'
      if (fs.existsSync(pathSA1)) {
        imgS.push(fs.readFileSync(pathSA1).toString('base64'))
      } else if (fs.existsSync(pathSA2)) {
        imgS.push(fs.readFileSync(pathSA2).toString('base64'))
      } else if (fs.existsSync(pathSA3)) {
        imgS.push(fs.readFileSync(pathSA3).toString('base64'))
      } else if (fs.existsSync(pathSA4)) {
        imgS.push(fs.readFileSync(pathSA4).toString('base64'))
      } else if (fs.existsSync(pathSA5)) {
        imgS.push(fs.readFileSync(pathSA5).toString('base64'))
      } else if (fs.existsSync(pathSA6)) {
        imgS.push(fs.readFileSync(pathSA6).toString('base64'))
      } else if (fs.existsSync(pathSA7)) {
        imgS.push(fs.readFileSync(pathSA7).toString('base64'))
      } else if (fs.existsSync(pathSA8)) {
        imgS.push(fs.readFileSync(pathSA8).toString('base64'))
      } else if (fs.existsSync(pathSA9)) {
        imgS.push(fs.readFileSync(pathSA9).toString('base64'))
      }
    }
    return imgS
  }

  // 从本地获取图片
  async fsImg(hero_title, skin_title, item) {
    let imgS = await this.fsImgCommon(hero_title, skin_title, item, '头像')
    // let imgM = await this.fsImgCommon(hero_title, skin_title, item, '半身像')
    // let imgL = await this.fsImgCommon(hero_title, skin_title, item, '海报')
    // if (skin_title === "齐天大圣") {
    //   console.log('齐天大圣:', imgS)
    // }
    // return { imgS, imgM, imgL }
    return { imgS }
  }

  // 从本地获取所有图片
  async fsAllImg(hero_title, skin_title, item) {
    let imgS = await this.fsImgCommon(hero_title, skin_title, item, '头像')
    let imgM = await this.fsImgCommon(hero_title, skin_title, item, '半身像')
    let imgL = await this.fsImgCommon(hero_title, skin_title, item, '海报')
    // if (skin_title === "功夫炙烤") {
    //   console.log('功夫炙烤:', imgS, imgM, imgL)
    // }
    return { imgS, imgM, imgL }
  }

}

module.exports = CommonController;
