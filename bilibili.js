/**
 * new Env("哔哩哔哩每日任务")
 * cron: 5 8 * * *
 *
 * 功能:
 * 1.每日登录
 * 2.视频分享
 * 3.漫画签到
 * 4.领取大会员权益
 *
 * ck名称：bilibili
 * ck格式: cookie;;;
 *
 */
const axios = require('axios');
const { Logger, getEnv, getCookieProperty, sleep } = require('./util.js');

const logger = new Logger('哔哩哔哩每日任务');
const envName = 'bilibili';
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
    throw new Error(`获取用户信息失败: ${body.message}`);
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
    throw new Error(`漫画签到失败: ${body.msg}`);
  }
  logger.logAll(`漫画签到: ${body.msg}`);
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
    throw new Error(`大会员权益领取失败: ${body.message}`);
  }
  logger.logAll(`大会员权益领取: ${body.message}`);
}

// 大会员漫画权益
async function vipMangaReward(cookie) {
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
    logger.logAll(`漫画大会员权益领取失败: ${body.msg}`);
  }
  logger.logAll(`漫画大会员权益领取: ${body.msg}`);
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
    throw new Error(`银瓜子换硬币失败: ${body.message}`);
  }
  logger.logAll(`银瓜子换硬币: ${body.message}`);
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
    throw new Error(`获取直播金银瓜子状态失败: ${body.message}`);
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
    throw new Error(`首页top推荐失败: ${body.message}`);
  }
  return body.data.item.map((item) => ({
    aid: item.id,
    cid: item.cid,
    title: item.title,
  }));
}

// 上报视频进度
async function historyReport(cookie, csrf, aid, cid, progres = 300) {
  const response = await axios.post(
    'http://api.bilibili.com/x/v2/history/report',
    new URLSearchParams({
      aid,
      cid,
      progres,
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
    throw new Error(`上报视频进度失败: ${body.message}`);
  }
  logger.logAll(
    `上报视频进度, aid: ${aid}, cid: ${cid}, progres: ${progres}, message: ${body.message}`,
  );
}

// 分享视频
async function shareAdd(cookie, csrf, aid) {
  const response = await axios.post(
    'https://api.bilibili.com/x/web-interface/share/add',
    new URLSearchParams({
      aid,
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
    throw new Error(`分享视频失败: ${body.message}`);
  }
  logger.logAll(`分享视频：${body.message}`);
}

// 获取大会员权益
async function vipPrivilegeMy(cookie) {
  const response = await axios.get(
    'https://api.bilibili.com/x/vip/privilege/my',
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    throw new Error(`获取大会员权益失败: ${body.message}`);
  }
  logger.logAll(`大会员硬币经验信息: ${body.message}`);

  return body.data;
}

!(async () => {
  const envs = getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [cookie, coinNum, coinType] = config;
      const csrf = getCookieProperty(cookie, 'bili_jct');

      logger.log(`cookie: ${cookie}`);
      logger.log(`coinNum: ${coinNum}`);
      logger.log(`coinType: ${coinType}`);
      logger.log(`csrf: ${csrf}`);

      const { vip_type } = await nav(cookie); // 获取用户信息
      await sleep(1000);

      await mangaClockIn(cookie).catch((error) => logger.logAll(error.message)); // 漫画签到
      await sleep(1000);

      await liveStatus(cookie).catch((error) => logger.logAll(error.message)); // 获取直播金银瓜子状态
      await sleep(1000);

      await silver2coin(cookie, csrf).catch((error) =>
        logger.logAll(error.message),
      ); // 银瓜子换硬币
      await sleep(1000);

      const tops = await topRcmd(cookie, csrf); // 首页top推荐
      await sleep(1000);

      await historyReport(cookie, csrf, tops[0].aid, tops[0].cid); // 观看视频
      await sleep(1000);

      await shareAdd(cookie, csrf, tops[0].aid); // 分享视频
      await sleep(1000);

      const vipData = await vipPrivilegeMy(cookie); // 获取大会员权益
      sleep(1000);
      for (const welfare of vipData.list) {
        // 领取大会员权益
        if (welfare.state === 0 && welfare.vip_type === vip_type) {
          await vipPrivilegeReceive(cookie, csrf, welfare.type).catch((error) =>
            logger.logAll(error.message),
          ); // 领取大会员权益
          sleep(1000);
        }
      }
    } catch (error) {
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
