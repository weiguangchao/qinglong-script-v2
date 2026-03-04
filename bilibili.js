/**
 * new Env("哔哩哔哩每日任务")
 * cron: 0 8 * * *
 *
 * ck名称：bilibili_ck
 * ck格式: cookie;;;每日投币数量;;;投币方式(1: 为关注用户列表视频投币 0: 为随机投币)
 *
 */
const axios = require('axios');
const { Logger, getEnv, getCookieProperty } = require('./util.js');

const logger = new Logger('哔哩哔哩每日任务');
const ckName = 'bilibili_ck';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64';

// 获取用户信息
async function nav(cookie) {
  const response = await axios.get(
    'https://api.bilibili.com/x/web-interface/nav',
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    throw new Error(body.message);
  }

  const uname = body.data?.uname;
  const uid = body.data?.mid;
  const is_login = body.data?.isLogin;
  const coin = body.data?.money;
  const vip_type = body.data?.vipType;
  const current_exp = body.data?.level_info?.current_exp;
  logger.log(
    `用户: ${uname}, uid: ${uid}, 是否登录: ${is_login}, 硬币: ${coin}, vip类型: ${vip_type}, 当前经验: ${current_exp}`,
  );

  return { uname, uid, is_login, coin, vip_type, current_exp };
}

// 漫画客户端签到
async function mangaClockIn(cookie) {
  const response = await axios.post(
    'https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn',
    new URLSearchParams({ platform: 'android' }).toString(),
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    logger.logAll(`漫画签到失败：${body.msg}`);
    throw new Error(body.msg);
  }
}

// 领取大会员权益
// type int 权益类型 1为B币劵 2为优惠券
async function vipPrivilegeReceive(cookie, type, csrf) {
  const response = await axios.post(
    'https://api.bilibili.com/x/vip/privilege/receive',
    new URLSearchParams({
      type,
      csrf,
    }).toString(),
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    logger.logAll(`大会员权益领取失败：${body.message}`);
    throw new Error(body.message);
  }
}

// 漫画大会员权益
async function mangaGetVipReward(cookie) {
  const response = await axios.post(
    'https://manga.bilibili.com/twirp/user.v1.User/GetVipReward',
    { reason_id: 1 },
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    logger.logAll(`漫画大会员权益领取失败：${body.msg}`);
    throw new Error(body.msg);
  }
}

!(async () => {
  const ckArr = getEnv(ckName);

  for (const ck of ckArr) {
    try {
      const items = ck.split(';;;');
      const [cookie, coinNum, coinType] = items;
      const csrf = getCookieProperty(cookie, 'bili_jct');
      
      logger.log(`cookie: ${cookie}`);
      logger.log(`coinNum: ${coinNum}`);
      logger.log(`coinType: ${coinType}`);
      logger.log(`csrf: ${csrf}`);

      // await nav(cookie);
      // await mangaClockIn(cookie);
      // await vipPrivilegeReceive(cookie, coinType, csrf);
      // await mangaGetVipReward(cookie);
    } catch (error) {
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
