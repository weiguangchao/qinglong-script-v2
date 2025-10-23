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
    QLAPI.notify(this.scriptName, this.notifyMessage.join('\n'));
    this.notifyMessage = [];
  }
}

function getEnv(envName) {
  let ckArr = [];
  let ck = process.env[envName];

  if (!ck) {
    console.log('ck未定义!!!');
    process.exit(0);
  }

  if (Array.isArray(ck)) {
    ckArr = ck;
  } else if (ck.indexOf('&') > -1) {
    ckArr = ck.split('&');
  } else if (ck.indexOf('\n') > -1) {
    ckArr = ck.split('\n');
  } else {
    ckArr.push(ck);
  }

  console.log(`ck数量: ${ckArr.length}`);
  return ckArr;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { Logger, getEnv, sleep };
