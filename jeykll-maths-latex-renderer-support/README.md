# Jekyll Maths LaTeX Renderer Support

Node.js support package for the Jekyll Maths LaTeX to Image plugin. This package provides the core functionality for converting LaTeX mathematical expressions to SVG and PNG formats.

## Features

- Convert LaTeX math expressions to SVG via JSON-RPC over STDIO
- Convert SVG to PNG with custom DPI settings
- Efficient caching system
- Designed for seamless integration with Ruby Jekyll plugin

## Installation

```bash
npm install jeykll-maths-latex-to-image-node-support
```

## Architecture

The `jekyll-maths-tex2svg` command provides a JSON-RPC server over STDIO that:
- Listens for LaTeX conversion requests from the Ruby Jekyll plugin
- Converts LaTeX expressions to SVG format
- Returns results via the JSON-RPC protocol

This architecture ensures:
- Efficient process reuse
- Stable inter-process communication
- Clean integration with the Ruby ecosystem

## Usage

This package is primarily used as a backend service for the Jekyll plugin. Direct command-line usage is not intended for end users.

### Integration Usage (Internal)

The Jekyll plugin spawns the Node.js process and communicates via JSON-RPC: 

```javascript
// Ruby side spawns:
jekyll-maths-tex2svg

// Communication happens via STDIO using JSON-RPC:
// Input format:
{"jsonrpc": "2.0", "method": "convertToSVG", "params": ["E = mc^2"], "id": 1}

// Output format:
{"jsonrpc": "2.0", "result": "<svg>...</svg>", "id": 1}
```

## Requirements

- Node.js >= 14.0.0
- LaTeX installation (TeXLive recommended)
- Sharp dependencies for image processing

## API Documentation

### convertToSVG(latex, options)
Converts LaTeX expression to SVG format.

### convertToPNG(inputPath, outputPath, options)
Converts SVG file to PNG format.

## License

MIT License
