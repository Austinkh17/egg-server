'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // },
  valparams: {
    enable: true,
    package: 'egg-valparams'
  },
  jwt: {
    enable: true,
    package: "egg-jwt"
  },
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  }

};
