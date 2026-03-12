/**
 * new Env("哔哩哔哩每日任务")
 * cron: 5 8 * * *
 *
 * 功能:
 * 1.每日登录
 * 2.视频分享
 * 3.漫画签到
 * 4.领取大会员权益
 * 5.银瓜子换硬币
 *
 * ck名称: bilibili
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

const logger = new Logger('哔哩哔哩每日任务');
const envName = 'bilibili';

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
    throw new Error(`用户: 用户信息获取失败! ${body.message}`);
  }

  const uname = body.data?.uname;
  const uid = body.data?.mid;
  const is_login = body.data?.isLogin;
  const coin = body.data?.money;
  const vip_type = body.data?.vipType;
  const current_level = body.data?.level_info?.current_level;
  const current_exp = body.data?.level_info?.current_exp;
  logger.log(
    `用户: ${uname}, uid: ${uid}, 是否登录: ${is_login}, 硬币: ${coin}, vip类型: ${vip_type}, 当前经验: ${current_exp}`,
  );

  logger.logAll(`用户: ${uname}`);
  logger.logAll(`大会员状态: ${vip_type === 2 ? '✅' : '❌'}`);
  logger.logAll(`硬币: ${coin}`);
  logger.logAll(`当前等级: ${current_level}`);
  logger.logAll(`当前经验: ${current_exp}`);

  return { uname, uid, is_login, coin, vip_type, current_exp };
}

// 获取今日经验信息
async function expLog(cookie) {
  const response = await axios.get(
    'https://api.bilibili.com/x/member/web/exp/log?jsonp=jsonp',
    {
      headers: {
        Cookie: cookie,
        'User-Agent': UA,
      },
    },
  );

  const body = response.data;
  if (body.code != 0) {
    throw new Error(`今日经验: 获取失败! ${body.message}`);
  }

  const list = body.data?.list ?? [];
  const d = new Date();
  const todayExp = list
    .filter((item) => item.time?.startsWith(formatDate('YYYY-MM-DD', d)))
    .reduce((sum, item) => sum + (item.delta ?? 0), 0);

  logger.logAll(`今日经验: ${todayExp}`);
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
    throw new Error(`漫画签到: 签到失败! ${body.msg}`);
  }

  logger.logAll(`漫画签到: 签到成功! ${body.msg}`);
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
    throw new Error(`大会员权益: 领取失败! ${body.message}`);
  }

  logger.logAll(`大会员权益: 领取成功! ${body.message}`);
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
    throw new Error(`瓜子兑换: 兑换失败! ${body.message}`);
  }

  logger.logAll(`瓜子兑换: 兑换成功! ${body.message}`);
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
    throw new Error(`金银瓜子硬币: 获取数量失败! ${body.message}`);
  }

  const coin = body.data?.coin;
  const gold = body.data?.gold;
  const silver = body.data?.silver;

  logger.logAll(`银瓜子: ${silver}`);
  logger.logAll(`金瓜子: ${gold}`);
  logger.logAll(`硬币: ${coin}`);

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
    throw new Error(`首页top推荐: 获取失败! ${body.message}`);
  }

  const tops = body.data.item.map((item) => ({
    aid: item.id,
    cid: item.cid,
    title: item.title,
  }));
  logger.log(`首页top推荐: 共获取 ${tops.length} 个视频`);

  return tops;
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
    throw new Error(`视频进度: 上报失败! ${body.message}`);
  }

  logger.log(`视频进度: 上报成功! ${body.message}`);
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
    throw new Error(`分享视频: 分享失败! ${body.message}`);
  }

  logger.log(`分享视频: 分享成功! ${body.message}`);
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
    throw new Error(`大会员权益: 获取失败! ${body.message}`);
  }
  logger.log(`大会员权益: 获取成功! ${body.message}`);

  return body.data;
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [cookie] = config;
      const csrf = getCookieProperty(cookie, 'bili_jct');

      logger.log(`cookie: ${cookie}`);
      logger.log(`csrf: ${csrf}`);

      const { vip_type } = await nav(cookie); // 获取用户信息
      await sleep();

      await mangaClockIn(cookie).catch((error) => {
        logger.logAll(error.message);
      }); // 漫画签到
      await sleep();

      const tops = await topRcmd(cookie, csrf); // 首页top推荐
      await sleep();

      await historyReport(cookie, csrf, tops[0].aid, tops[0].cid); // 观看视频
      logger.logAll(`观看视频: 观看《${tops[0].title}》300秒`);
      await sleep();

      await shareAdd(cookie, csrf, tops[0].aid).catch((error) =>
        logger.logAll(error.message),
      ); // 分享视频
      logger.logAll(`分享视频: 分享《${tops[0].title}》`);
      await sleep();

      await expLog(cookie); // 获取今日经验信息
      await sleep();

      const vipData = await vipPrivilegeMy(cookie); // 获取大会员权益
      logger.log(`大会员权益: 共获取 ${vipData.list.length} 个权益`);
      await sleep();

      for (const welfare of vipData.list) {
        // 领取大会员权益
        if (welfare.state === 0 && welfare.vip_type === vip_type) {
          await vipPrivilegeReceive(cookie, csrf, welfare.type).catch((error) =>
            logger.logAll(error.message),
          ); // 领取大会员权益
          await sleep();
        }
      }

      await sleep();
    } catch (error) {
      logger.logAll('脚本执行失败, 请到控制台查看日志');
      logger.logAll(error.message);
    }
  }
  logger.notify();
})();
