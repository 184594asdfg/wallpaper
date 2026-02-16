// home.js
const { request } = require('../../config/request');
const { API_ENDPOINTS } = require('../../config/api');
const cdn = require('../../utils/cdn');

Page({
  data: {
    // 当前选中的分类信息
    currentCategory: {
      name: '推荐', // 当前选中的分类名称
      value: 0,     // 当前选中的分类value值
      id: 1         // 素材类型ID
    },
    // 分类数据
    categories: [],
    // 轮播图数据
    carouselList: [
      { 
        id: 1, 
        image: '../../images/banner/banner_01.jpg',
        link: '/pages/phone/index'
      },
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
    // 分类区域相关值
    categoryStickyTop: 0,
    // 搜索框相关值
    searchBoxWidth: 0,
    // 时间和日期
    currentTime: '',
    currentDate: '',
    // 分页相关值
    page: 1,
    limit: 9,
    totalPages: 1,
    loading: false
  },
  
  onLoad() {
    // 页面加载时执行
    this.calculateNavBarPosition(); // 计算导航栏位置和高度
    this.calculateCategoryPosition(); // 计算分类区域位置
    this.calculatePreviewNavPosition(); // 计算预览页面导航栏位置
    this.updateDateTime(); // 更新时间和日期
    // 每秒更新一次时间
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
    
    // 绑定页面滚动事件
    this.bindPageScroll();
    
    // 先加载分类数据，然后加载壁纸数据
    this.loadCategories().then(() => {
      // 分类数据加载完成后，再加载壁纸数据
      this.loadWallpapers(0);
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
    // 计算分类区域粘性定位高度（导航栏高度 + 导航栏顶部距离）
    const categoryStickyTop = (menuButtonInfo.height) + menuButtonInfo.top;
    
    // 设置导航栏高度、顶部距离、搜索框宽度和分类区域粘性定位高度
    this.setData({
      navBarHeight: menuButtonInfo.height + 8,
      navBarTop: menuButtonInfo.top,
      searchBoxWidth: searchBoxWidth - 8,
      categoryStickyTop: categoryStickyTop
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
    // 设置预览页面导航栏高度、顶部距离
    this.setData({
      previewNavHeight: menuButtonInfo.height + 8,
      previewNavTop: menuButtonInfo.top
    });
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
    this.loadWallpapers(this.data.currentCategory, true);
  },
  
  // 计算分类区域位置
  calculateCategoryPosition() {
    // 获取胶囊按钮位置
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 计算分类区域顶部距离
    const categoryTop = menuButtonInfo.bottom+10; // 胶囊按钮底部再加20px间距
    this.setData({
      categoryTop: categoryTop
    });
  },
  
  // 加载分类数据
  loadCategories() {
    return new Promise((resolve, reject) => {
      // 调用分类接口
      request({
        url: API_ENDPOINTS.categories,
        data: {
          module_type: 1001 // 首页查询固定值1001
        }
      }).then((response) => {
        console.log('分类接口返回数据:', response);
        // 成功获取分类数据
        if (response.list && response.list.length > 0) {
          // 处理接口返回的数据结构
          const firstCategory = response.list[0];
          
          // 更新当前选中的分类信息
          this.setData({
            currentCategory: {
              name: firstCategory.name,
              value: firstCategory.value,
              id: firstCategory.id
            }
          });

          const categories = response.list.map((item, index) => ({
            id: item.id,
            name: item.name,
            value: item.value,
            active: index === 0 // 默认第一个分类为选中状态
          }));
          
          console.log('处理后的分类数据:', categories);
          this.setData({
            categories: categories
          });
          resolve(categories);
        } else {
          // 接口返回数据异常，保持空数组
          console.warn('分类接口返回数据异常');
          this.setData({
            categories: []
          });
          resolve([]);
        }
      }).catch((err) => {
        console.error('加载分类数据失败:', err);
        // 接口调用失败，保持空数组
        this.setData({
          categories: []
        });
        reject(err);
      });
    });
  },
  
  // 加载壁纸数据
  loadWallpapers(category, isLoadMore = false) {
    // 防止重复加载
    if (this.data.loading) return;
    
    // 设置加载状态
    this.setData({ loading: true });
    
    // 构建请求参数
    const requestData = {
      page: isLoadMore ? this.data.page + 1 : 1,
      limit: this.data.limit
    };
    
    // 如果当前有选中的分类，添加tags参数
    if (this.data.currentCategory && this.data.currentCategory.name) {
      requestData.tags = this.data.currentCategory.name;
    }
    
    // 调用壁纸接口
    request({
      url: '/wallpaper/mobile',
      data: requestData
    }).then((data) => {
      // 成功获取数据
      // 处理接口返回的数据结构
      if (data && data.list) {
        // 为每个壁纸添加完整的图片URL
        const wallpapersWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.wallpaper_id,
          image: cdn.getPhoneWallpaperUrl(item.filename)
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
        // 接口返回数据异常，设置空数组
        this.setData({ 
          wallpapers: [],
          loading: false 
        });
      }
    }).catch((err) => {
      console.error('加载壁纸失败:', err);
      // 接口调用失败，设置空数组
      this.setData({ 
        wallpapers: [],
        loading: false 
      });
    });
  },
  
  // 分类点击事件
  onCategoryClick(e) {
    const categoryValue = e.currentTarget.dataset.category;
    
    // 查找对应的分类信息
    const selectedCategory = this.data.categories.find(cat => cat.value === categoryValue);
    
    if (selectedCategory) {
      // 更新当前选中的分类信息
      this.setData({
        currentCategory: {
          name: selectedCategory.name,
          value: selectedCategory.value,
          id: selectedCategory.id
        }
      });
    }
    
    // 更新分类状态
    const updatedCategories = this.data.categories.map(cat => ({
      ...cat,
      active: cat.value === categoryValue
    }));
    
    this.setData({
      categories: updatedCategories
    });
    
    // 加载对应分类的壁纸
    this.loadWallpapers(categoryValue);
  },
  
  // 预览壁纸
  previewWallpaper(e) {
    const wallpaper = e.currentTarget.dataset.wallpaper;
    // 跳转到预览页面
    wx.navigateTo({
      url: `/pages/preview/index?wallpaperData=${encodeURIComponent(JSON.stringify(wallpaper))}&aspectRatio=auto&showTimeDate=true`
    });
  },
  
  // 底部导航栏切换
  onNavChange(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    // 导航切换逻辑
    if (index === 0) {
      // 已经在首页，不需要跳转
    } else if (index === 1) {
      // 跳转到搜索页面
      console.log('准备跳转到搜索页面');
      wx.redirectTo({
        url: '/pages/search/index',
        success: function(res) {
          console.log('导航跳转成功:', res);
        },
        fail: function(err) {
          console.log('导航跳转失败:', err);
        }
      });
    } else if (index === 2) {
      // 跳转到我的页面
      console.log('准备跳转到我的页面');
      wx.redirectTo({
        url: '/pages/mine/index',
        success: function(res) {
          console.log('导航跳转成功:', res);
        },
        fail: function(err) {
          console.log('导航跳转失败:', err);
        }
      });
    }
  },
  
  // 下载壁纸
  downloadWallpaper(e) {
    const wallpaper = e.detail.wallpaper || this.data.currentPreviewWallpaper;
    if (wallpaper) {
      // 显示下载中提示
      wx.showLoading({
        title: '下载中...',
        mask: true
      });
      
      // 下载图片到本地
      wx.downloadFile({
        url: wallpaper.image,
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
  
  // 分享功能
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // 搜索框点击事件
  onSearchClick() {
    console.log('搜索框被点击');
    // 跳转到搜索页面
    wx.redirectTo({
      url: '/pages/search/index',
      success: function(res) {
        console.log('跳转成功:', res);
      },
      fail: function(err) {
        console.log('跳转失败:', err);
      }
    });
  },
  
  // 轮播图点击事件
  onCarouselClick(e) {
    const link = e.currentTarget.dataset.link;
    
    if (link) {
      wx.navigateTo({
        url: link
      });
    }
  },
  
  // 功能区域点击事件
  onFeatureClick(e) {
    const type = e.currentTarget.dataset.type;
    
    // 根据功能类型进行不同的跳转
    if (type === 'chat') {
      // 跳转到聊天背景页面
      wx.navigateTo({
        url: '/pages/chat/index',
        success: function(res) {
          console.log('跳转到聊天背景页面成功:', res);
        },
        fail: function(err) {
          console.log('跳转到聊天背景页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    } else if (type === 'avatar') {
      // 跳转到头像页面
      wx.navigateTo({
        url: '/pages/avatar/index',
        success: function(res) {
          console.log('跳转到头像页面成功:', res);
        },
        fail: function(err) {
          console.log('跳转到头像页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    } else if (type === 'emoji') {
      // 跳转到表情页面
      wx.navigateTo({
        url: '/pages/emoji/index',
        success: function(res) {
          console.log('跳转到表情页面成功:', res);
        },
        fail: function(err) {
          console.log('跳转到表情页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    } else if (type === 'moments') {
      // 跳转到朋友圈背景页面
      wx.navigateTo({
        url: '/pages/moments/index',
        success: function(res) {
          console.log('跳转到朋友圈背景页面成功:', res);
        },
        fail: function(err) {
          console.log('跳转到朋友圈背景页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 其他功能暂时显示提示
      wx.showToast({
        title: `点击了${type}`,
        icon: 'none'
      });
    }
  },
  
  // 页面卸载时执行
  onUnload() {
    // 清除时间更新定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
})