// index.js
const { request } = require('../../config/request');

Page({
  data: {
    // 分类数据
    categories: [
      { id: 1, name: '手机壁纸', value: 0, active: true },
      { id: 2, name: '电脑壁纸', value: 1, active: false }
    ],
    // 轮播图数据
    carouselList: [
      { id: 1, bgColor: '#3498db' },
      { id: 2, bgColor: '#2ecc71' },
      { id: 3, bgColor: '#9b59b6' }
    ],
    // 壁纸数据
    wallpapers: [],
    // 预览状态
    showPreview: false,
    currentPreviewWallpaper: null,
    // 预览页面导航栏位置
    previewNavTop: 0,
    // 时间日期高度相关值
    timeDateHeight: 0,
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0,
    // 搜索框相关值
    searchBoxWidth: 0,
    // 时间和日期
    currentTime: '',
    currentDate: ''
  },
  
  onLoad() {
    // 页面加载时执行
    this.loadWallpapers(0); // 默认加载手机壁纸
    this.calculateNavBarPosition(); // 计算导航栏位置和高度
    this.calculateCategoryPosition(); // 计算分类区域位置
    this.calculatePreviewNavPosition(); // 计算预览页面导航栏位置
    this.updateDateTime(); // 更新时间和日期
    // 每秒更新一次时间
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  },
  
  // 计算导航栏位置和高度
  calculateNavBarPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 获取屏幕宽度
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    // 计算搜索框宽度（屏幕宽度减去左侧分享区域和右侧胶囊按钮区域的宽度）
    const leftAreaWidth = 80; // 左侧分享区域宽度
    const rightAreaWidth = menuButtonInfo.right - menuButtonInfo.left + 20; // 右侧胶囊按钮区域宽度（包含边距）
    const searchBoxWidth = screenWidth - leftAreaWidth - rightAreaWidth + 35; // 40为额外边距
    
    // 设置导航栏高度、顶部距离和搜索框宽度
    this.setData({
      navBarHeight: menuButtonInfo.height + 8,
      navBarTop: menuButtonInfo.top,
      searchBoxWidth: searchBoxWidth - 8
    });
  },
  
  // 更新时间和日期
  updateDateTime() {
    const now = new Date();
    // 格式化时间
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // 格式化日期（只显示月日）
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const currentDate = `${month}月${day}日`;
    
    this.setData({
      currentTime: currentTime,
      currentDate: currentDate
    });
  },
  
  // 计算预览页面导航栏位置
  calculatePreviewNavPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 设置预览页面导航栏顶部距离和时间日期高度相关值
    this.setData({
      previewNavTop: menuButtonInfo.height + 15,
      timeDateHeight: menuButtonInfo.height + 50
    });
  },
  
  // 计算分类区域位置
  calculateCategoryPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 计算分类区域顶部距离
    const categoryTop = menuButtonInfo.bottom - 35; // 胶囊按钮底部再加20px间距
    this.setData({
      categoryTop: categoryTop
    });
  },
  
  // 加载壁纸数据
  loadWallpapers(category) {
    // 调用壁纸接口
    request({
      url: '/wallpaper',
      data: {
        type: category
      },
      loadingText: '加载壁纸中...'
    }).then((data) => {
      // 成功获取数据
      // 处理接口返回的数据结构
      if (data && data.list) {
        // 为每个壁纸添加完整的图片URL
        const wallpapersWithImageUrl = data.list.map(item => ({
          ...item,
          // 使用CDN地址和正确的文件夹路径
          image: `https://cdn2.pastecuts.cn/wallpaper/${item.filename}`
        }));
        
        this.setData({
          wallpapers: wallpapersWithImageUrl
        });
      } else {
        // 使用默认数据作为 fallback
        this.setDefaultWallpapers(category);
      }
    }).catch((err) => {
      console.error('加载壁纸失败:', err);
      // 使用默认数据作为 fallback
      this.setDefaultWallpapers(category);
    });
  },
  
  // 设置默认壁纸数据（当接口调用失败时使用）
  setDefaultWallpapers(category) {
    const mockWallpapers = category === 0 ? [
      { id: 1, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20abstract%20phone%20wallpaper%20with%20geometric%20patterns&image_size=portrait_16_9' },
      { id: 2, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20nature%20phone%20wallpaper%20with%20mountains&image_size=portrait_16_9' },
      { id: 3, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20blue%20gradient%20phone%20wallpaper&image_size=portrait_16_9' },
      { id: 4, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20neon%20phone%20wallpaper&image_size=portrait_16_9' }
    ] : [
      { id: 5, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ultrawide%20landscape%20computer%20wallpaper%20with%20ocean&image_size=landscape_16_9' },
      { id: 6, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20city%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 7, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20white%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 8, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=galaxy%20space%20computer%20wallpaper&image_size=landscape_16_9' }
    ];
    
    this.setData({
      wallpapers: mockWallpapers
    });
  },
  
  // 分类点击事件
  onCategoryClick(e) {
    const category = e.currentTarget.dataset.category;
    
    // 更新分类状态
    const updatedCategories = this.data.categories.map(cat => ({
      ...cat,
      active: cat.value === category
    }));
    
    this.setData({
      categories: updatedCategories
    });
    
    // 加载对应分类的壁纸
    this.loadWallpapers(category);
  },
  
  // 预览壁纸
  previewWallpaper(e) {
    const wallpaper = e.currentTarget.dataset.wallpaper;
    this.calculatePreviewNavPosition(); // 重新计算预览页面导航栏位置
    this.setData({
      showPreview: true,
      currentPreviewWallpaper: wallpaper
    });
  },
  
  // 关闭预览
  onClosePreview() {
    this.setData({
      showPreview: false,
      currentPreviewWallpaper: null
    });
  },
  
  // 下载壁纸
  downloadWallpaper() {
    if (this.data.currentPreviewWallpaper) {
      wx.showToast({
        title: '下载功能开发中',
        icon: 'none'
      });
    }
  },
  
  // 阻止触摸移动
  preventTouchMove() {
    // 阻止触摸移动，防止模态框滑动
  },
  
  // 分享功能
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // 功能区域点击事件
  onFeatureClick(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({
      title: `点击了${type}`,
      icon: 'none'
    });
  },
  
  // 页面卸载时执行
  onUnload() {
    // 清除时间更新定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
})