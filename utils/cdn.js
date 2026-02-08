// utils/cdn.js
const CDN_CONFIG = {
  baseUrl: 'https://cdn2.pastecuts.cn/wallpaper',
  folders: {
    phone: 'phone_wallpaper',        // 手机壁纸
    pc: 'pc_wallpaper',           // 电脑壁纸
    chat: 'chat_background',   // 聊天背景
    avatar: 'avatar',          // 头像
    emoji: 'emoji'             // 表情
  }
};

const cdn = {
  // 获取完整图片URL
  getImageUrl(folder, filename) {
    if (!CDN_CONFIG.folders[folder]) {
      console.warn(`未知的文件夹类型: ${folder}`);
      return '';
    }
    return `${CDN_CONFIG.baseUrl}/${CDN_CONFIG.folders[folder]}/${filename}`;
  },
  
  // 获取手机壁纸图片URL
  getPhoneWallpaperUrl(filename) {
    return this.getImageUrl('phone', filename);
  },
  
  // 获取电脑壁纸图片URL
  getPcWallpaperUrl(filename) {
    return this.getImageUrl('pc', filename);
  },
  
  // 获取聊天背景图片URL
  getChatBackgroundUrl(filename) {
    return this.getImageUrl('chat', filename);
  },
  
  // 获取头像图片URL
  getAvatarUrl(filename) {
    return this.getImageUrl('avatar', filename);
  },
  
  // 获取表情图片URL
  getEmojiUrl(filename) {
    return this.getImageUrl('emoji', filename);
  },
  
  // 获取配置信息（用于调试）
  getConfig() {
    return { ...CDN_CONFIG };
  }
};

module.exports = cdn;