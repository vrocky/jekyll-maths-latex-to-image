class JsonRpcHandler {
  constructor(mathRenderer, options = {}) {
    if (!mathRenderer) {
      throw new Error('Math renderer is required');
    }
    if (!options.inputStream || !options.outputStream || !options.logger) {
      throw new Error('Input stream, output stream, and logger are required');
    }
    
    this.mathRenderer = mathRenderer;
    this.logger = options.logger;
    this.buffer = '';
    this.inputStream = options.inputStream;
    this.outputStream = options.outputStream;
    
    this.initializeServer();
  }

  async close() {
    // Cleanup code here
    this.inputStream.removeAllListeners('data');
  }

  createResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  createErrorResponse(id, code, message) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }

  handlePing(request) {
    return this.createResponse(request.id, 'pong');
  }

  async handleRequest(line) {
    try {
      if (!line.trim()) return;
      
      this.logger.log(`Processing request: ${line}`);
      const request = JSON.parse(line);
      
      let response;
      
      if (request.method === 'ping') {
        response = this.handlePing(request);
      } else if (request.method === 'renderMath') {
        response = await this.handleRenderMath(request);
      }
      
      const responseStr = JSON.stringify(response);
      this.logger.log(`Sending response: ${responseStr}`);
      this.sendResponse(responseStr);
      
    } catch (error) {
      this.logger.error(`Parse error: ${error.message}`, error);
      const errorResponse = this.createErrorResponse('unknown', -32700, `Parse error: ${error.message}`);
      this.sendResponse(JSON.stringify(errorResponse));
    }
  }

  async handleRenderMath(request) {
    try {
      const svg = await this.mathRenderer.renderMath(request.params);
      return this.createResponse(request.id, {
        success: true,
        svg: Buffer.from(svg).toString('base64')
      });
    } catch (error) {
      return this.createErrorResponse(request.id, -32002, error.message);
    }
  }

  sendResponse(response) {
    this.outputStream.write(response + '\n');
  }

  initializeServer() {
    this.inputStream.setEncoding('utf8');
    this.inputStream.on('data', async (chunk) => {
      this.buffer += chunk;
      
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop();
      
      for (const line of lines) {
        await this.handleRequest(line);
      }
    });

    this.logger.log('JSON RPC server initialized');
  }
}

module.exports = JsonRpcHandler;
