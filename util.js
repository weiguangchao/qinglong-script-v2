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
    if (QLAPI) {
      QLAPI.notify(this.scriptName, this.notifyMessage.join('\n'));
    } else {
      console.error('QLAPI未定义!!!');
    }
    this.notifyMessage = [];
  }
}

function getEnv(envName) {
  const envItems = QLAPI.searchValue(envName);
  if (!envItems || envItems.length == 0) {
    console.log('ck未定义!!!');
    process.exit(0);
  }

  const ckArr = envItems.map((item) => item.value);
  console.log(`ck数量: ${ckArr.length}`);
  return ckArr;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { getEnv, Logger, sleep };
