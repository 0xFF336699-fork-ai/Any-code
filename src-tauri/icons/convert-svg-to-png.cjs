const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG源文件路径
const svgPath = path.join(__dirname, 'Claude_AI_symbol.svg');

// 需要转换的PNG文件及其尺寸
const conversions = [
  { file: '32x32.png', size: 32 },
  { file: 'Square30x30Logo.png', size: 30 },
  { file: 'Square44x44Logo.png', size: 44 },
  { file: 'StoreLogo.png', size: 50 },
  { file: 'Square71x71Logo.png', size: 71 },
  { file: 'Square89x89Logo.png', size: 89 },
  { file: 'Square107x107Logo.png', size: 107 },
  { file: '128x128.png', size: 128 },
  { file: 'Square142x142Logo.png', size: 142 },
  { file: 'Square150x150Logo.png', size: 150 },
  { file: '128x128@2x.png', size: 256 },
  { file: 'Square284x284Logo.png', size: 284 },
  { file: 'Square310x310Logo.png', size: 310 },
  { file: 'icon.png', size: 1024 }
];

// 执行转换
async function convertAll() {
  console.log('开始转换SVG到PNG...');

  for (const conversion of conversions) {
    const outputPath = path.join(__dirname, conversion.file);

    try {
      await sharp(svgPath)
        .resize(conversion.size, conversion.size)
        .png()
        .toFile(outputPath);

      console.log(`✓ 已转换: ${conversion.file} (${conversion.size}x${conversion.size})`);
    } catch (error) {
      console.error(`✗ 转换失败: ${conversion.file}`, error.message);
    }
  }

  console.log('转换完成！');
}

convertAll();
