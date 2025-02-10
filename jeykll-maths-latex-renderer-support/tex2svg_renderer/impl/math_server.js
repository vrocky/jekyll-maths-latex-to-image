const fs = require('fs');
const path = require('path');
const JsonRpcHandler = require('./json_rpc_handler');
const SvgConverter = require('../utils/svg_converter');
const Logger = require('../utils/logger');

class MathServer {
  constructor(options = {}) {
    const requiredParams = {
      baseDir: options.baseDir,
      debugDir: options.debugDir,
      inputStream: options.inputStream,
      outputStream: options.outputStream
    };

    const missingParams = Object.entries(requiredParams)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingParams.length > 0) {
      const missingList = missingParams.join(', ');
      throw new Error(`Missing required parameters: ${missingList}`);
    }
    
    this.options = options;
    this.isRunning = false;
    this.debugDir = options.debugDir;
    this.logger = new Logger(this.debugDir, 'math-server');
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    fs.mkdirSync(this.debugDir, { recursive: true });
    
    this.svgConverter = new SvgConverter(this.debugDir);
    this.rpcServer = new JsonRpcHandler(this, {
      inputStream: this.options.inputStream,
      outputStream: this.options.outputStream,
      logger: this.logger
    });

    this.isRunning = true;
    this.logger.log('Math server started');
    return this;
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.rpcServer) {
      await this.rpcServer.close();
    }
    
    this.isRunning = false;
    this.logger.log('Math server stopped');
  }

  async renderMath(params) {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    const latex = params.latex;
    this.logger.log(`Rendering LaTeX: ${latex}`);
    return await this.svgConverter.convertLatexToSvg(latex, params);
  }

  isActive() {
    return this.isRunning;
  }
}

module.exports = MathServer;
