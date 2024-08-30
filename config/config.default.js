/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1605517860694_7907';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.valparams = {
    locale: 'zh-cn',
    throwError: false
  };

  config.crypto = {
    secret: 'Z#fOGf$te4^J28l1Z&$#fXCNifv!ZHQnEG'
  };

  config.jwt = {
    secret: 'qhdgw@45ncashdaksh2!#@3nxjdas*_672'
  };

  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/egg-server',
      options: {}
    }
  };

  config.security = {
    csrf: {
      // queryName: '_csrf', // 通过 query 传递 CSRF token 的默认字段为 _csrf
      // bodyName: '_csrf', // 通过 body 传递 CSRF token 的默认字段为 _csrf
      enable: false
    }
  };

  config.cors = {
    origin: ctx => {
      return ctx.request.header.origin || 'https://xxx.xxx.com'
    },
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true
  };

  return {
    ...config,
    ...userConfig,
  };
};
