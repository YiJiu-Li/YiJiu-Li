const axios = require('axios');
const fs = require('fs');
const moment = require('moment');

// 获取当前北京时间
const getCurrentTime = () => {
  return moment().utcOffset('+0800').format('YYYY-MM-DD HH:mm:ss');
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

// 获取用户最近的提交活动
async function getRecentActivity(username) {
  try {
    // 获取用户的公开仓库
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    
    const repos = reposResponse.data.slice(0, 3); // 只处理最近更新的3个仓库
    const activities = [];
    
    for (const repo of repos) {
      try {
        // 获取每个仓库的最近提交
        const commitsResponse = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
            }
          }
        );
        
        if (commitsResponse.data.length > 0) {
          const commit = commitsResponse.data[0];
          activities.push({
            repo: repo.name,
            repoUrl: repo.html_url,
            message: commit.commit.message.split('\n')[0], // 只取提交消息的第一行
            date: moment(commit.commit.author.date).format('YYYY-MM-DD'),
            sha: commit.sha.substring(0, 7)
          });
        }
      } catch (error) {
        console.error(`获取 ${repo.name} 提交失败:`, error.message);
      }
    }
    
    return activities;
  } catch (error) {
    console.error('获取用户活动失败:', error);
    return [];
  }
}

// 获取用户简要统计信息
async function getUserStats(username) {
  try {
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    
    return {
      publicRepos: userResponse.data.public_repos,
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      createdAt: moment(userResponse.data.created_at).format('YYYY-MM-DD')
    };
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    return null;
  }
}

async function updateReadme() {
  try {
    // 读取当前README内容
    const currentReadme = fs.readFileSync('README.md', 'utf8');
    
    // 获取数据
    const username = 'YiJiu-Li';
    const starredRepos = await getRecentlyStarredRepos(username);
    const recentActivities = await getRecentActivity(username);
    const userStats = await getUserStats(username);
    
    // 构建仓库列表HTML
    let reposList = '';
    if (starredRepos.length === 0) {
      reposList = '最近没有加星任何仓库';
    } else {
      reposList = starredRepos.map(repo =>
        `- [${repo.owner}/${repo.name}](${repo.url}) - ${repo.description} (⭐ ${repo.stars})`
      ).join('\n');
    }
    
    // 构建最近活动列表
    let activitiesList = '';
    if (recentActivities.length === 0) {
      activitiesList = '最近没有公开活动';
    } else {
      activitiesList = recentActivities.map(activity =>
        `- [${activity.repo}](${activity.repoUrl}) - ${activity.message} (${activity.date})`
      ).join('\n');
    }
    
    // 构建用户统计信息，使用更美观的格式
    let statsInfo = '';
    if (userStats) {
      statsInfo = `
<div align="center">
  <table>
    <tr>
      <td><b>📂 公开仓库</b></td>
      <td><b>👥 关注者</b></td>
      <td><b>👀 关注中</b></td>
      <td><b>📅 加入时间</b></td>
    </tr>
    <tr>
      <td>${userStats.publicRepos}</td>
      <td>${userStats.followers}</td>
      <td>${userStats.following}</td>
      <td>${userStats.createdAt}</td>
    </tr>
  </table>
</div>
      `.trim();
    } else {
      statsInfo = '暂无统计数据';
    }

    // 更新README中的各个部分
    let updatedReadme = currentReadme;
    
    // 更新最近加星部分
    updatedReadme = updatedReadme.replace(
      /<!-- RECENT_STARS_START -->[\s\S]*<!-- RECENT_STARS_END -->/,
      `<!-- RECENT_STARS_START -->\n${reposList}\n<!-- RECENT_STARS_END -->`
    );
    
    // 更新最近活动部分
    if (updatedReadme.includes('<!-- RECENT_ACTIVITY_START -->')) {
      updatedReadme = updatedReadme.replace(
        /<!-- RECENT_ACTIVITY_START -->[\s\S]*<!-- RECENT_ACTIVITY_END -->/,
        `<!-- RECENT_ACTIVITY_START -->\n${activitiesList}\n<!-- RECENT_ACTIVITY_END -->`
      );
    }
    
    // 更新用户统计部分
    if (updatedReadme.includes('<!-- GITHUB_STATS_START -->')) {
      updatedReadme = updatedReadme.replace(
        /<!-- GITHUB_STATS_START -->[\s\S]*<!-- GITHUB_STATS_END -->/,
        `<!-- GITHUB_STATS_START -->\n${statsInfo}\n<!-- GITHUB_STATS_END -->`
      );
    }

    // 更新时间
    const currentTime = getCurrentTime();
    const readmeWithUpdatedTime = updatedReadme.replace(
      /🕒 最后更新于: .*?\(/,
      `🕒 最后更新于: ${currentTime} (北京时间) (`
    );

    // 写入更新后的README
    fs.writeFileSync('README.md', readmeWithUpdatedTime);
    console.log('README.md 已更新，添加了最近加星的仓库和活动信息');
  } catch (error) {
    console.error('更新README失败:', error);
  }
}

updateReadme();