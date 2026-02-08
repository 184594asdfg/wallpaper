// avatar.js
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
      { id: 'latest', name: '最新上传' },
      { id: 'daily', name: '一天最热' },
      { id: 'weekly', name: '一周排行' },
      { id: 'monthly', name: '人气月榜' }
    ],
    // 头像数据
    avatars: [],
    // 分页相关值
    page: 1,
    limit: 5,
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
    this.loadAvatars(); // 加载头像数据
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
    this.loadAvatars(true);
  },
  
  // 加载头像数据
  loadAvatars(isLoadMore = false) {
    // 防止重复加载
    if (this.data.loading) return;
    
    // 设置加载状态
    this.setData({ loading: true });
    
    // 调用头像接口
    request({
      url: '/wallpaper/avatar',
      data: {
        page: isLoadMore ? this.data.page + 1 : 1,
        limit: this.data.limit
      }
    }).then((data) => {
      // 成功获取数据
      if (data && data.list) {
        // 为每个头像添加完整的图片URL
        const avatarsWithImageUrl = data.list.map(item => ({
          ...item,
          id: item.avatar_id,
          image: cdn.getAvatarUrl(item.filename)
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
    
    // 更新当前选中的类型
    this.setData({
      currentType: type
    });
    
    // 这里可以根据类型加载不同的数据
    // 目前只实现选中状态的切换
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
    this.calculatePreviewNavPosition(); // 重新计算预览页面导航栏位置
    this.setData({
      showPreview: true,
      currentPreviewAvatar: avatar
    });
  },
  
  // 关闭预览
  onClosePreview() {
    this.setData({
      showPreview: false,
      currentPreviewAvatar: null
    });
  },
  
  // 下载头像
  downloadAvatar() {
    if (this.data.currentPreviewAvatar) {
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
  
  // 页面卸载时执行
  onUnload() {
    // 清除时间更新定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
})