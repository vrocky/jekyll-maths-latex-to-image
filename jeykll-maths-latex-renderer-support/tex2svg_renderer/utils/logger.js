const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logDir, prefix = '') {
        this.logDir = logDir;
        this.prefix = prefix;
        const timestamp = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logDir, `${prefix}-${timestamp}.log`);
    }

    log(message) {
        const entry = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(this.logFile, entry);
    }

    error(message, error) {
        const errorDetails = error ? `\n${error.stack || error}` : '';
        const entry = `[${new Date().toISOString()}] ERROR: ${message}${errorDetails}\n`;
        fs.appendFileSync(this.logFile, entry);
    }
}

module.exports = Logger;
