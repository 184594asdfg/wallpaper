// API配置文件
const API_CONFIG = {
  // 本地环境
  development: {
    baseUrl: 'http://localhost:3003/api'
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

module.exports = {
  getBaseUrl
};
