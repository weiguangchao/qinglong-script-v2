/**
 * new Env("掘金每日任务")
 * cron: 10 8 * * *
 *
 * 功能:
 * 1.每日登录
 *
 * ck名称: juejin
 * ck格式: cookie;;;
 *
 */
const axios = require('axios');
const {
  Logger,
  getEnv,
  getCookieProperty,
  sleep,
  UA,
  formatDate,
} = require('./util.js');

const logger = new Logger('掘金每日任务');
const envName = 'juejin';

// 获取用户信息
async function userGet(cookie) {
  const response = await axios.get(
    'https://api.juejin.cn/user_api/v1/user/get',
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.err_no != 0) {
    throw new Error(`用户: 用户信息获取失败! ${body.err_msg}`);
  }

  const user_id = body.data?.user_id;
  const user_name = body.data?.user_name;
  logger.log(`用户: ${user_name}, uid: ${user_id}`);

  logger.logAll(`用户: ${user_name}`);
  logger.logAll(`UID: ${user_id}`);

  return { user_id, user_name };
}

// 获取今日签到状态
async function getTodayStatus(cookie) {
  const response = await axios.get(
    'https://api.juejin.cn/growth_api/v1/get_today_status',
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.err_no != 0) {
    throw new Error(`签到: 获取今日签到状态失败! ${body.err_msg}`);
  }

  const isSignIn = body.data;
  logger.log(`签到: 当前状态${isSignIn ? '已签到' : '未签到'}`);

  return { isSignIn };
}

// 签到
async function checkIn(cookie) {
  const response = await axios.post(
    `https://api.juejin.cn/growth_api/v1/check_in`,
    {},
    {
      headers: {
        cookie,
        'user-agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.err_no != 0) {
    throw new Error(`签到: 签到失败! ${body.err_msg}`);
  }

  const isSignIn = body.data;
  logger.log(`签到状态: ${isSignIn ? '✅' : '❌'}`);

  return { isSignIn };
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [cookie] = config;
      logger.log(`cookie: ${cookie}`);

      // await userGet(cookie); // 获取用户信息
      // await sleep();

      // const { isSignIn } = await getTodayStatus(cookie); // 检查签到状态
      // if (!isSignIn) {
      // }

      await checkIn(cookie); // 签到
      await sleep();
    } catch (error) {
      logger.logAll('脚本执行失败, 请到控制台查看日志');
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
