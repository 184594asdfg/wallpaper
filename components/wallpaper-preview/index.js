// components/wallpaper-preview/index.js
Component({
  properties: {
    // 预览状态
    showPreview: {
      type: Boolean,
      value: false
    },
    // 当前预览的壁纸数据
    currentPreviewWallpaper: {
      type: Object,
      value: null
    },
    // 预览页面导航栏位置
    previewNavTop: {
      type: Number,
      value: 0
    },
    // 当前时间
    currentTime: {
      type: String,
      value: ''
    },
    // 当前日期
    currentDate: {
      type: String,
      value: ''
    },
    // 显示比例 'auto' | '1:1' | '16:9'
    aspectRatio: {
      type: String,
      value: 'auto'
    }
  },

  data: {
    // 时间日期显示位置（组件内部自动计算）
    timeDateHeight: 0
  },

  lifetimes: {
    attached() {
      // 组件挂载时自动计算时间日期高度
      this.calculateTimeDateHeight();
    }
  },

  methods: {
    // 计算时间日期显示位置
    calculateTimeDateHeight() {
      // 获取胶囊按钮位置
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      // 计算时间日期显示位置（导航栏底部加上适当间距）
      const timeDateHeight = menuButtonInfo.bottom + 20;
      
      this.setData({
        timeDateHeight: timeDateHeight
      });
    },

    // 关闭预览
    onClosePreview() {
      this.triggerEvent('closePreview');
    },

    // 下载壁纸
    downloadWallpaper() {
      if (this.properties.currentPreviewWallpaper) {
        this.triggerEvent('downloadWallpaper', {
          wallpaper: this.properties.currentPreviewWallpaper
        });
      }
    },

    // 阻止触摸移动
    preventTouchMove() {
      // 阻止触摸移动，防止模态框滑动
    }
  }
})