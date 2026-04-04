/**
 * new Env("机场签到")
 * cron: 0 8 * * *
 *
 * ck名称: jc
 * ck格式: 机场地址;;;邮箱;;;密码
 *
 */
const { App, getEnv, sleep, DEFAULT_UA, getAxiosInstance } = require('./utils.js');

const app = new App('机场签到');
const envName = 'jc';
const axiosInstance = getAxiosInstance(app);

async function login(baseURL, email, passwd) {
  app.log(`${baseURL} ${email} 正在登录`);
  const response = await axiosInstance(`${baseURL}/auth/login`, {
    method: 'POST',
    params: { email, passwd },
    headers: {
      'user-agent': DEFAULT_UA,
    },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(`用户登录: 登录失败! ${data.msg}`);
  }

  const cookie = response.headers['set-cookie'];
  app.log(`cookie: ${cookie}`);
  return cookie;
}

async function checkin(baseURL, cookie) {
  app.log(`${baseURL} 正在签到`);
  const response = await axiosInstance(`${baseURL}/user/checkin`, {
    method: 'POST',
    headers: {
      'user-agent': DEFAULT_UA,
      cookie,
    },
  });

  const data = response.data;
  if (data.ret != 1) {
    throw new Error(`签到: 签到失败! ${data.msg}`);
  }

  app.logAll(`签到: ${baseURL} 签到成功: ${data.msg}`);
}

!(async () => {
  const envs = await getEnv(envName);

  for (const env of envs) {
    try {
      const config = env.split(';;;');
      const [baseURL, email, passwd] = config;

      const cookie = await login(baseURL, email, passwd);
      await sleep();

      await checkin(baseURL, cookie).catch((error) => {
        app.logAll(error.message);
      });
      await sleep();
    } catch (error) {
      app.logAll('脚本执行失败, 请到控制台查看日志');
      app.logAll(error.message);
    }
  }
  app.notify();
})();
