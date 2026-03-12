/**
 * new Env("工具类")
 * cron: 1 1 1 1 *
 */
class Logger {
  startTime = Date.now();
  notifyMessage = [];
  scriptName = '';

  constructor(scriptName) {
    this.scriptName = scriptName;
  }

  /**
   * 默认控制台打印
   */
  log(message, options = { console: true, notify: false }) {
    if (options.console) {
      console.log(message);
    }

    if (options.notify) {
      this.notifyMessage.push(message);
    }
  }

  /**
   * 控制台+通知
   */
  logAll(message) {
    this.log(message, { console: true, notify: true });
  }

  notify() {
    if (typeof QLAPI !== 'undefined') {
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

async function sleep(ms) {
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

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

const DEFAULT_SLEEP_TIME = 5000;

export {
  DEFAULT_SLEEP_TIME,
  formatDate,
  getCookieProperty,
  getEnv,
  Logger,
  sleep,
  UA,
};
