// moments.js
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
      name: '推荐', // 当前选中的分类名称
      value: '0'    // 当前选中的分类value值
    },
    // 类型相关值
    currentType: 'latest',
    types: [],
    // 头像数据
    avatars: [],
    // 分页相关值
    page: 1,
    limit: 15,
    totalPages: 1,
    loading: false,
    // 预览状态
    showPreview: false,
    currentPreviewAvatar: null,
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
    this.updateDateTime(); // 更新时间和日期
    // 每秒更新一次时间
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
    
    // 绑定页面滚动事件
    this.bindPageScroll();
    
    // 先加载分类数据，然后加载头像数据
    this.loadCategories().then(() => {
      // 分类数据加载完成后，再加载头像数据
      this.loadAvatars();
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
    this.loadAvatars(true);
  },
  
  // 加载分类数据
  loadCategories() {
    return new Promise((resolve, reject) => {
      // 调用分类接口
      request({
        url: API_ENDPOINTS.categories,
        data: {
          module_type: 1006 // 朋友圈背景查询固定值1006
        }
      }).then((response) => {
        console.log('朋友圈背景分类接口返回数据:', response);
        // 成功获取分类数据
        if (response.list) {
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
  
  // 加载头像数据
  loadAvatars(isLoadMore = false, type = null) {
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
    
    // 如果传入了type参数，添加到请求数据中
    if (type !== null) {
      requestData.type = type;
    }
    
    // 调用头像接口
    request({
      url: '/wallpaper/moments',
      data: requestData
    }).then((data) => {
      // 成功获取数据
      if (data && data.list) {
        // 为每个头像添加完整的图片URL
        const avatarsWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.avatar_id,
          image: cdn.getMomentsBackgroundUrl(item.filename)
        }));
        
        // 根据是否加载更多来决定是替换还是追加数据
        const newAvatars = isLoadMore ? [...this.data.avatars, ...avatarsWithImageUrl] : avatarsWithImageUrl;
        
        this.setData({
          avatars: newAvatars,
          page: isLoadMore ? this.data.page + 1 : 1,
          totalPages: data.totalPages || 1,
          loading: false
        });
      } else {
        // 接口返回数据异常，设置空数组
        this.setData({ 
          avatars: [],
          loading: false 
        });
      }
    }).catch((err) => {
      console.error('加载头像失败:', err);
      // 接口调用失败，设置空数组
      this.setData({ 
        avatars: [],
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
    
    // 重置分页数据并重新加载头像数据
    this.setData({
      page: 1,
      avatars: []
    });
    
    // 重新调用接口，传入type参数
    this.loadAvatars(false, selectedType.value);
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
  
  // 预览头像
  previewAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar;
    // 跳转到预览页面
    wx.navigateTo({
      url: `/pages/preview/index?wallpaperData=${encodeURIComponent(JSON.stringify(avatar))}&aspectRatio=1:1&showTimeDate=true`
    });
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