'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, service, middleware } = app;
  const jwt = middleware.jwt(app.config.jwt);
  router.get('/', controller.home.index);
  router.post('/k/register', controller.user.register);
  router.post('/k/login', controller.user.login);
  router.get('/k/getCaptcha', controller.user.getCaptcha);
  router.get('/k/logout', jwt, controller.user.logout);
  router.post('/k/editUser', jwt, controller.user.editUser);
  
  //  爬取数据
  router.get('/spider/pokemon', controller.pokemon.spiderPokemon);
  router.get('/spider/pokemonBattle', controller.pokemon.spiderPokemonBattle);
  router.get('/spider/skin', controller.skin.spiderSkin);

  //  poke
  router.get('/k/pokemon/list', controller.pokemon.getPokemonList);
  router.get('/k/pokemon/hotType', controller.pokemon.statisticHotPokemonType);
  //  添加新字段
  router.get('/pokemon/newField', controller.pokemon.addPokemonNewField);

  //  王者
  router.get('/k/hok/skin', controller.skin.getSkinList);
  router.post('/k/hok/updateSkinAttr', controller.skin.updateSkinAttr);
  //  添加新字段
  router.get('/skin/newField', controller.skin.addSkinNewField);
};
