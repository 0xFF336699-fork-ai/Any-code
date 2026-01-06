const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG源文件路径
const svgPath = path.join(__dirname, 'Claude_AI_symbol.svg');

// ICO文件需要的尺寸（Windows标准）
const sizes = [16, 32, 48, 64, 128, 256];

// 生成临时PNG文件
async function generatePNGs() {
  const pngBuffers = [];

  for (const size of sizes) {
    const buffer = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();

    pngBuffers.push({ size, buffer });
    console.log(`生成 ${size}x${size} PNG`);
  }

  return pngBuffers;
}

// 创建ICO文件
function createICO(pngBuffers) {
  // ICO文件头
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);      // 保留字段
  iconDir.writeUInt16LE(1, 2);      // 图像类型 (1 = ICO)
  iconDir.writeUInt16LE(pngBuffers.length, 4); // 图像数量

  // 图像目录条目
  const dirEntries = [];
  let imageOffset = 6 + (pngBuffers.length * 16); // 头部 + 所有目录条目

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);  // 宽度 (0表示256)
    entry.writeUInt8(size === 256 ? 0 : size, 1);  // 高度 (0表示256)
    entry.writeUInt8(0, 2);                         // 调色板颜色数
    entry.writeUInt8(0, 3);                         // 保留字段
    entry.writeUInt16LE(1, 4);                      // 颜色平面数
    entry.writeUInt16LE(32, 6);                     // 每像素位数
    entry.writeUInt32LE(buffer.length, 8);          // 图像数据大小
    entry.writeUInt32LE(imageOffset, 12);           // 图像数据偏移

    dirEntries.push(entry);
    imageOffset += buffer.length;
  }

  // 组合所有部分
  const buffers = [iconDir, ...dirEntries, ...pngBuffers.map(p => p.buffer)];
  return Buffer.concat(buffers);
}

// 主函数
async function convertToICO() {
  console.log('开始转换SVG到ICO...');

  try {
    const pngBuffers = await generatePNGs();
    const icoBuffer = createICO(pngBuffers);

    const outputPath = path.join(__dirname, 'icon.ico');
    fs.writeFileSync(outputPath, icoBuffer);

    console.log(`✓ ICO文件已生成: icon.ico (包含 ${sizes.join(', ')} 尺寸)`);
  } catch (error) {
    console.error('✗ 转换失败:', error.message);
  }
}

convertToICO();
