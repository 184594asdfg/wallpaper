// computer.js
const { request } = require('../../config/request');

Page({
  data: {
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0,
    // 内容区域相关值
    contentTop: 0,
    // 类型相关值
    currentType: 'latest',
    types: [
      { id: 'latest', name: '最新上传' },
      { id: 'daily', name: '一天最热' },
      { id: 'weekly', name: '一周排行' },
      { id: 'monthly', name: '人气月榜' }
    ],
    // 壁纸数据
    wallpapers: [],
    // 分页相关值
    page: 1,
    limit: 5,
    totalPages: 1,
    loading: false
  },
  
  onLoad() {
    // 页面加载时执行
    this.calculateNavBarPosition(); // 计算导航栏位置和高度
    this.calculateContentPosition(); // 计算内容区域位置
    this.loadWallpapers(); // 加载壁纸数据
  },
  
  // 加载壁纸数据
  loadWallpapers(isLoadMore = false) {
    // 防止重复加载
    if (this.data.loading) return;
    
    // 设置加载状态
    this.setData({ loading: true });
    
    // 调用壁纸接口
    request({
      url: '/wallpaper/desktop',
      data: {
        page: isLoadMore ? this.data.page + 1 : 1,
        limit: this.data.limit
      },
      loadingText: isLoadMore ? '加载更多...' : '加载壁纸中...'
    }).then((data) => {
      // 成功获取数据
      // 处理接口返回的数据结构
      if (data && data.list) {
        // 为每个壁纸添加完整的图片URL
        const wallpapersWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.wallpaper_id, // 适配数据结构，将wallpaper_id映射为id
          // 使用CDN地址和正确的文件夹路径
          image: `https://cdn2.pastecuts.cn/wallpaper/${item.filename}`
        }));
        
        // 根据是否加载更多来决定是替换还是追加数据
        const newWallpapers = isLoadMore ? [...this.data.wallpapers, ...wallpapersWithImageUrl] : wallpapersWithImageUrl;
        
        this.setData({
          wallpapers: newWallpapers,
          page: isLoadMore ? this.data.page + 1 : 1,
          totalPages: data.totalPages || 1,
          loading: false
        });
      } else {
        // 使用默认数据作为 fallback
        this.setDefaultWallpapers();
        this.setData({ loading: false });
      }
    }).catch((err) => {
      console.error('加载壁纸失败:', err);
      // 使用默认数据作为 fallback
      this.setDefaultWallpapers();
      this.setData({ loading: false });
    });
  },
  
  // 设置默认壁纸数据（当接口调用失败时使用）
  setDefaultWallpapers() {
    const mockWallpapers = [
      { id: 1, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ultrawide%20landscape%20computer%20wallpaper%20with%20ocean&image_size=landscape_16_9' },
      { id: 2, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20city%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 3, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20white%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 4, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=galaxy%20space%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 5, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20landscape%20computer%20wallpaper&image_size=landscape_16_9' },
      { id: 6, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20geometric%20computer%20wallpaper&image_size=landscape_16_9' }
    ];
    
    this.setData({
      wallpapers: mockWallpapers
    });
  },
  
  // 计算导航栏位置和高度
  calculateNavBarPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 获取屏幕宽度
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    
    // 设置导航栏高度、顶部距离
    this.setData({
      navBarHeight: menuButtonInfo.height + 8,
      navBarTop: menuButtonInfo.top
    });
  },
  
  // 计算内容区域位置
  calculateContentPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 计算内容区域顶部距离（导航栏底部距离）
    const contentTop = menuButtonInfo.bottom; // 导航栏底部再加20px间距
    // 设置内容区域顶部距离
    this.setData({
      contentTop: contentTop
    });
  },
  
  // 类型标签点击事件
  onTypeClick(e) {
    // 获取点击的类型
    const type = e.currentTarget.dataset.type;
    console.log('点击了类型:', type);
    
    // 更新当前选中的类型
    this.setData({
      currentType: type
    });
    
    // 这里可以根据类型加载不同的数据
    // 目前只实现选中状态的切换
  },
  
  // 返回按钮点击事件
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  }
})