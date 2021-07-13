const Controller = require('./common');

class PokemonController extends Controller {
    async spiderPokemon() {
        const result = await this.service.pokemon.getPokemonList();
        console.log(result)
        if(result.length){
            for(let i = 0; i < result.length; i++){
                const pokeInfo = await this.service.pokemon.getPokemonDetail(result[i].index)
                if(pokeInfo.length){
                    await this.service.pokemon.savePokemon(pokeInfo)
                }
            }
        }
    }

    async getPokemonList() {
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
        let userinfoarr = JSON.parse(JSON.stringify(userinfo));
        // 生成token
        let token = await this.getToken(userinfoarr);
        
        // 加入session/cookie/缓存中
        ctx.session.userinfo = userinfoarr;
        ctx.session.token = token;

        // 返回用户信息和token
        return ctx.body = {
            code: 0,
            data: {token},
            msg: '登录成功'
        }
    }
}

module.exports = PokemonController;
