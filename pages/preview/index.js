// preview.js
Page({
  data: {
    // 壁纸数据
    wallpaperData: null,
    // 显示比例 'auto' | '1:1' | '16:9'
    aspectRatio: 'auto',
    // 是否显示时间日期
    showTimeDate: false,
    // 当前时间
    currentTime: '',
    // 当前日期
    currentDate: '',
    // 胶囊按钮位置
    menuButtonTop: 0,
    menuButtonHeight: 0
  },

  onLoad(options) {
    // 计算胶囊按钮位置
    this.calculateMenuButtonPosition();
    
    // 从页面参数中获取数据
    if (options.wallpaperData) {
      const wallpaperData = JSON.parse(decodeURIComponent(options.wallpaperData));
      const aspectRatio = options.aspectRatio || 'auto';
      const showTimeDate = options.showTimeDate === 'true';
      
      this.setData({
        wallpaperData: wallpaperData,
        aspectRatio: aspectRatio,
        showTimeDate: showTimeDate
      });
    }

    // 更新时间日期
    this.updateTimeDate();
    // 设置定时器每秒更新时间
    this.timeInterval = setInterval(() => {
      this.updateTimeDate();
    }, 1000);
  },

  // 计算胶囊按钮位置
  calculateMenuButtonPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    this.setData({
      menuButtonTop: menuButtonInfo.top,
      menuButtonHeight: menuButtonInfo.height
    });
  },

  onUnload() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  // 更新时间日期
  updateTimeDate() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const date = now.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    this.setData({
      currentTime: time,
      currentDate: date
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 下载壁纸
  downloadWallpaper() {
    if (!this.data.wallpaperData) {
      wx.showToast({
        title: '壁纸数据不存在',
        icon: 'none'
      });
      return;
    }

    const { image, id } = this.data.wallpaperData;
    
    wx.showLoading({
      title: '下载中...'
    });

    // 下载图片到本地
    wx.downloadFile({
      url: image,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存图片到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '下载成功',
                icon: 'success'
              });
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '下载失败',
                icon: 'none'
              });
              console.error('保存图片失败:', err);
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
        console.error('下载文件失败:', err);
      }
    });
  }
})