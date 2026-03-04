/**
 * new Env("工具类")
 * cron: 1 1 1 1 *
 */
if (typeof QLAPI === 'undefined') {
  global.QLAPI = {
    notify: (title, message) => {},
    getEnvs: (obj) => {
      const value = process.env[obj.searchValue];
      return [{ value, name: obj.searchValue }];
    },
  };
}

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
    QLAPI.notify(this.scriptName, this.notifyMessage.join('\n'));
    this.notifyMessage = [];
  }
}

function getEnv(envName) {
  const envItems = QLAPI.getEnvs(envName);
  if (!envItems || envItems.length == 0) {
    throw new Error(`未找到环境变量 ${envName}`);
  }

  const ckArr = envItems.map((item) => item.value);
  console.log(`ck数量: ${ckArr.length}`);
  return ckArr;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCookieProperty(cookie, propertyName) {
  const match = cookie.match(new RegExp(`${propertyName}=([^;]+)`));
  return match ? match[1] : '';
}

export { getCookieProperty, getEnv, Logger, sleep };
