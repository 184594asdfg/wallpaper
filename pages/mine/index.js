// mine.js
Page({
  data: {
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0,
    contentTop: 0,
    
    // 用户数据
    downloadCount: 0,
    favoriteCount: 0
  },

  onLoad() {
    // 页面加载时执行
    this.calculateNavBarPosition();
    this.loadUserData();
  },

  // 计算导航栏位置和高度
  calculateNavBarPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    // 计算内容区域顶部距离
    const contentTop = menuButtonInfo.bottom + 20;
    
    this.setData({
      navBarHeight: menuButtonInfo.height + 8,
      navBarTop: menuButtonInfo.top,
      contentTop: contentTop
    });
  },

  // 加载用户数据
  loadUserData() {
    // 从本地存储获取用户数据
    const downloadCount = wx.getStorageSync('downloadCount') || 0;
    const favoriteCount = wx.getStorageSync('favoriteCount') || 0;
    
    this.setData({
      downloadCount: downloadCount,
      favoriteCount: favoriteCount
    });
  },

  // 返回首页
  onBack() {
    wx.redirectTo({
      url: '/pages/home/index'
    });
  },

  // 功能项点击事件
  onFunctionClick(e) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'downloads':
        wx.showToast({
          title: '我的下载页面开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      case 'favorites':
        wx.showToast({
          title: '我的收藏页面开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      case 'settings':
        wx.showToast({
          title: '设置页面开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      case 'feedback':
        wx.showToast({
          title: '意见反馈页面开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      case 'about':
        wx.showToast({
          title: '关于我们页面开发中',
          icon: 'none',
          duration: 2000
        });
        break;
    }
  }
})