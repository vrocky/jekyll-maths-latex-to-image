const sharp = require('sharp');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

async function convertSvgToPng(buildDir) {
  try {
    // Find all SVG files recursively
    const svgFiles = glob.sync('**/*.svg', { cwd: buildDir });
    
    for (const svgFile of svgFiles) {
      const svgPath = path.join(buildDir, svgFile);
      const pngPath = svgPath.replace(/\.svg$/, '.png');
      
      try {
        await sharp(svgPath)
          .png()
          .toFile(pngPath);
        console.log(`Converted: ${svgFile} -> ${path.basename(pngPath)}`);
      } catch (err) {
        console.error(`Error converting ${svgFile}:`, err);
      }
    }
  } catch (err) {
    console.error('Conversion error:', err);
    process.exit(1);
  }
}

// Get build directory from command line argument
const buildDir = process.argv[2];
if (!buildDir) {
  console.error('Please provide the build directory path');
  process.exit(1);
}

convertSvgToPng(buildDir);
