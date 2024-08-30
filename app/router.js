'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, service, middleware } = app;
  const jwt = middleware.jwt(app.config.jwt);
  router.get('/', controller.home.index);

  //  用户相关
  router.post('/k/register', controller.user.register);
  router.post('/k/login', controller.user.login);
  router.get('/k/getCaptcha', controller.user.getCaptcha);
  router.get('/k/logout', jwt, controller.user.logout);
  router.post('/k/editUser', jwt, controller.user.editUser);

  /* ------------------- poke 开始 ------------------- */
  router.get('/k/pokemon/list', controller.pokemon.getPokemonList);
  router.get('/k/pokemon/listNew', controller.pokemonNew.getPokemonList);
  router.get('/k/pokemon/ability', controller.pokemonNew.getPokemonAbility);
  router.get('/k/pokemon/move', controller.pokemonNew.getPokemonMove);
  router.get('/k/pokemon/item', controller.pokemonNew.getPokemonItem);
  router.get('/k/pokemon/detail', controller.pokemon.getPokemonDetail);


  //  统计对战热门属性
  router.get('/k/pokemon/hotType', controller.pokemon.statisticHotPokemonType);
  //  添加新字段
  router.get('/pokemon/newField', controller.pokemon.addPokemonNewField);
  // pmbattle数据库处理
  router.get("/k/pmbattle/to", controller.pokemon.pmbattleTo)

  //  爬取pokemon数据，生成数据库
  router.get('/spider/pokemonFromDB', controller.pokemonNew.spiderPokemonFromDB);
  router.get('/spider/pokemonAbility', controller.pokemonNew.spiderPokemonAbility);
  router.get('/spider/pokemonMove', controller.pokemonNew.spiderPokemonMove);
  router.get('/spider/pokemonItem', controller.pokemonNew.spiderPokemonItem);
  router.get('/spider/pokemon', controller.pokemon.spiderPokemon);// 废弃
  router.get('/spider/pokemonBattle', controller.pokemon.spiderPokemonBattle);
  router.get('/spider/pokemonDetail', controller.pokemon.spiderPokemonDetail);

  /* ------------------- poke 结束 ------------------- */


  /* ------------------- 王者 开始 ------------------- */

  //  爬取数据，生成数据库
  router.get('/spider/hok/skin', controller.hok.skin.spiderSkin);
  router.get('/k/spider/hok/hero', controller.hok.hero.spiderHero);
  router.get('/k/spider/hok/heroTime', controller.hok.hero.spiderHeroTime);
  router.get('/k/spider/hok/skinTagId', controller.hok.hero.spiderSkinTagId);
  //  爬取皮肤图片数据
  router.get('/k/hok/spider/skinImg', controller.hok.hero.spiderSkinImg);
  //  爬取所有皮肤标签
  router.get('/k/hok/spider/skinIcon', controller.hok.hero.spiderSkinIcon);
  //  给每个英雄的皮肤添加皮肤标签的字段
  router.get('/k/hok/skin/addSkinIcon', controller.hok.hero.addSkinIcon);
  //  获取皮肤标签的图片
  router.get('/k/hok/getSkinIcon', controller.hok.hero.getSkinIcon);


  router.get('/k/hok/skin', controller.hok.skin.getSkinList);
  router.post('/k/hok/updateSkinAttr', controller.hok.skin.updateSkinAttr);
  router.post('/k/hok/updateUserSkinsAttr', controller.hok.skin.updateUserSkinsAttr);
  router.get('/k/hok/hero', controller.hok.hero.getHeroList);
  router.get('/k/hok/getAllSkins', controller.hok.hero.getAllSkins);
  router.post('/k/hok/getImg', controller.hok.hero.getImg);
  router.post('/k/hok/getMaterial', controller.hok.skin.getMaterial);
  //  添加新字段
  router.get('/k/hok/skin/newField', controller.hok.skin.addSkinNewField);
  //  计算英雄的皮肤相关信息
  router.post('/k/hok/statisticSkin', controller.hok.hero.statisticSkin);
  //  更新皮肤数据
  router.post('/k/hok/refreshSkinDataApi', controller.hok.skin.spiderSkin);
  //  更新用户的皮肤数据
  router.post('/k/hok/refreshUserSkinApi', controller.user.refreshUserSkin);

  /* ------------------- 王者 结束 ------------------- */


  /* ------------------- 生活记录 开始 ------------------- */
  router.get('/k/getLifeRecordList', controller.record.lifeRecord.getLifeRecordList);



  /* ------------------- 生活记录 结束 ------------------- */
};
