const axios = require('axios');
const fs = require('fs');
const moment = require('moment');

// 获取当前UTC时间
const getCurrentTime = () => {
  return moment().format('YYYY-MM-DD HH:mm:ss');
};

// 获取最近加星的仓库
async function getRecentlyStarredRepos(username) {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}/starred?sort=created&direction=desc&per_page=3`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // 如果您有GitHub令牌，可以添加授权来增加API请求限制
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    return response.data.map(repo => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description || '无描述',
      stars: repo.stargazers_count,
      owner: repo.owner.login
    }));
  } catch (error) {
    console.error('获取加星仓库失败:', error);
    return [];
  }
}

async function updateReadme() {
  try {
    // 读取当前README内容
    const currentReadme = fs.readFileSync('README.md', 'utf8');

    // 获取最近加星的仓库
    const starredRepos = await getRecentlyStarredRepos('YiJiu-Li');

    // 构建仓库列表HTML
    let reposList = '';
    if (starredRepos.length === 0) {
      reposList = '最近没有加星任何仓库';
    } else {
      reposList = starredRepos.map(repo =>
        `- [${repo.owner}/${repo.name}](${repo.url}) - ${repo.description} (⭐ ${repo.stars})`
      ).join('\n');
    }

    // 更新README中的最近加星部分
    const updatedReadme = currentReadme.replace(
      /<!-- RECENT_STARS_START -->[\s\S]*<!-- RECENT_STARS_END -->/,
      `<!-- RECENT_STARS_START -->\n${reposList}\n<!-- RECENT_STARS_END -->`
    );

    // 更新时间
    const currentTime = getCurrentTime();
    const readmeWithUpdatedTime = updatedReadme.replace(
      /🕒 最后更新于: .*?\(/,
      `🕒 最后更新于: ${currentTime} (`
    );

    // 写入更新后的README
    fs.writeFileSync('README.md', readmeWithUpdatedTime);
    console.log('README.md 已更新，添加了最近加星的仓库');
  } catch (error) {
    console.error('更新README失败:', error);
  }
}

updateReadme();