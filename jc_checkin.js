/**
 * new Env("机场签到")
 * cron: 0 8 * * *
 *
 * ck格式: 机场地址;;;邮箱;;;密码
 *
 */
const axios = require('axios');
const { Logger, getEnv } = require('./util.js');

const logger = new Logger('机场签到');
let cookie = '';

const loginPath = '/auth/login';
const checkPath = '/user/checkin';

async function login(baseURL, email, passwd) {
  logger.log(`${baseURL} ${email} 正在登录`);
  const response = await axios(baseURL + loginPath, {
    method: 'POST',
    params: { email, passwd },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(data.msg);
  }

  cookie = response.headers['set-cookie'];
  logger.log('cookie: ' + cookie);
}

async function check(baseURL) {
  logger.log(`${baseURL} 正在签到`);
  const response = await axios(baseURL + checkPath, {
    method: 'POST',
    headers: {
      Cookie: cookie,
    },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(data.msg);
  }

  logger.logAll('签到成功: ' + data.msg);
}

!(async () => {
  try {
    const jcckArr = getEnv('jcck');

    for (const jcck of jcckArr) {
      const jc = jcck.split(';;;');
      await login(jc[0], jc[1], jc[2]);
      await check(jc[0]);
    }
  } catch (error) {
    logger.logAll(error.message);
  } finally {
    logger.notify();
  }
})();
