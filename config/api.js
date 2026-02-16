// API配置文件
const API_CONFIG = {
  // 本地环境
  development: {
    baseUrl: 'http://192.168.31.213:3003/api'
  },
  // 线上环境
  production: {
    baseUrl: 'https://vapi.pastecuts.cn/booksnap/api'
  }
};

// 环境检测
const getEnv = () => {
  // 开发环境：微信开发者工具
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    const systemInfo = wx.getSystemInfoSync();
    // 在开发者工具中，platform为"devtools"
    if (systemInfo.platform === 'devtools') {
      return 'development';
    }
  }
  // 生产环境：真机环境
  return 'production';
};


// 获取API基础URL
const getBaseUrl = () => {
  const env = getEnv();
  return API_CONFIG[env].baseUrl;
};

// API接口定义
const API_ENDPOINTS = {
  // 分类相关接口
  categories: '/category-types',
  // 壁纸相关接口
  mobileWallpapers: '/wallpaper/mobile',
  chatWallpapers: '/wallpaper/chat',
  computerWallpapers: '/wallpaper/computer',
  momentsWallpapers: '/wallpaper/moments',
  avatarWallpapers: '/wallpaper/avatar',
  emojiWallpapers: '/wallpaper/emoji'
};

module.exports = {
  getBaseUrl,
  API_ENDPOINTS
};
