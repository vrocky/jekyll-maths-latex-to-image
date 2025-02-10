const texsvg = require('texsvg');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class SvgConverter {
  constructor(debugDir, logger) {
    this.debugDir = debugDir;
    this.logger = logger;
  }

  async convertLatexToSvg(latex, options) {
    return await texsvg(latex, {
      displayMode: options.display,
      container: options.svgOptions?.containerWidth || 300,
      useStandardSize: true
    });
  }

  saveSvg(latex, svg, id) {
    const hash = crypto.createHash('md5').update(latex).digest('hex').slice(0, 8);
    const sanitizedLatex = latex.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    const filename = `${sanitizedLatex}-${hash}-${id}.svg`;
    const filepath = path.join(this.debugDir, filename);
    
    fs.writeFileSync(filepath, svg);
    this.logger(`Saved SVG: ${filename}`);
  }

  unescapeLatex(latex) {
    return latex.replace(/\\\\(?![a-zA-Z{}\s])/g, '\\');
  }
}

module.exports = SvgConverter;
