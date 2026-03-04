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
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

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
  }
  logger.logAll(`漫画签到：${body.msg}`);
}

// 领取大会员权益
// type int 权益类型 1为B币劵 2为优惠券
async function vipPrivilegeReceive(cookie, csrf, type) {
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
  }
  logger.logAll(`大会员权益领取：${body.message}`);
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
  }
  logger.logAll(`漫画大会员权益领取：${body.msg}`);
}

// 银瓜子换硬币
async function silver2coin(cookie, csrf) {
  const response = await axios.post(
    'https://api.live.bilibili.com/xlive/revenue/v1/wallet/silver2coin',
    new URLSearchParams({
      csrf,
    }).toString(),
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
    logger.logAll(`银瓜子换硬币失败：${body.message}`);
  }
  logger.logAll(`银瓜子换硬币：${body.message}`);
}

// 获取直播金银瓜子状态
async function liveStatus(cookie) {
  const response = await axios.get(
    'https://api.live.bilibili.com/pay/v1/Exchange/getStatus',
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

  const coin = body.data?.coin;
  const gold = body.data?.gold;
  const silver = body.data?.silver;
  logger.log(`硬币: ${coin}, 金瓜子: ${gold}, 银瓜子: ${silver}`);

  return { coin, gold, silver };
}

// 首页top推荐
async function topRcmd(cookie) {
  const response = await axios.get(
    'https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd',
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
  return body.data;
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

      // await nav(cookie); // 获取用户信息
      // await mangaClockIn(cookie); // 漫画签到
      // await vipPrivilegeReceive(cookie, coinType, csrf); // 领取大会员权益
      // await mangaGetVipReward(cookie); // 漫画大会员权益
      // await silver2coin(cookie, csrf); // 银瓜子换硬币
      // await liveStatus(cookie); // 获取直播金银瓜子状态
      // await topRcmd(cookie, csrf); // 首页top推荐
    } catch (error) {
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
