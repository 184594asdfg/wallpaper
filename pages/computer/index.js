// computer.js
const { request } = require('../../config/request');
const { API_ENDPOINTS } = require('../../config/api');
const cdn = require('../../utils/cdn');

Page({
  data: {
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0,
    // 内容区域相关值
    contentTop: 0,
    // 当前选中的分类信息
    currentCategory: {
      name: '最新上传', // 当前选中的分类名称
      value: 'latest'   // 当前选中的分类value值
    },
    // 类型相关值
    currentType: 'latest',
    types: [],
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
    this.calculateTypeSectionPosition(); // 计算类型区域位置
    
    // 绑定页面滚动事件
    this.bindPageScroll();
    
    // 先加载分类数据，然后加载壁纸数据
    this.loadCategories().then(() => {
      // 分类数据加载完成后，再加载壁纸数据
      this.loadWallpapers();
    });
  },
  
  // 绑定页面滚动事件
  bindPageScroll() {

  },
  
  // 加载分类数据
  loadCategories() {
    return new Promise((resolve, reject) => {
      // 调用分类接口
      request({
        url: API_ENDPOINTS.categories,
        data: {
          module_type: 1002 // 电脑壁纸查询固定值1002
        }
      }).then((response) => {
        console.log('电脑壁纸分类接口返回数据:', response);
        // 成功获取分类数据
        if (response.list ) {
          // 处理接口返回的数据结构
          const firstCategory = response.list[0];
          
          // 更新当前选中的分类信息
          this.setData({
            currentCategory: {
              name: firstCategory.name,
              value: firstCategory.value
            }
          });
          
          const types = response.list.map((item, index) => ({
            id: item.id,
            name: item.name,
            value: item.value,
            active: index === 0 // 默认第一个分类为选中状态
          }));
          
          console.log('处理后的分类数据:', types);
          this.setData({
            types: types
          });
          resolve(types);
        } else {
          // 接口返回数据异常，保持空数组
          console.warn('分类接口返回数据异常');
          this.setData({
            types: []
          });
          resolve([]);
        }
      }).catch((err) => {
        console.error('加载分类数据失败:', err);
        // 接口调用失败，保持空数组
        this.setData({
          types: []
        });
        reject(err);
      });
    });
  },
  
  // 页面滚动到底部事件
  onReachBottom() {
    // 防止重复触发
    if (this.data.loading || this.data.page >= this.data.totalPages) {
      return;
    }
    
    // 加载更多数据
    this.loadWallpapers(true);
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
      }
    }).then((data) => {
      // 成功获取数据
      // 处理接口返回的数据结构
      if (data && data.list) {
        // 为每个壁纸添加完整的图片URL
        const wallpapersWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.wallpaper_id, // 适配数据结构，将wallpaper_id映射为id
          // 使用CDN地址和正确的文件夹路径
          image: cdn.getPcWallpaperUrl(item.filename)
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
  },

  // 预览壁纸
  previewWallpaper(e) {
    const wallpaper = e.currentTarget.dataset.wallpaper;
    // 跳转到预览页面（电脑壁纸使用16:9比例）
    wx.navigateTo({
      url: `/pages/preview/index?wallpaperData=${encodeURIComponent(JSON.stringify(wallpaper))}&aspectRatio=16:9&showTimeDate=true`
    });
  }
})