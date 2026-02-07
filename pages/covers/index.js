// pages/covers/index.js
// 引入请求库和API配置
const request = require('../../utils/request.js');
const apiConfig = require('../../config/api.js');
const domainConfig = require('../../config/domain.js');
const imageUtils = require('../../utils/imageUtils.js');
const { createPageAdWrapper } = require('../../utils/pageAdWrapper.js');
const appState = require('../../compositions/app-state.js');
const ApiService = require('../../services/apiService.js');

Page({
  data: {
    searchKeyword: '',
    searchFocused: false,
    categories: [], // 从接口获取分类数据
    filters: [],
    coverList: [],
    hasMore: true,
    showPreview: false,
    previewCover: null,
    currentPage: 1,
    pageSize: 7,
    isLoading: false,
    // 状态栏高度
    statusBarHeight: 44, // 默认值，单位rpx
    // Tab导航栏数据
    navigationTabs: [
      { id: 'latest', name: '最新', active: true },
      { id: 'hot', name: '热门', active: false },
      { id: 'recommend', name: '推荐', active: false },
      { id: 'free', name: '免费', active: false },
      { id: 'premium', name: '精品', active: false },
      { id: 'trending', name: '趋势', active: false }
    ],
    // 今日下载次数
    todayDownloadCount: 0,
    // 最大下载次数（免费1次，看广告后2次）
    maxDownloadCount: 1,
    // 广告相关状态
    showAdModal: false, // 是否显示广告提示模态框
    // 待处理的下载事件
    pendingDownloadEvent: null,
    // 壁纸预览相关状态
    showWallpaperPreview: false,
    currentPreviewWallpaper: '',
    currentPreviewTag: '',
    // 预览页面时间日期
    currentTime: '',
    currentDate: '',
    // 滑动预览相关状态
    currentPreviewIndex: 0, // 当前预览图片索引
    previewCoverList: [], // 预览图片列表
    previewHasMore: true, // 预览界面是否还有更多数据
    previewIsLoading: false, // 预览界面加载状态
    previewCurrentPage: 1, // 预览界面当前页码
    previewPageSize: 6 // 预览界面每页加载数量
  },

  // 重置搜索
  onResetSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.loadCovers(true);
  },

  async onLoad(options) {
    console.log('封面素材库页面加载', options);
    
    // 获取状态栏高度，适配刘海屏
    this.getStatusBarHeight();
    
    // 初始化API服务（直接使用导入的单例实例）
    this.apiService = ApiService;
    
    // 初始化今日下载次数显示
    this.updateTodayDownloadCount();
    
    // 初始化广告包装器
    this.adWrapper = createPageAdWrapper('pages/covers/index', 'adunit-a9199b9086413800');
    
    // 预加载广告
    this.adWrapper.preload().catch(err => {
      console.log('广告预加载失败，不影响正常使用:', err);
    });
    
    // 先加载分类类型数据，然后加载封面数据
    try {
      await this.loadCategoryTypes();
      // 分类数据加载完成后，再加载封面数据
      this.loadCovers();
    } catch (error) {
      console.error('页面初始化失败:', error);
      // 即使分类加载失败，也尝试加载封面数据
      this.loadCovers();
    }
  },

  // 加载分类类型数据
  async loadCategoryTypes() {
    try {
      console.log('开始加载分类类型数据...');
      
      // 调用API获取分类类型数据，module_type=0表示封面素材
      const response = await this.apiService.getCategoryTypes(0);
      
      console.log('分类类型接口返回数据:', response);
      
      // 根据提供的接口数据结构处理
      let categoryList = [];
      
      if (response.data && response.data.data && response.data.data.list) {
        // 结构: response.data.data.list
        categoryList = response.data.data.list;
      } else if (response.data && response.data.list) {
        // 结构: response.data.list
        categoryList = response.data.list;
      } else if (response.data) {
        // 结构: response.data
        categoryList = Array.isArray(response.data) ? response.data : [response.data];
      } else {
        // 结构: response本身
        categoryList = Array.isArray(response) ? response : [response];
      }
      
      console.log('提取的分类数据列表:', categoryList);
      
      // 将接口数据转换为页面需要的格式
      const categories = categoryList.map((item, index) => ({
        id: item.id || index + 1,
        name: item.name || '未知分类',
        value: parseInt(item.value) || index, // 使用接口返回的value字段，确保是整数
        active: index === 0 // 默认第一个分类为选中状态
      }));
      
      console.log('处理后的分类数据:', categories);
      
      // 更新页面数据
      this.setData({
        categories: categories
      });
      
      console.log('分类类型数据加载完成');
      
    } catch (error) {
      console.error('加载分类类型数据失败:', error);
      
      // 如果接口调用失败，使用默认分类数据
      const defaultCategories = [
        { id: 1, name: '书籍封面', value: 0, active: true },
        { id: 2, name: 'AI背景图', value: 1, active: false },
        { id: 3, name: '视频封面', value: 2, active: false }
      ];
      
      this.setData({
        categories: defaultCategories
      });
      
      console.log('使用默认分类数据');
    }
  },

  onUnload() {
    // 页面卸载时销毁广告
    if (this.adWrapper) {
      this.adWrapper.destroy();
    }
  },

  onReady() {
    // 页面渲染完成后，初始化滚动监听
    this.initScrollListener();
  },

  // 初始化滚动监听
  initScrollListener() {
    // 使用页面滚动监听
    this._lastScrollTime = 0;
    this._isLoadingMore = false; // 防止重复加载
  },

  // 页面滚动事件处理
  onPageScroll(e) {
    // 防抖处理，避免频繁触发
    const now = Date.now();
    if (now - this._lastScrollTime < 300) {
      return;
    }
    this._lastScrollTime = now;

    // 获取页面滚动位置
    const scrollTop = e.scrollTop;
    // 获取页面高度
    const windowHeight = wx.getSystemInfoSync().windowHeight;
    
    // 获取整个页面的高度
    wx.createSelectorQuery().select('.container').boundingClientRect((rect) => {
      if (rect) {
        const documentHeight = rect.height;
        // 判断是否滚动到底部（距离底部200px以内）
        if (scrollTop + windowHeight >= documentHeight - 200) {
          // 防止重复触发
          if (!this.data.isLoading && this.data.hasMore && !this._isLoadingMore) {
            this._isLoadingMore = true;
            this.loadMoreCovers();
          }
        }
      }
    }).exec();
  },

  // 加载更多封面数据
  loadMoreCovers() {
    if (this.data.isLoading || !this.data.hasMore) {
      this._isLoadingMore = false;
      return;
    }
    
    // 调用加载更多函数，确保页码递增
    this.loadMore();
  },

  // 搜索输入事件
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索框获得焦点
  onSearchFocus(e) {
    this.setData({
      searchFocused: true
    });
  },

  // 搜索框失去焦点
  onSearchBlur(e) {
    this.setData({
      searchFocused: false
    });
  },

  // 执行搜索
  onSearch() {
    const { searchKeyword } = this.data;
    console.log('执行搜索，关键词:', searchKeyword);
    
    if (searchKeyword && searchKeyword.trim()) {
      this.loadCovers(true);
    } else {
      // 如果搜索关键词为空，显示所有数据
      this.setData({
        searchKeyword: ''
      });
      this.loadCovers(true);
    }
  },

  // 分类点击
  onCategoryClick(e) {
    const categoryValue = e.currentTarget.dataset.category;
    const categories = this.data.categories.map(category => ({
      ...category,
      active: category.value === categoryValue
    }));

    this.setData({ categories });
    this.loadCovers(true);
  },

  // 筛选点击
  onFilterClick(e) {
    const filterValue = e.currentTarget.dataset.filter;
    const filters = this.data.filters.map(filter => ({
      ...filter,
      active: filter.value === filterValue
    }));

    this.setData({ filters });
    this.loadCovers(true);
  },



  // 生成图片URL
  generateImageUrl(fileName) {
    if (!fileName) return '';
    
    // 使用统一的域名配置生成URL
    const imageUrl = domainConfig.generateCoverUrl(fileName);
    console.log('生成的图片URL:', imageUrl);
    return imageUrl;
  },






  // 加载封面数据
  async loadCovers(reset = false) {
    if (this.data.isLoading) return;
    
    this.setData({
      isLoading: true
    });

    const { currentPage, pageSize, searchKeyword } = this.data;
    const page = reset ? 1 : currentPage;
    
    // 获取当前选中的分类
    const selectedCategory = this.data.categories.find(cat => cat.active)?.value || 0;
    
    // 构建请求参数
    const params = {
      page: page,
      limit: pageSize
    };
    
    // 传递分类value参数到后端API
    params.type = selectedCategory;
    
    // 传递搜索参数到后端API
    if (searchKeyword && searchKeyword.trim()) {
      params.search = searchKeyword.trim();
    }
    
    // 传递openid参数到后端API（必须传递，即使为空）
    params.openid = appState.user.openid;  // 使用appstate获取openid

    try {
      // 使用统一的请求库调用API
      const response = await request.get('/cover-materials', params, {
        showLoading: false, // 手动控制loading
        showErrorToast: false // 手动处理错误
      });
      
      // 打印接口返回的完整数据结构，用于调试
      console.log('接口返回的完整数据结构:', response);
      
      // 根据实际接口返回的数据结构调整
      let responseData = null;
      
      // 检查不同的数据结构可能性
      if (response.data && response.data.data) {
        // 结构1: response.data.data
        responseData = response.data.data;
      } else if (response.data) {
        // 结构2: response.data
        responseData = response.data;
      } else {
        // 结构3: response本身
        responseData = response;
      }
      
      console.log('提取的数据:', responseData);
      
      if (response.statusCode === 200) {
        // 直接使用接口返回的数据，不进行复杂的包装检查
        let newCovers = [];
        
        // 如果responseData是数组，直接使用
        if (Array.isArray(responseData)) {
          newCovers = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // 如果是对象，检查是否有数据字段
          if (responseData.data && Array.isArray(responseData.data)) {
            newCovers = responseData.data;
          } else if (responseData.list && Array.isArray(responseData.list)) {
            newCovers = responseData.list;
          } else {
            // 如果是单个对象，包装成数组
            newCovers = [responseData];
          }
        }
        
        console.log('处理后的封面数据:', newCovers);
        
        // 如果后端API没有处理搜索，在前端进行搜索过滤
        if (searchKeyword && searchKeyword.trim()) {
          const keyword = searchKeyword.toLowerCase().trim();
          newCovers = newCovers.filter(cover => 
            cover.title && cover.title.toLowerCase().includes(keyword) ||
            (cover.author && cover.author.toLowerCase().includes(keyword))
          );
        }
        
        // 处理图片URL，直接使用接口返回的图片数据
        const processedCovers = newCovers.map(cover => ({
          ...cover,
          image: cover.file_name ? this.generateImageUrl(cover.file_name) : '',
          author: cover.author || '未知作者'
        }));
        
        // 检查是否搜索无结果，如果是则弹出联网搜索确认框
        if (searchKeyword && searchKeyword.trim() && processedCovers.length === 0) {
          this.showNetworkSearchConfirm(searchKeyword);
        }
        
        if (reset) {
          this.setData({
            coverList: processedCovers,
            currentPage: 1,
            hasMore: processedCovers.length >= this.data.pageSize
          });
        } else {
          this.setData({
            coverList: [...this.data.coverList, ...processedCovers],
            currentPage: page,
            hasMore: processedCovers.length >= this.data.pageSize
          });
        }
      } else {
        // API调用失败时显示空数据，不使用默认数据
        console.log('API调用失败，显示空数据');
        
        if (reset) {
          this.setData({
            coverList: [],
            currentPage: 1,
            hasMore: false
          });
        } else {
          this.setData({
            currentPage: page,
            hasMore: false
          });
        }
      }
    } catch (error) {
      // 网络错误时显示空数据，不使用默认数据
      console.log('网络请求失败，显示空数据');
      
      if (reset) {
        this.setData({
          coverList: [],
          currentPage: 1,
          hasMore: false
        });
      } else {
        this.setData({
          currentPage: page,
          hasMore: false
        });
      }
      
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        isLoading: false
      });
      this._isLoadingMore = false; // 重置加载状态
      wx.hideLoading();
    }
  },



  // 获取基础用户信息
  getBasicUserInfo() {
    try {
      // 尝试从本地存储获取已有用户信息
      const storedInfo = wx.getStorageSync('userInfo');
      if (storedInfo) {
        return storedInfo;
      }
      
      // 如果没有存储信息，使用匿名信息
      return {
        nickName: '匿名用户',
        id: 'anonymous_' + Date.now().toString().slice(-6)
      };
      
    } catch (error) {
      return {
        nickName: '匿名用户', 
        id: 'unknown'
      };
    }
  },

  // 预览封面
  previewCover(e) {
    const cover = e.currentTarget.dataset.cover;
    const { coverList } = this.data;
    
    // 找到当前点击的封面在列表中的索引
    const currentIndex = coverList.findIndex(item => item.material_id === cover.material_id);
    
    // 更新时间日期
    this.updateTimeDate();
    this.setData({
      showPreview: true,
      previewCover: cover,
      currentPreviewIndex: currentIndex >= 0 ? currentIndex : 0,
      previewCoverList: coverList,
      previewHasMore: this.data.hasMore, // 继承主界面的加载状态
      previewCurrentPage: 1 // 重置预览界面页码
    });
    // 开始时间更新定时器
    this.startTimeUpdate();
  },

  // 关闭预览
  closePreview() {
    // 停止时间更新定时器
    this.stopTimeUpdate();
    this.setData({
      showPreview: false,
      previewCover: null,
      currentPreviewIndex: 0,
      previewCoverList: [],
      previewIsLoading: false,
      previewHasMore: true,
      previewCurrentPage: 1
    });
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/home/index'
    });
  },

  // 更新时间日期
  updateTimeDate() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
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

  // 开始时间更新定时器
  startTimeUpdate() {
    this.timeUpdateTimer = setInterval(() => {
      this.updateTimeDate();
    }, 60000); // 每分钟更新一次
  },

  // 停止时间更新定时器
  stopTimeUpdate() {
    if (this.timeUpdateTimer) {
      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = null;
    }
  },

  // 阻止触摸事件冒泡
  preventTouchMove() {
    // 空函数，用于阻止触摸事件的默认行为
    return false;
  },

  // 滑动切换事件处理
  onSwiperChange(e) {
    const { current } = e.detail;
    const { previewCoverList, previewHasMore, previewIsLoading } = this.data;
    
    if (previewCoverList && previewCoverList.length > 0 && current < previewCoverList.length) {
      this.setData({
        currentPreviewIndex: current,
        previewCover: previewCoverList[current]
      });
      
      // 检测是否需要加载更多数据
      if (previewHasMore && !previewIsLoading && current >= previewCoverList.length - 2) {
        this.loadMorePreviewCovers();
      }
    }
  },

  // 预览界面加载更多数据
  async loadMorePreviewCovers() {
    if (this.data.previewIsLoading || !this.data.previewHasMore) {
      return;
    }
    
    this.setData({
      previewIsLoading: true
    });
    
    try {
      const { previewCurrentPage, previewPageSize, searchKeyword } = this.data;
      const page = previewCurrentPage + 1;
      
      // 获取当前选中的分类
      const selectedCategory = this.data.categories.find(cat => cat.active)?.value || 0;
      
      // 构建请求参数
      const params = {
        page: page,
        limit: previewPageSize,
        type: selectedCategory
      };
      
      // 传递搜索参数
      if (searchKeyword && searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }
      
      // 传递openid参数
      params.openid = appState.user.openid;

      // 调用API获取更多数据
      const response = await request.get('/cover-materials', params, {
        showLoading: false,
        showErrorToast: false
      });
      
      let responseData = null;
      if (response.data && response.data.data) {
        responseData = response.data.data;
      } else if (response.data) {
        responseData = response.data;
      } else {
        responseData = response;
      }
      
      if (response.statusCode === 200) {
        let newCovers = [];
        
        if (Array.isArray(responseData)) {
          newCovers = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if (responseData.data && Array.isArray(responseData.data)) {
            newCovers = responseData.data;
          } else if (responseData.list && Array.isArray(responseData.list)) {
            newCovers = responseData.list;
          } else {
            newCovers = [responseData];
          }
        }
        
        // 处理图片URL
        const processedCovers = newCovers.map(cover => ({
          ...cover,
          image: cover.file_name ? this.generateImageUrl(cover.file_name) : '',
          author: cover.author || '未知作者'
        }));
        
        // 更新预览列表和状态
        this.setData({
          previewCoverList: [...this.data.previewCoverList, ...processedCovers],
          previewCurrentPage: page,
          previewHasMore: processedCovers.length >= this.data.previewPageSize,
          previewIsLoading: false
        });
        
        // 如果加载的数据少于预期数量，显示加载完成提示
        if (processedCovers.length < this.data.previewPageSize) {
          wx.showToast({
            title: '已加载全部封面',
            icon: 'success',
            duration: 1500
          });
        }
      } else {
        // API调用失败
        this.setData({
          previewHasMore: false,
          previewIsLoading: false
        });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      // 网络错误
      this.setData({
        previewHasMore: false,
        previewIsLoading: false
      });
      
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      });
    }
  },

  // 切换收藏状态
  async toggleFavorite(e) {
    // 使用appstate获取openid
    const openid = appState.user.openid;

    const item = e.currentTarget.dataset.item;
    const isFavorite = !item.isFavorite;
    
    // 更新UI状态
    const coverList = this.data.coverList.map(cover => 
      cover.material_id === item.material_id ? { ...cover, isFavorite } : cover
    );

    this.setData({ coverList });

    // 更新预览模态框中的收藏状态
    if (this.data.previewCover && this.data.previewCover.material_id === item.material_id) {
      this.setData({
        previewCover: { ...this.data.previewCover, isFavorite }
      });
    }

    try {
      // 调用后端收藏接口（传递openid）
      await this.callFavoriteApi(item, isFavorite, openid);
      
      // 保存到本地存储
      this.saveFavoriteToStorage(item, isFavorite);
      
      // 静默操作，不显示提示
    } catch (error) {
      // 如果接口调用失败，回滚UI状态
      const rollbackCoverList = this.data.coverList.map(cover => 
        cover.material_id === item.material_id ? { ...cover, isFavorite: !isFavorite } : cover
      );
      this.setData({ coverList: rollbackCoverList });
      
      // 静默失败，不显示提示
    }
  },

  // 调用收藏接口
  async callFavoriteApi(item, isFavorite, openid) {
    // 直接使用传入的openid，无需再次获取

    if (isFavorite) {
      // 添加收藏 - POST方法
      const apiUrl = '/covers/favorite';
      const requestData = {
        openid: openid,
        coverId: item.material_id,
        type: item.type || 0  // 默认为书籍封面
      };

      // 调用后端收藏接口
      const response = await request.post(apiUrl, requestData);
      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }
      
      console.log('调用添加收藏接口成功:', apiUrl, requestData);
      return response;
    } else {
      // 取消收藏 - DELETE方法
      const apiUrl = '/covers/favorite';
      const requestData = {
        openid: openid,
        coverId: item.material_id,
        type: item.type || 0  // 默认为书籍封面
      };

      // 调用后端取消收藏接口
      const response = await request.delete(apiUrl, requestData);
      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }
      
      console.log('调用取消收藏接口成功:', apiUrl, requestData);
      return response;
    }
  },

  // 保存收藏到本地存储
  saveFavoriteToStorage(item, isFavorite) {
    const favorites = wx.getStorageSync('favorites') || {};
    const userId = wx.getStorageSync('userInfo')?.id;
    
    if (!userId) return;
    
    if (!favorites[userId]) {
      favorites[userId] = {};
    }
    
    if (isFavorite) {
      // 添加收藏
      favorites[userId][item.material_id] = {
        ...item,
        favoriteTime: Date.now()
      };
    } else {
      // 移除收藏
      delete favorites[userId][item.material_id];
    }
    
    wx.setStorageSync('favorites', favorites);
  },

  // 初始化收藏状态
  async initFavoriteStatus() {
    const openid = appState.user.openid;
    if (!openid) return;

    try {
      // 从服务器获取用户收藏列表
      const favorites = await this.getUserFavoritesFromServer(openid);
      
      // 更新UI状态
      const coverList = this.data.coverList.map(cover => ({
        ...cover,
        isFavorite: favorites.some(fav => fav.item_id === cover.material_id)
      }));
      
      this.setData({ coverList });
      
      // 同步到本地存储
      this.syncFavoritesToLocal(openid, favorites);
      
    } catch (error) {
      console.error('获取收藏列表失败，使用本地数据:', error);
      // 如果服务器获取失败，使用本地数据
      this.initFavoriteStatusFromLocal();
    }
  },

  // 从服务器获取用户收藏列表
  async getUserFavoritesFromServer(openid) {
    // 使用新的接口格式
    const apiUrl = `/users/${openid}/covers/favorites`;
    
    // 这里可以调用后端接口
    // const response = await request.get(apiUrl);
    // if (response.success) {
    //   return response.data || [];
    // }
    
    // 暂时模拟接口调用
    console.log('获取用户收藏列表，OpenID:', openid, 'API:', apiUrl);
    return []; // 返回空数组，后续可以替换为真实数据
  },

  // 同步收藏数据到本地存储
  syncFavoritesToLocal(openid, favorites) {
    const localFavorites = wx.getStorageSync('favorites') || {};
    
    // 将服务器数据转换为本地存储格式
    const userFavorites = {};
    favorites.forEach(fav => {
      userFavorites[fav.coverId || fav.material_id] = {
        title: fav.title,
        image: fav.image,
        type: fav.type || 0,
        favoriteTime: fav.created_at || Date.now()
      };
    });
    
    localFavorites[openid] = userFavorites;
    wx.setStorageSync('favorites', localFavorites);
  },

  // 从本地存储初始化收藏状态
  initFavoriteStatusFromLocal() {
    const favorites = wx.getStorageSync('favorites') || {};
    const userId = wx.getStorageSync('userInfo')?.id;
    
    if (!userId || !favorites[userId]) return;
    
    const userFavorites = favorites[userId];
    const coverList = this.data.coverList.map(cover => ({
      ...cover,
      isFavorite: !!userFavorites[cover.material_id]
    }));
    
    this.setData({ coverList });
  },

  // 重新登录获取openid
  async reLoginAndGetOpenid() {
    try {
      // 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        console.error('重新登录获取code失败');
        return null;
      }

      // 尝试调用后端接口获取openid
      let openid = null;
      try {
        const loginData = await request.post(apiConfig.login, {
          code: loginRes.code
        });
        
        if (loginData.success && loginData.data.openid) {
          openid = loginData.data.openid;
        }
      } catch (apiError) {
        console.log('后端接口不可用，使用本地方案');
      }

      // 如果后端不可用，使用code作为用户标识
      if (!openid) {
        openid = 'user_' + this.simpleHash(loginRes.code);
      }

      // 更新全局openid
      getApp().setOpenid(openid);
      
      console.log('重新登录成功，获取OpenID:', openid);
      return openid;

    } catch (error) {
      console.error('重新登录失败:', error);
      return null;
    }
  },

  // 简单哈希函数（用于生成用户标识）
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },

  // 更新今日下载次数显示（不按天重置）
  updateTodayDownloadCount() {
    console.log('更新下载次数显示，不按天重置');
    
    // 从本地存储获取下载数据
    const downloadData = wx.getStorageSync('cover_download_data') || {
      downloadCount: 0,
      maxDownloadCount: 1
    };
    
    console.log('获取到的本地存储数据:', JSON.stringify(downloadData));
    
    // 直接更新页面显示，不检查日期变化
    const x = downloadData.downloadCount;
    const y = downloadData.maxDownloadCount;
    
    this.setData({
      todayDownloadCount: x,
      maxDownloadCount: y
    });
    console.log('更新显示：下载：' + x + '/' + y);
  },

  // 检查是否需要观看广告
  checkAdRequirement() {
    // 获取本地存储数据
    const downloadData = wx.getStorageSync('cover_download_data') || {
      downloadCount: 0,
      maxDownloadCount: 1
    };
    
    // 直接判断x是否小于y值
    const x = downloadData.downloadCount;
    const y = downloadData.maxDownloadCount;
    
    // 小于代表可以下载
    return x < y;
  },

  // 给x值+1并更新页面显示
  incrementDownloadCount() {
    console.log('点击下载按钮，增加下载次数');
    
    // 使用与checkAdRequirement相同的本地存储键名，提供默认值
    const downloadData = wx.getStorageSync('cover_download_data') || {
      downloadCount: 0,
      maxDownloadCount: 1
    };
    
    console.log('增加前数据:', JSON.stringify(downloadData));
    
    // 下载次数+1
    downloadData.downloadCount += 1;

    const x = downloadData.downloadCount;
    wx.setStorageSync('cover_download_data', downloadData);
    
    this.setData({
      todayDownloadCount: x
    });
  },

   // 显示广告提示模态框
   showAdModal() {
     this.setData({
       showAdModal: true
     });
   },

   // 关闭广告提示模态框
    closeAdModal() {
      this.setData({
        showAdModal: false
      });
    },

    // 显示广告
    async showAd() {
      if (!this.adWrapper) {
        wx.showToast({
          title: '广告功能暂不可用',
          icon: 'none'
        });
        return;
      }

      // 显示加载中提示
      wx.showLoading({
        title: '广告准备中...'
      });

      try {
        await this.adWrapper.show();
        // 广告显示成功后隐藏加载提示
        wx.hideLoading();
      } catch (err) {
        console.error('广告显示失败:', err);
        // 隐藏加载提示
        wx.hideLoading();
        
        if (err.message.includes('广告正在显示中')) {
          wx.showToast({
            title: '请先关闭当前广告',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '广告加载失败，请重试',
            icon: 'none'
          });
        }
      }
    },

  // 观看广告解锁下载次数
  onWatchAdToUnlock() {
    console.log('点击观看广告解锁下载次数');
    this.initRewardedVideoAd();
  },

  // 广告观看成功回调
  onAdSuccess() {
    // 关闭广告模态框
    this.closeAdModal();
    
    // 重置下载次数为0
    const downloadData = {
      downloadCount: 0,
      maxDownloadCount: 2
    };
    
    wx.setStorageSync('cover_download_data', downloadData);
    
    // 更新页面显示：x=0, y=2
    this.setData({
      todayDownloadCount: 0,
      maxDownloadCount: 2
    });
    
    // 如果有待处理的正规下载，执行下载
    if (this.pendingDownloadEvent) {
      console.log('执行待处理的正规下载操作');
      this.downloadCover(this.pendingDownloadEvent);
      this.pendingDownloadEvent = null;
    }
    
    // 如果有待处理的预览下载，执行预览下载
    if (this.pendingDownloadType === 'preview') {
      console.log('执行待处理的预览下载操作');
      this.downloadPreview();
      this.pendingDownloadType = null;
    }
    
    wx.showToast({
      title: '解锁成功！获取2次下载次数',
      icon: 'success'
    });
  },

  // 关闭广告模态框
  closeAdModal() {
    this.setData({
      showAdModal: false
    });
  },

  // 初始化激励视频广告
  async initRewardedVideoAd() {
    console.log('初始化激励视频广告');
    
    // 显示加载中
    wx.showLoading({
      title: '广告加载中...',
    });
    
    try {
      // 设置广告成功回调
      if (this.adWrapper) {
        this.adWrapper.setSuccessCallback(() => {
          console.log('广告观看成功回调');
          wx.hideLoading();
          this.onAdSuccess();
        });
        
        this.adWrapper.setCloseCallback(() => {
          console.log('广告关闭回调');
          wx.hideLoading();
        });
      }
      
      // 显示广告
      await this.showAd();
    } catch (error) {
      console.error('广告初始化失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '广告加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 显示广告提示模态框
  showAdModal() {
    this.setData({
      showAdModal: true
    });
  },

  // 检测是否为豆瓣图片
  isDoubanImage(imageUrl) {
    return imageUrl && typeof imageUrl === 'string' && imageUrl.includes('douban');
  },

  // 下载封面 - 保存到手机相册
  async downloadCover(e) {
    console.log('开始下载封面');

    // 检查是否需要观看广告
    if (!this.checkAdRequirement()) {
      console.log('需要观看广告，弹出模态框');
      this.showAdModal();
      this.pendingDownloadEvent = e;
      return;
    }

    // 从事件参数中获取封面数据
    const cover = e.currentTarget.dataset.cover;
    if (!cover || !cover.image) {
      console.log('封面数据不可用');
      wx.showToast({
        title: '封面数据不可用',
        icon: 'none'
      });
      return;
    }

    // 检测是否为豆瓣图片
    if (this.isDoubanImage(cover.image)) {
      console.log('检测到豆瓣图片，使用文件下载');
      await this.downloadFileCover(cover);
    } else {
      // 普通图片下载
      console.log('开始下载图片:', cover.image);
      const success = await imageUtils.downloadAndSaveImage(cover.image, {
        onSuccess: () => {
          // 记录下载次数
          this.recordDownloadCount(cover.material_id);
          // 记录下载次数+1，用于限制每日下载次数
          this.incrementDownloadCount();
        },
        onFail: (error) => {
          console.log('图片下载失败:', error);
        }
      });
    }
  },

  // 下载文件预览封面（豆瓣图片）- 使用新的media-proxy接口
  async downloadFilePreview(previewCover) {
    try {
      wx.showLoading({
        title: '保存封面中...'
      });

      // 确保文件名包含扩展名
      let filename = previewCover.title || '豆瓣预览封面';
      if (!filename.includes('.')) {
        const urlExtension = previewCover.image.split('.').pop().split(/[?#]/)[0];
        filename = `${filename}.${urlExtension || 'jpg'}`;
      }
      
      // 第一步：调用 /media-proxy/redirect 接口
      const redirectResult = await this.step1DownloadToLocal(previewCover.image, filename);
      
      if (redirectResult.success) {
        // 第二步：调用 /media-proxy/downloads/:filename 获取本地文件地址
        const downloadResult = await this.step2GetLocalFile(filename);
        
        if (downloadResult.success) {
          console.log('预览文件处理成功，获取到临时文件路径:', downloadResult.filePath);
          
          // 第三步：保存到相册
          await this.step3SaveAndCleanup(downloadResult.filePath, filename, false);
          
          // 记录下载次数
          this.recordDownloadCount(previewCover.material_id);
          this.incrementDownloadCount();
          
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          throw new Error(downloadResult.message || '预览文件下载失败');
        }
      } else {
        throw new Error(redirectResult.message || '预览文件重定向失败');
      }
    } catch (error) {
      console.error('预览封面下载错误:', error);
      wx.showToast({
        title: '预览封面下载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 下载预览封面
  async downloadPreview() {
    console.log('开始下载预览封面');
    
    // 检查是否需要观看广告
    if (!this.checkAdRequirement()) {
      console.log('预览下载需要观看广告，弹出模态框');
      this.showAdModal();
      this.pendingDownloadType = 'preview';
      return;
    }

    const { previewCover } = this.data;
    
    if (!previewCover || !previewCover.image) {
      console.log('预览封面或图片不可用');
      wx.showToast({
        title: '图片不可用',
        icon: 'none'
      });
      return;
    }

    console.log('开始下载预览图片:', previewCover.image);
    
    // 检测是否为豆瓣图片
    if (this.isDoubanImage(previewCover.image)) {
      console.log('检测到豆瓣预览图片，使用文件下载');
      await this.downloadFilePreview(previewCover);
    } else {
      // 普通图片下载
      const success = await imageUtils.downloadAndSaveImage(previewCover.image, {
        onSuccess: () => {
          console.log('预览图片下载成功，开始记录下载次数');
          // 记录下载次数
          this.recordDownloadCount(previewCover.material_id);
          // 记录下载次数+1，用于限制每日下载次数
          this.incrementDownloadCount();
          // 保存成功后不关闭预览页面，只显示成功提示
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
        }
      });

      if (!success) {
        console.log('预览封面下载失败');
      } else {
        console.log('预览封面下载完成');
      }
    }
  },

  // 使用封面
  useCover() {
    const { previewCover } = this.data;

    wx.showModal({
      title: '使用封面',
      content: '确定要使用这个封面吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });

          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '使用成功',
              icon: 'success'
            });
            
            // 提示用户封面已准备就绪
            wx.showModal({
              title: '封面准备就绪',
              content: '封面已成功加载，您可以在设计软件中使用该封面。',
              showCancel: false,
              confirmText: '知道了'
            });
          }, 2000);
        }
      }
    });
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.isLoading) return;
    
    // 先递增页码
    const newPage = this.data.currentPage + 1;
    
    this.setData({
      currentPage: newPage
    });
    
    // 使用递增后的页码调用loadCovers
    this.loadCovers(false);
  },

  // 用户分享
  onShareAppMessage() {
    return {
      title: '书单助手 - 丰富的书籍封面素材库',
      path: '/pages/covers/index',
      imageUrl: '/images/share-covers.jpg'
    };
  },

  // ========== 广告功能 ==========

  // 显示广告（使用新的广告包装器）
  async showAd() {
    if (!this.adWrapper) {
      wx.showToast({
        title: '广告功能暂不可用',
        icon: 'none'
      });
      return;
    }

    try {
      await this.adWrapper.show();
    } catch (err) {
      console.error('广告显示失败:', err);
      
      if (err.message.includes('广告正在显示中')) {
        wx.showToast({
          title: '请先关闭当前广告',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: '广告加载失败，请重试',
          icon: 'none'
        });
      }
    }
  },





  // 显示联网搜索确认框
  showNetworkSearchConfirm(searchKeyword) {
    wx.showModal({
      title: '未找到封面',
      content: `未找到"${searchKeyword}"的相关封面，是否联网搜索？`,
      confirmText: '联网搜索',
      cancelText: '取消',
      success: (res) => {
        // 无论用户选择什么，都记录未找到的书籍
        this.recordBookNotFound(searchKeyword);
        
        if (res.confirm) {
          console.log('用户选择联网搜索，搜索关键词:', searchKeyword);
          this.searchDoubanBookCover(searchKeyword);
        } else {
          console.log('用户取消联网搜索');
        }
      }
    });
  },

  // 搜索豆瓣图书封面
  async searchDoubanBookCover(title) {
    wx.showLoading({
      title: '正在联网搜索...'
    });

    try {
      // 使用正确的API路径，避免重复的/api前缀
      const response = await request.get(`/douban-book-cover?title=${encodeURIComponent(title)}`, null, {
        showLoading: false,
        showErrorToast: false,
        timeout: 15000 // 设置15秒超时
      });

      wx.hideLoading();

      console.log('豆瓣图书封面接口返回:', response);

      if (response.statusCode === 200 && response.data) {
        const result = response.data;
        
        // 解析豆瓣接口返回的数据结构
        if (result.success && result.data && result.data.books && result.data.books.length > 0) {
          const books = result.data.books;
          
          // 将搜索结果追加到封面列表
          this.appendDoubanSearchResults(books, title, result.data.message || `找到 ${result.data.total} 个相关书籍`);
        } else {
          wx.showToast({
            title: result.data?.message || '未找到相关图书封面',
            icon: 'none'
          });
        }
      } else {
        wx.showToast({
          title: '搜索失败，请稍后重试',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('豆瓣图书封面搜索失败:', error);
      wx.showToast({
        title: '搜索失败，网络异常',
        icon: 'none'
      });
    }
  },

  // 记录未找到的书籍
  async recordBookNotFound(bookTitle) {
    try {
      // 调用记录未找到书籍的接口
      await request.post('/books/record-not-found', {
        title: bookTitle,
        openid: appState.user.openid
      }, {
        showLoading: false,
        showErrorToast: false
      });
      console.log('已记录未找到的书籍:', bookTitle);
    } catch (error) {
      console.error('记录未找到书籍失败:', error);
      // 静默失败，不影响用户体验
    }
  },

  // 将豆瓣搜索结果追加到封面列表
  appendDoubanSearchResults(books, searchKeyword, message) {
    // 将豆瓣书籍数据转换为封面数据格式
    const newCovers = books.map((book, index) => ({
      material_id: `douban_${Date.now()}_${index}`, // 生成唯一ID
      title: book.title,
      author: '豆瓣图书',
      image: book.cover_url,
      type: 0, // 图片类型
      description: `来自豆瓣图书搜索: ${searchKeyword}`,
      isDoubanSearch: true // 标记为豆瓣搜索结果
    }));

    // 获取当前封面列表
    const currentCovers = this.data.coverList || [];
    
    // 追加新结果到列表
    const updatedCovers = [...currentCovers, ...newCovers];
    
    // 更新页面数据
    this.setData({
      coverList: updatedCovers,
      hasMore: false // 搜索完成后不再加载更多
    });

    // 显示成功提示
    wx.showToast({
      title: `已添加 ${books.length} 个搜索结果`,
      icon: 'success',
      duration: 2000
    });

    console.log('豆瓣搜索结果已追加到封面列表:', newCovers);
  },

  // 下载文件封面（豆瓣图片）- 使用新的media-proxy接口
  async downloadFileCover(cover) {
    try {
      wx.showLoading({
        title: '处理封面中...'
      });

      // 第一步：调用 /media-proxy/redirect 接口
      // 确保文件名包含扩展名
      let filename = cover.title || '豆瓣封面';
      if (!filename.includes('.')) {
        const urlExtension = cover.image.split('.').pop().split(/[?#]/)[0];
        filename = `${filename}.${urlExtension || 'jpg'}`;
      }
      
      const redirectResult = await this.step1DownloadToLocal(cover.image, filename);
      
      if (redirectResult.success) {
        // 第二步：调用 /media-proxy/downloads/:filename 获取本地文件地址
        const downloadResult = await this.step2GetLocalFile(filename);
        
        if (downloadResult.success) {
          console.log('文件处理成功，获取到临时文件路径:', downloadResult.filePath);
          
          // 第三步：保存到相册
          await this.step3SaveAndCleanup(downloadResult.filePath, filename, false);
          
          // 记录下载次数
          this.recordDownloadCount(cover.material_id);
          this.incrementDownloadCount();
          
          wx.showToast({
            title: '封面保存成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          throw new Error(downloadResult.message || '文件下载失败');
        }
      } else {
        throw new Error(redirectResult.message || '文件重定向失败');
      }
    } catch (error) {
      console.error('封面下载错误:', error);
      wx.showToast({
        title: '封面下载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 第一步：调用 /media-proxy/redirect 将文件下载到本地
  step1DownloadToLocal(mediaUrl, fileName) {
    return new Promise((resolve) => {
      wx.request({
        url: `${apiConfig.baseURL}/media-proxy/redirect`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          fileUrl: mediaUrl,
          filename: fileName
        },
        timeout: 30000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.success) {
            resolve({
              success: true,
              message: '文件下载到本地成功'
            });
          } else {
            resolve({
              success: false,
              message: res.data?.message || '第一步接口调用失败'
            });
          }
        },
        fail: (err) => {
          resolve({
            success: false,
            message: '网络请求失败，请检查网络连接'
          });
        }
      });
    });
  },

  // 第二步：调用 /media-proxy/downloads/:filename 获取本地文件地址
  step2GetLocalFile(fileName) {
    return new Promise((resolve) => {
      wx.downloadFile({
        url: `${apiConfig.baseURL}/media-proxy/downloads/${encodeURIComponent(fileName)}`,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve({
              success: true,
              filePath: res.tempFilePath
            });
          } else {
            resolve({
              success: false,
              message: `下载失败，状态码: ${res.statusCode}`
            });
          }
        },
        fail: (err) => {
          resolve({
            success: false,
            message: '文件下载失败'
          });
        }
      });
    });
  },

  // 第三步：保存到相册并删除本地文件
  step3SaveAndCleanup(filePath, fileName, isVideo) {
    return new Promise((resolve, reject) => {
      // 保存到相册
      const saveFunction = isVideo ? wx.saveVideoToPhotosAlbum : wx.saveImageToPhotosAlbum;
      
      saveFunction({
        filePath: filePath,
        success: () => {
          // 保存成功后删除本地文件
          this.deleteLocalFile(fileName)
            .then(() => {
              resolve();
            })
            .catch(() => {
              // 删除失败不影响主流程
              resolve();
            });
        },
        fail: (err) => {
          // 保存失败也尝试删除文件
          this.deleteLocalFile(fileName)
            .catch(() => {
              // 忽略删除错误
            });
          reject(new Error(isVideo ? '视频保存失败' : '图片保存失败'));
        }
      });
    });
  },

  // 删除本地文件
  deleteLocalFile(fileName) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiConfig.baseURL}/media-proxy/downloads/${encodeURIComponent(fileName)}`,
        method: 'DELETE',
        success: () => {
          resolve();
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 广告成功观看后的回调
  onAdSuccess() {
    console.log('广告观看成功，解锁下载次数');
    
    // 重置下载次数为0，并设置maxDownloadCount为2
    const downloadData = {
      downloadCount: 0,
      maxDownloadCount: 2
    };
    
    wx.setStorageSync('cover_download_data', downloadData);
    
    // 更新页面数据
    this.setData({
      todayDownloadCount: 0,
      maxDownloadCount: 2
    });
    
    wx.showToast({
      title: '解锁成功，获得2次下载次数！',
      icon: 'success'
    });
    
    // 关闭广告模态框
    this.closeAdModal();
    
    // 如果有待处理的下载，执行下载
    if (this.pendingDownloadEvent) {
      console.log('执行待处理下载，pendingDownloadEvent:', this.pendingDownloadEvent);
      // 确保下载能正确执行，直接调用下载逻辑
      const coverId = this.pendingDownloadEvent.currentTarget.dataset.id;
      console.log('待处理下载封面ID:', coverId);
      const cover = this.data.coverList.find(c => c.material_id === coverId);
      
      if (cover && cover.image) {
        console.log('开始执行待处理下载');
        imageUtils.downloadAndSaveImage(cover.image, {
          onSuccess: () => {f
            console.log('待处理下载成功，记录下载次数');
            // 记录下载次数
            this.recordDownloadCount(cover.material_id);
            // 记录页面的下载次数，用于现在每日下载
            this.incrementDownloadCount();
          }
        }).then(success => {
          if (!success) {
            console.log('封面下载失败');
          }
        });
      } else {
        console.log('封面或图片不可用，无法执行待处理下载');
      }
      
      this.pendingDownloadEvent = null;
    }
    
    if (this.pendingDownloadType === 'preview') {
      console.log('执行待处理预览下载');
      // 确保预览下载能正确执行
      const { previewCover } = this.data;
      
      if (previewCover && previewCover.image) {
        imageUtils.downloadAndSaveImage(previewCover.image, {
          onSuccess: () => {
            // 记录下载次数
            this.recordDownloadCount(previewCover.material_id);
            // 记录下载次数+1，用于限制每日下载次数
            this.incrementDownloadCount();
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 1500
            });
          }
        }).then(success => {
          if (!success) {
            console.log('预览封面下载失败');
          }
        });
      }
      
      this.pendingDownloadType = null;
    }
  },

  // 关闭广告提示模态框
  closeAdModal() {
    this.setData({
      showAdModal: false
    });
  },



  // 执行下载操作
  executeDownload() {
    // 这里调用实际的下载逻辑
    // 由于下载逻辑已经存在，我们只需要确保在需要时调用正确的函数
    console.log('执行下载操作');
  },

  // 更新下载次数
  updateDownloadCount() {
    // 更新下载次数
    todayData.downloadCount += 1;
  },

  // 记录未找到的书籍
  async recordBookNotFound(title) {
    try {
      // 构建请求参数
      const params = {
        title: title
      };

      // 发送POST请求到记录接口
      const response = await request.post('/books/record-not-found', params, {
        showLoading: false, // 不显示loading
        showErrorToast: false // 不显示错误提示
      });

      if (response.success) {
        console.log('书籍未找到记录已发送:', title);
      } else {
        console.log('书籍未找到记录发送失败:', title);
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('记录未找到书籍失败:', error);
    }
  },

  // 记录下载次数
  async recordDownloadCount(materialId) {
    try {
      // 构建请求参数
      const params = {
        material_id: materialId
      };

      // 发送POST请求到下载记录接口
      const response = await request.post('/cover-materials/download', params, {
        showLoading: false, // 不显示loading
        showErrorToast: false // 不显示错误提示
      });

      if (response.success) {
        console.log('下载次数记录已发送，素材ID:', materialId);
      } else {
        console.log('下载次数记录发送失败，素材ID:', materialId);
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('记录下载次数失败:', error);
    }
  },

  // 获取状态栏高度，适配刘海屏
  getStatusBarHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    
    // 将px转换为rpx（微信小程序中1px ≈ 2rpx）
    const statusBarHeightRpx = statusBarHeight * 2;
    
    console.log('状态栏高度:', statusBarHeight + 'px (' + statusBarHeightRpx + 'rpx)');
    
    this.setData({
      statusBarHeight: statusBarHeightRpx
    });
    
    // 设置CSS变量，用于WXSS中动态计算
    wx.setStorageSync('statusBarHeight', statusBarHeightRpx);
  },

  // 自定义返回按钮点击事件
  goBack() {
    console.log('点击自定义返回按钮');
    wx.navigateBack({
      delta: 1
    });
  },

  // 返回首页按钮点击事件
  goHome() {
    console.log('点击返回首页按钮');
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 全屏预览界面关闭预览
  onClosePreview() {
    console.log('全屏预览界面关闭预览');
    this.closePreview();
  },

  // 全屏预览界面返回首页
  onGoHome() {
    console.log('全屏预览界面返回首页 - 方法被调用');
    console.log('当前页面状态:', this.data);
    
    // 添加延迟，确保事件处理完成
    setTimeout(() => {
      console.log('执行返回首页操作');
      this.goHome();
    }, 100);
  }

});