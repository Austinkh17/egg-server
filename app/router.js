'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;
  const jwt = middleware.jwt(app.config.jwt);
  router.get('/', controller.home.index);
  router.post('/k/register', controller.user.register);
  router.post('/k/login', controller.user.login);
  router.get('/k/getCaptcha', controller.user.getCaptcha);
  router.get('/k/logout', jwt, controller.user.logout);
  router.post('/k/editUser', jwt, controller.user.editUser);
  
  router.get('/spider/pokemon', controller.pokemon.spiderPokemon);

  router.get('/k/pokemon/list', jwt, controller.pokemon.getPokemonList);
};
