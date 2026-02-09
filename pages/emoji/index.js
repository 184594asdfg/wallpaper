// emoji.js
const { request } = require('../../config/request');
const cdn = require('../../utils/cdn');

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
      { id: 0, name: '精选', value: '0' , active: true},
      { id: 1, name: '最新', value: '1' , active: false},
      { id: 2, name: '下载最多', value: '2' , active: false}
    ],
    // 表情数据
    emojis: [],
    // 分页相关值
    page: 1,
    limit: 15,
    totalPages: 1,
    loading: false,
    // 预览状态
    showPreview: false,
    currentPreviewEmoji: null,
    // 预览页面导航栏位置
    previewNavTop: 0,
    // 时间和日期
    currentTime: '',
    currentDate: ''
  },
  
  onLoad() {
    // 页面加载时执行
    this.calculateNavBarPosition(); // 计算导航栏位置和高度
    this.calculateContentPosition(); // 计算内容区域位置
    this.calculateTypeSectionPosition(); // 计算类型区域位置
    this.loadEmojis(); // 加载表情数据
    this.updateDateTime(); // 更新时间和日期
    // 每秒更新一次时间
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
    
    // 绑定页面滚动事件
    this.bindPageScroll();
  },
  
  // 绑定页面滚动事件
  bindPageScroll() {

  },
 
  
  // 页面滚动到底部事件
  onReachBottom() {
    // 防止重复触发
    if (this.data.loading || this.data.page >= this.data.totalPages) {
      return;
    }
    
    // 加载更多数据
    this.loadEmojis(true);
  },
  
  // 加载表情数据
  loadEmojis(isLoadMore = false, type = null) {
    // 防止重复加载
    if (this.data.loading) return;
    
    // 设置加载状态
    this.setData({ loading: true });
    
    // 构建请求参数
    const requestData = {
      page: isLoadMore ? this.data.page + 1 : 1,
      limit: this.data.limit
    };
    
    // 如果传入了type参数，添加到请求数据中
    if (type !== null) {
      requestData.type = type;
    }
    
    // 调用表情接口
    request({
      url: '/wallpaper/emoji',
      data: requestData
    }).then((data) => {
      // 成功获取数据
      if (data && data.list) {
        // 为每个表情添加完整的图片URL
        const emojisWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.emoji_id,
          image: cdn.getEmojiUrl(item.filename)
        }));
        
        // 根据是否加载更多来决定是替换还是追加数据
        const newEmojis = isLoadMore ? [...this.data.emojis, ...emojisWithImageUrl] : emojisWithImageUrl;
        
        this.setData({
          emojis: newEmojis,
          page: isLoadMore ? this.data.page + 1 : 1,
          totalPages: data.totalPages || 1,
          loading: false
        });
      } else {
        // 接口返回数据异常，设置空数组
        this.setData({ 
          emojis: [],
          loading: false 
        });
      }
    }).catch((err) => {
      console.error('加载表情失败:', err);
      // 接口调用失败，设置空数组
      this.setData({ 
        emojis: [],
        loading: false 
      });
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
    const contentTop = menuButtonInfo.bottom;
    // 设置内容区域顶部距离
    this.setData({
      contentTop: contentTop
    });
  },
  
  // 计算类型区域顶部距离
  calculateTypeSectionPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 类型区域顶部距离 = 导航栏底部位置（胶囊按钮底部）
    const typeSectionTop = menuButtonInfo.bottom;
    // 设置类型区域顶部距离
    this.setData({
      typeSectionTop: typeSectionTop
    });
  },
  
  // 类型标签点击事件
  onTypeClick(e) {
    // 获取点击的类型
    const type = e.currentTarget.dataset.type;
    console.log('点击了类型:', type);
    
    // 获取对应的value值
    const selectedType = this.data.types.find(item => item.id === type);
    if (!selectedType) return;
    
    // 更新types数组中的active状态
    const updatedTypes = this.data.types.map(item => ({
      ...item,
      active: item.id === type
    }));
    
    // 更新当前选中的类型和types数组
    this.setData({
      currentType: type,
      types: updatedTypes
    });
    
    // 重置分页数据并重新加载表情数据
    this.setData({
      page: 1,
      emojis: []
    });
    
    // 重新调用接口，传入type参数
    this.loadEmojis(false, selectedType.value);
  },
  
  // 返回按钮点击事件
  onBack() {
    // 获取当前页面栈
    const pages = getCurrentPages();
    
    if (pages.length > 1) {
      // 有上一个页面，正常返回
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 没有上一个页面，跳转到首页
      wx.redirectTo({
        url: '/pages/home/index'
      });
    }
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
    // 设置预览页面导航栏高度、顶部距离
    this.setData({
      previewNavHeight: menuButtonInfo.height + 8,
      previewNavTop: menuButtonInfo.top
    });
  },
  
  // 预览表情
  previewEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    this.calculatePreviewNavPosition(); // 重新计算预览页面导航栏位置
    this.setData({
      showPreview: true,
      currentPreviewEmoji: emoji
    });
  },
  
  // 关闭预览
  onClosePreview() {
    this.setData({
      showPreview: false,
      currentPreviewEmoji: null
    });
  },
  
  // 下载表情
  downloadEmoji(e) {
    const emoji = e.detail.wallpaper || this.data.currentPreviewEmoji;
    if (emoji) {
      // 显示下载中提示
      wx.showLoading({
        title: '下载中...',
        mask: true
      });
      
      // 下载图片到本地
      wx.downloadFile({
        url: emoji.image,
        success: (res) => {
          if (res.statusCode === 200) {
            // 保存图片到相册
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.hideLoading();
                wx.showToast({
                  title: '下载成功',
                  icon: 'success',
                  duration: 2000
                });
              },
              fail: (err) => {
                wx.hideLoading();
                console.error('保存到相册失败:', err);
                wx.showToast({
                  title: '保存失败，请检查权限',
                  icon: 'none',
                  duration: 3000
                });
              }
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('下载失败:', err);
          wx.showToast({
            title: '下载失败，请重试',
            icon: 'none',
            duration: 3000
          });
        }
      });
    }
  },
  
  // 阻止触摸移动
  preventTouchMove() {
    // 阻止触摸移动，防止模态框滑动
  },
  
  // 页面卸载时执行
  onUnload() {
    // 清除时间更新定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
})