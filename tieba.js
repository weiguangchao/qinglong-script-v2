/**
 * new Env("百度贴吧签到")
 * cron: 12 8 * * *
 *
 * 功能:
 * 1.获取关注的贴吧列表
 * 2.批量签到
 *
 * ck名称: tieba
 * ck格式: cookie;;;
 *
 */
const crypto = require('crypto');

const {
  App,
  getEnv,
  getCookieProperty,
  delay,
  randomDelay,
  DEFAULT_UA,
  CONTENT_TYPE_FORM,
  getAxiosInstance,
} = require('./utils.js');

const app = new App('百度贴吧签到');
const envName = 'tieba';

// 创建 axios 实例
const axiosInstance = getAxiosInstance(app);

const HEADERS = {
  Host: 'tieba.baidu.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
  Connection: 'keep-alive',
  'Accept-Encoding': 'gzip, deflate',
  'Cache-Control': 'no-cache',
};

// MD5 签名函数
function encodeData(data) {
  const sortedKeys = Object.keys(data).sort();
  const s = sortedKeys.map((key) => `${key}=${data[key]}`).join('');
  const sign = crypto
    .createHash('md5')
    .update(s + 'tiebaclient!!!', 'utf8')
    .digest('hex')
    .toUpperCase();
  return { ...data, sign };
}

// 获取用户信息
async function getUserInfo(cookie) {
  // 获取 tbs
  const tbsResponse = await axiosInstance.get(
    'http://tieba.baidu.com/dc/common/tbs',
    {
      headers: {
        ...HEADERS,
        cookie,
      },
    },
  );

  const tbsBody = tbsResponse.data;
  if (tbsBody.is_login === 0) {
    return { tbs: false, userName: '登录失败，Cookie 异常' };
  }

  const tbs = tbsBody.tbs || '';

  // 获取用户名
  let userName = '未知用户';
  try {
    const userResponse = await axiosInstance.get(
      'https://zhidao.baidu.com/api/loginInfo',
      {
        headers: {
          cookie,
          'user-agent': DEFAULT_UA,
        },
      },
    );
    userName = userResponse.data?.userName || '未知用户';
  } catch (error) {
    app.log(`获取用户名失败: ${error.message}`);
  }

  return { tbs, userName };
}

// 获取关注的贴吧列表
async function getFavorite(cookie, bduss) {
  const forums = [];
  let pageNo = 1;

  while (true) {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = encodeData({
      BDUSS: bduss,
      _client_type: '2',
      _client_id: 'wappc_1534235498291_488',
      _client_version: '9.7.8.0',
      _phone_imei: '000000000000000',
      from: '1008621y',
      page_no: String(pageNo),
      page_size: '200',
      model: 'MI+5',
      net_type: '1',
      timestamp: String(timestamp),
      vcode_tag: '11',
    });

    const response = await axiosInstance.post(
      'http://c.tieba.baidu.com/c/f/forum/like',
      data,
      {
        headers: {
          ...HEADERS,
          cookie,
          'content-type': CONTENT_TYPE_FORM,
        },
      },
    );

    const res = response.data;

    if (res.forum_list) {
      for (const forumType of ['non-gconforum', 'gconforum']) {
        if (res.forum_list[forumType]) {
          const items = res.forum_list[forumType];
          if (Array.isArray(items)) {
            forums.push(...items);
          } else if (typeof items === 'object') {
            forums.push(items);
          }
        }
      }
    }

    if (res.has_more !== '1') {
      break;
    }

    pageNo++;
    await randomDelay(1000, 2000);
  }

  app.log(`共获取到 ${forums.length} 个关注的贴吧`);
  return forums;
}

// 批量签到
async function signForums(cookie, bduss, forums, tbs) {
  let successCount = 0;
  let errorCount = 0;
  let existCount = 0;
  let shieldCount = 0;
  const total = forums.length;

  app.logAll(`开始签到 ${total} 个贴吧`);

  for (let idx = 0; idx < forums.length; idx++) {
    const forum = forums[idx];

    // 延迟机制
    if (idx > 0) {
      await randomDelay(1500, 2500);
    }

    // 每 10 个贴吧额外休息
    if ((idx + 1) % 10 === 0 && idx + 1 < total) {
      const extraDelay = Math.random() * 5000 + 5000;
      app.log(
        `已签到 ${idx + 1}/${total} 个贴吧，休息 ${(extraDelay / 1000).toFixed(2)} 秒`,
      );
      await delay(extraDelay);
    }

    const forumName = forum.name || '';
    const forumId = forum.id || '';
    const logPrefix = `【${forumName}】吧(${idx + 1}/${total})`;

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const data = encodeData({
        _client_type: '2',
        _client_version: '9.7.8.0',
        _phone_imei: '0000000',
        model: 'MI+5',
        net_type: '1',
        BDUSS: bduss,
        fid: forumId,
        kw: forumName,
        tbs: tbs,
        timestamp: String(timestamp),
      });

      const response = await axiosInstance.post(
        'http://c.tieba.baidu.com/c/c/forum/sign',
        data,
        {
          headers: {
            ...HEADERS,
            cookie,
            'content-type': CONTENT_TYPE_FORM,
          },
        },
      );

      const result = response.data;
      const errorCode = result.error_code || '';

      if (errorCode === '0') {
        successCount++;
        if (result.user_info) {
          const rank = result.user_info.user_sign_rank;
          app.logAll(`${logPrefix} 签到成功，第${rank}个签到`);
        } else {
          app.logAll(`${logPrefix} 签到成功`);
        }
      } else if (errorCode === '160002') {
        existCount++;
        app.log(`${logPrefix} ${result.error_msg || '今日已签到'}`);
      } else if (errorCode === '340006') {
        shieldCount++;
        app.log(`${logPrefix} 贴吧已被屏蔽`);
      } else {
        errorCount++;
        app.logAll(
          `${logPrefix} 签到失败，错误: ${result.error_msg || '未知错误'}`,
        );
      }
    } catch (error) {
      errorCount++;
      app.logAll(`${logPrefix} 签到异常: ${error.message}`);
    }
  }

  return {
    total,
    success: successCount,
    exist: existCount,
    shield: shieldCount,
    error: errorCount,
  };
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [cookie] = config;
      const bduss = getCookieProperty(cookie, 'BDUSS');

      app.log(`cookie: ${cookie}`);
      app.log(`bduss: ${bduss}`);

      // 验证 BDUSS
      if (!bduss) {
        app.logAll('Cookie 中未找到 BDUSS');
        continue;
      }

      // 获取用户信息
      const { tbs, userName } = await getUserInfo(cookie);
      if (!tbs) {
        app.logAll(`账号: ${userName}`);
        app.logAll('登录状态: Cookie可能已过期');
        continue;
      }

      app.logAll(`用户: ${userName}`);
      await delay();

      // 获取关注的贴吧
      const forums = await getFavorite(cookie, bduss);
      await delay();

      // 批量签到
      if (forums.length > 0) {
        const stats = await signForums(cookie, bduss, forums, tbs);
        app.logAll(`贴吧总数: ${stats.total}`);
        app.logAll(`签到成功: ${stats.success}`);
        app.logAll(`已经签到: ${stats.exist}`);
        app.logAll(`被屏蔽的: ${stats.shield}`);
        app.logAll(`签到失败: ${stats.error}`);
      } else {
        app.logAll('贴吧总数: 0');
      }

      await delay();
    } catch (error) {
      app.logAll('脚本执行失败, 请到控制台查看日志');
      app.logAll(error.message);
    }
  }
  app.notify();
})();
