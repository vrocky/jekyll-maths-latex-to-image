const fs = require('fs');
const path = require('path');
const JsonRpcHandler = require('./json_rpc_handler'); // Ensure this path is correct
const SvgConverter = require('../utils/svg_converter');

class MathServer {
  constructor(options) {
    if (!options.baseDir || !options.logDir || !options.debugDir || 
        !options.inputStream || !options.outputStream) {
      throw new Error('Missing required options');
    }
    
    this.options = options;
    this.isRunning = false;
    this.logsDir = options.logDir;
    this.debugDir = options.debugDir;
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    // Create directories
    fs.mkdirSync(this.logsDir, { recursive: true });
    fs.mkdirSync(this.debugDir, { recursive: true });
    
    // Setup logging
    const timestamp = new Date().toISOString().split('T')[0];
    this.rpcLogFile = path.join(this.logsDir, `math-renderer-rpc-${timestamp}.log`);
    this.processLogFile = path.join(this.logsDir, `math-renderer-process-${timestamp}.log`);
    
    this.logProcess = (msg) => {
      const entry = `[${new Date().toISOString()}] ${msg}\n`;
      fs.appendFileSync(this.processLogFile, entry);
    };

    // Initialize components
    this.svgConverter = new SvgConverter(this.debugDir, this.logProcess.bind(this));
    this.rpcServer = new JsonRpcHandler(this, this.logProcess.bind(this), {
      inputStream: this.options.inputStream,
      outputStream: this.options.outputStream
    });

    this.isRunning = true;
    this.logProcess('Math server started');
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
    this.logProcess('Math server stopped');
  }

  async renderMath(params) {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    const latex = params.latex;
    this.logProcess(`Rendering LaTeX: ${latex}`);
    return await this.svgConverter.convertLatexToSvg(latex, params);
  }

  isActive() {
    return this.isRunning;
  }
}

module.exports = MathServer;
