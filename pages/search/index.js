// search.js
Page({
  data: {
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0,
    // 搜索框相关值
    searchBoxWidth: 0,
    // 内容区域相关值
    contentTop: 0
  },
  
  onLoad() {
    // 页面加载时执行
    this.calculateNavBarPosition(); // 计算导航栏位置和高度
    this.calculateContentPosition(); // 计算内容区域位置
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
    
    // 设置导航栏高度、顶部距离、搜索框宽度
    this.setData({
      navBarHeight: menuButtonInfo.height + 8,
      navBarTop: menuButtonInfo.top,
      searchBoxWidth: searchBoxWidth - 8
    });
  },
  
  // 返回功能
  onBack() {
    console.log('返回按钮被点击');
    
    // 直接跳转到首页
    wx.navigateTo({
      url: '/pages/home/index'
    });
  },
  
  // 搜索框点击事件
  onSearchClick() {
    // 跳转到搜索输入页面
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    });
  },
  
  // 图片点击事件
  onImageClick(e) {
    const url = e.currentTarget.dataset.url;
    console.log('点击了图片，跳转路径:', url);
    
    // 直接使用传入的路径进行跳转
    wx.navigateTo({
      url: url,
      success: function(res) {
        console.log('跳转成功:', res);
      },
      fail: function(err) {
        console.log('跳转失败:', err);
        // 跳转失败时显示提示
        wx.showToast({
          title: '页面暂未开放',
          icon: 'none'
        });
      }
    });
  }
})