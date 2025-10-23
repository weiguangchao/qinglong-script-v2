/**
 * new Env("日志工具类")
 * cron: 1 1 1 1 *
 */
class Logger {
  startTime = Date.now();
  notifyMessage = [];
  scriptName = '';

  constructor(scriptName) {
    this.scriptName = scriptName;
    this.notifyMessage.push(`${scriptName}`);
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
    QLAPI.notify(this.notifyMessage.join('\n'), '');
    this.notifyMessage = [];
  }
}

const logger = new Logger();
export { logger };
