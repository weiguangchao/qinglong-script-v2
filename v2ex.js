/**
 * new Env("V2EX签到")
 * cron: 10 8 * * *
 *
 * ck名称: v2ex
 * ck格式: cookie
 *
 */
const axios = require('axios');
const { Logger, getEnv, sleep, DEFAULT_UA } = require('./utils.js');

const logger = new Logger('V2EX签到');
const envName = 'v2ex';

async function missionDaily(cookie) {
  const response = await axios.get('https://www.v2ex.com/mission/daily', {
    headers: {
      'user-agent': DEFAULT_UA,
      cookie,
    },
  });

  const match = response.data.match(
    /<input type="button" class="super normal button" value=".*?" onclick="location\.href = '(.*?)';" \/>/,
  );
  const url = match ? match[1] : null;
  if (!url) {
    throw new Error('每日任务: 获取签到 URL 失败!');
  }

  logger.log(`每日任务: 获取签到 URL 成功! ${url}`);
  return url;
}

async function balance(cookie) {
  const response = await axios.get('https://www.v2ex.com/balance', {
    headers: {
      'user-agent': DEFAULT_UA,
      cookie,
    },
  });

  const totalMatch = response.data.match(
    /<td class="d" style="text-align: right;">(\d+\.\d+)<\/td>/,
  );
  const todayMatch = response.data.match(
    /<td class="d"><span class="gray">(.*?)<\/span><\/td>/,
  );
  const usernameMatch = response.data.match(
    /<a href="\/member\/.*?" class="top">(.*?)<\/a>/,
  );

  const total = totalMatch ? totalMatch[1] : null;
  const today = todayMatch ? todayMatch[1] : null;
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!total) {
    throw new Error('帐号余额: 总余额获取失败!');
  }
  if (!today) {
    throw new Error('今日签到: 今日收益获取失败!');
  }
  if (!username) {
    throw new Error('帐号信息: 用户名获取失败!');
  }

  logger.logAll(`帐号信息: ${username}`);
  logger.logAll(`今日签到: ${today}`);
  logger.logAll(`帐号余额: ${total}`);
}

async function signIn(cookie, url) {
  const once = url.split('=')[1];
  const response = await axios.get(`https://www.v2ex.com${url}`, {
    headers: {
      'user-agent': DEFAULT_UA,
      cookie,
    },
    params: {
      once: once,
    },
  });

  if (response.data) {
    logger.log(`今日签到: 签到成功!`);
  } else {
    throw new Error('今日签到: 签到失败!');
  }
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [cookie] = config;

      const url = await missionDaily(cookie);
      await sleep();

      // 签到
      if (url !== '/balance') {
        await signIn(cookie, url);
        await sleep();
      } else {
        logger.logAll(`今日签到: 已签到!`);
      }

      await balance(cookie);
      await sleep();
    } catch (error) {
      logger.logAll('脚本执行失败, 请到控制台查看日志');
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
