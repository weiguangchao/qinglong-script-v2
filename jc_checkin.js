/**
 * new Env("机场签到")
 * cron: 0 8 * * *
 *
 * ck名称: jc
 * ck格式: 机场地址;;;邮箱;;;密码
 *
 */
const axios = require('axios');
const { Logger, getEnv, sleep } = require('./util.js');

const logger = new Logger('机场签到');
const envName = 'jc';

async function login(baseURL, email, passwd) {
  logger.log(`${baseURL} ${email} 正在登录`);
  const response = await axios(`${baseURL}/auth/login`, {
    method: 'POST',
    params: { email, passwd },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(`登录失败: ${data.msg}`);
  }

  const cookie = response.headers['set-cookie'];
  logger.log(`cookie: ${cookie}`);
  return cookie;
}

async function check(baseURL, cookie) {
  logger.log(`${baseURL} 正在签到`);
  const response = await axios(`${baseURL}/user/checkin`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
    },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(`签到失败: ${data.msg}`);
  }

  logger.logAll(`签到成功: ${data.msg}`);
}

!(async () => {
  const ckArr = getEnv(envName);

  for (const ck of ckArr) {
    try {
      const jc = ck.split(';;;');
      const cookie = await login(jc[0], jc[1], jc[2]);
      await sleep(1000);

      await check(jc[0], cookie);
      await sleep(1000);
    } catch (error) {
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
