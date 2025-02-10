const fs = require('fs');
const path = require('path');

class JsonRpcHandler {
  constructor(mathRenderer, logger, options = {}) {
    this.mathRenderer = mathRenderer;
    this.logger = logger;
    this.buffer = '';
    
    // Default to process streams if not provided
    this.inputStream = options.inputStream || process.stdin;
    this.outputStream = options.outputStream || process.stdout;
    
    this.initializeServer();
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

  handleParseError(error) {
    return this.createErrorResponse('unknown', -32700, `Parse error: ${error.message}`);
  }

  handleRenderError(id, error) {
    return this.createErrorResponse(id, -32002, error.message);
  }

  createRenderSuccessResponse(id, svg) {
    return this.createResponse(id, {
      success: true,
      svg: Buffer.from(svg).toString('base64')
    });
  }

  async handleRequest(line) {
    try {
      if (!line.trim()) return;
      
      this.logger(`Processing request: ${line}`);
      const request = JSON.parse(line);
      
      let response;
      
      if (request.method === 'ping') {
        response = this.handlePing(request);
      } else if (request.method === 'renderMath') {
        response = await this.handleRenderMath(request);
      }
      
      const responseStr = JSON.stringify(response);
      this.logger(`Sending response: ${responseStr}`);
      this.sendResponse(responseStr);
      
    } catch (error) {
      const errorResponse = this.handleParseError(error);
      this.sendResponse(JSON.stringify(errorResponse));
    }
  }

  async handleRenderMath(request) {
    try {
      const svg = await this.mathRenderer.renderMath(request.params);
      return this.createRenderSuccessResponse(request.id, svg);
    } catch (renderError) {
      this.logger(`Render error: ${renderError.message}`);
      return this.handleRenderError(request.id, renderError);
    }
  }

  sendResponse(response) {
    this.outputStream.write(response + '\n');
    this.outputStream.write('');
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

    this.logger('JSON RPC server started');
  }
}

module.exports = JsonRpcHandler;
