module.exports = options => {
    return async function jwt(ctx, next) {
      const token = ctx.request.header.authorization;
      if (token) {
        try {
          // 解码token
          let decode = ctx.app.jwt.verify(token, app.config.jwt.secret);
          await next();
          console.log(decode);
        } catch (error) {
          ctx.status = 401;
          ctx.body = {
                code: 200,
                message: error.message,
          };
          return;
        }
      } else {
        ctx.status = 401;
        ctx.body = {
            code: 0,
            msg: '没有token',
        };
        return;
      }
    };
  };