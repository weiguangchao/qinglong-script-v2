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

async function checkin(baseURL, cookie) {
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

  logger.logAll(`机场 ${baseURL} 签到成功: ${data.msg}`);
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [baseURL, email, passwd] = config;

      const cookie = await login(baseURL, email, passwd);
      await sleep(1000);

      await checkin(baseURL, cookie).catch((error) => {
        logger.logAll(`机场 ${baseURL} 签到失败: ${error.message}`);
      });
      await sleep(1000);
    } catch (error) {
      logger.log(error.message);
      logger.logAll('脚本执行失败, 请到控制台查看日志');
    }
  }
  logger.notify();
})();
