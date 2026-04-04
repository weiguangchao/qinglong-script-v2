/**
 * new Env("utils.js")
 * cron: 1 1 1 1 *
 */

const axios = require('axios');
const { stringify } = require('safe-stable-stringify');

const DEFAULT_SLEEP_TIME = 3000;

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';

class App {
  startTime = Date.now();
  notifyMessage = [];
  scriptName = '';

  constructor(scriptName) {
    this.scriptName = scriptName;
  }

  log(...args) {
    if (args?.length === 0) {
      return '';
    }
    const msg = args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        return stringify(arg);
      })
      .join('\n');
    console.log(msg);
    return msg;
  }

  logAll(...args) {
    const msg = this.log(...args);
    this.notifyMessage.push(msg);
  }

  notify() {
    if (typeof QLAPI !== 'undefined' && this.notifyMessage.length > 0) {
      QLAPI.notify(this.scriptName, this.notifyMessage.join('\n'));
    }
    this.notifyMessage = [];
  }
}

async function getEnv(envName) {
  if (typeof QLAPI === 'undefined') {
    const env = process.env[envName];
    if (!env) {
      throw new Error(`未找到环境变量 ${envName}`);
    }
    return [env];
  }

  const response = await QLAPI.getEnvs({ searchValue: '' });
  if (response.code !== 200 || !response.data?.length) {
    throw new Error(`查找环境变量出错: ${response.message}`);
  }

  const envItems = response.data
    .filter((item) => {
      return item.name === envName;
    })
    .map((item) => item.value);

  if (!envItems) {
    throw new Error(`未找到环境变量 ${envName}`);
  }

  console.log(`env数量: ${envItems.length}`);
  return envItems;
}

async function sleep(ms = DEFAULT_SLEEP_TIME) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCookieProperty(cookie, propertyName) {
  const match = cookie.match(new RegExp(`${propertyName}=([^;]+)`));
  return match ? match[1] : '';
}

/**
 * 格式化日期
 * @param {string} format - 格式字符串，支持: YYYY(年) MM(月) DD(日) HH(时) mm(分) ss(秒) SSS(毫秒)
 * @param {Date} date - Date 对象，不传则使用当前时间
 * @returns {string} 格式化后的日期字符串
 * @example formatDate('YYYY-MM-DD HH:mm:ss', new Date()) // '2025-03-10 12:30:45'
 */
function formatDate(format, date = new Date()) {
  return format
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
    .replace(/DD/g, String(date.getDate()).padStart(2, '0'))
    .replace(/HH/g, String(date.getHours()).padStart(2, '0'))
    .replace(/mm/g, String(date.getMinutes()).padStart(2, '0'))
    .replace(/ss/g, String(date.getSeconds()).padStart(2, '0'))
    .replace(/SSS/g, String(date.getMilliseconds()).padStart(3, '0'));
}

/**
 * 创建 axios 实例（配置响应拦截器打印日志）
 * @param {App} app - App 实例
 * @returns {import('axios').AxiosInstance} axios 实例
 */
function getAxiosInstance(logger) {
  const axiosInstance = axios.create();

  // 响应拦截器 - 打印请求响应信息
  axiosInstance.interceptors.response.use(
    (response) => {
      const url = response.config?.url;
      logger.log(`请求 URL: ${url}`, `响应数据: `, response?.data);
      return response;
    },
    (error) => Promise.reject(error),
  );

  return axiosInstance;
}

module.exports = {
  CONTENT_TYPE_FORM,
  CONTENT_TYPE_JSON,
  DEFAULT_SLEEP_TIME,
  DEFAULT_UA,
  formatDate,
  getAxiosInstance,
  getCookieProperty,
  getEnv,
  App,
  sleep,
};
