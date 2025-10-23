/**
 * new Env("机场签到")
 * cron: 0 8 * * *
 */
const axios = require('axios');
const { Logger } = require('./logger.js');

const logger = new Logger('机场签到');

const loginPath = '/auth/login';
const checkPath = '/user/checkin';

function login(baseURL, email, passwd) {
  return axios(baseURL + loginPath, {
    method: 'POST',
    params: { email, passwd },
  })
    .then((response) => {
      let data = response.data;
      if (data.ret != 1) {
        throw {
          message: data.msg,
        };
      }

      let cookie = response.headers['set-cookie'];
      return cookie;
    })
    .catch((e) => {
      return '登录失败，原因：' + e.message;
    });
}

function check(baseURL, cookie) {
  return axios(baseURL + checkPath, {
    method: 'POST',
    headers: {
      Cookie: cookie,
    },
  })
    .then((response) => {
      let data = response.data;
      if (data.ret != 1) {
        throw {
          message: data.msg,
        };
      }

      // sendMessage.push(data.msg);
      QLAPI.notify('机场签到', data.msg);
    })
    .catch((e) => {
      return '签到失败, 原因：' + e.message;
    });
}

function getEnv() {
  let jcckArr = [];
  let jcck = process.env.jcck;

  if (!jcck) {
    console.log('定义环境变量jcck=邮箱;;;密码');
    process.exit(0);
  }

  if (Array.isArray(jcck)) {
    jcckArr = jcck;
  } else if (jcck.indexOf('&') > -1) {
    jcckArr = jcck.split('&');
  } else if (jcck.indexOf('\n') > -1) {
    jcckArr = jcck.split('\n');
  } else {
    jcckArr.push(jcck);
  }

  return jcckArr;
}

!(async () => {
  const jcckArr = getEnv();

  for await (jcck of jcckArr) {
    jc = jcck.split(';;;');
    let loginResult = await login(jc[0], jc[1], jc[2]);
    if (typeof loginResult == 'string') {
      logger.logAll(`机场地址：${jc[0]}, 邮箱：${jc[1]}，${loginResult}\n`);
      continue;
    }

    let checkResult = await check(jc[0], loginResult);
    logger.logAll(`机场地址：${jc[0]}, 邮箱：${jc[1]}，${checkResult}\n`);
    logger.notify();
  }
})();
