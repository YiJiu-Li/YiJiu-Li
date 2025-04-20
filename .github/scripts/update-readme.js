const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');

// README.md 文件路径
const readmePath = path.join(process.cwd(), 'README.md');

async function updateReadme() {
  try {
    // 读取当前 README 内容
    let readmeContent = fs.readFileSync(readmePath, 'utf8');

    // 获取当前时间
    const currentDate = moment().format('YYYY年MM月DD日 HH:mm:ss');
    
    // 更新最后更新时间
    const lastUpdatedSection = `## 🔄 最后更新

<div align="center">
  <p>此页面最后更新于：${currentDate}</p>
  <p><i>此信息由 GitHub Actions 自动更新</i></p>
</div>`;

    // 检查是否已经有最后更新部分
    if (readmeContent.includes('## 🔄 最后更新')) {
      // 替换已有的最后更新部分
      readmeContent = readmeContent.replace(
        /## 🔄 最后更新[\s\S]*?<\/div>/m,
        lastUpdatedSection
      );
    } else {
      // 在页脚前添加最后更新部分
      const footerMarker = '![Footer](https://capsule-render.vercel.app';
      if (readmeContent.includes(footerMarker)) {
        readmeContent = readmeContent.replace(
          footerMarker,
          `${lastUpdatedSection}\n\n${footerMarker}`
        );
      } else {
        // 如果没有找到页脚标记，则添加到文件末尾
        readmeContent += `\n\n${lastUpdatedSection}\n`;
      }
    }

    // 写入更新后的 README 内容
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log('README.md 已成功更新');
  } catch (error) {
    console.error('更新 README 时出错:', error);
    process.exit(1);
  }
}

// 执行更新
updateReadme();