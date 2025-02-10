const path = require('path');

function getServerConfig() {
    const baseDir = process.env.BASE_DIR || process.cwd();
    const debugDir = process.env.DEBUG_DIR || '.jekyll-cache/math-renderer';
    
    return {
        baseDir: path.resolve(baseDir),
        debugDir: path.resolve(baseDir, debugDir),
        inputStream: process.stdin,
        outputStream: process.stdout
    };
}

module.exports = { getServerConfig };
