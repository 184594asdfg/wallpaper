// components/common-navbar/index.js
Component({
  properties: {
    // 页面标题
    title: {
      type: String,
      value: ''
    },
    // 背景颜色
    backgroundColor: {
      type: String,
      value: '#fff'
    }
  },

  data: {
    // 导航栏相关值
    navBarHeight: 0,
    navBarTop: 0
  },

  lifetimes: {
    attached() {
      // 组件挂载时自动计算导航栏位置
      this.calculateNavBarPosition();
    }
  },

  methods: {
    // 计算导航栏位置和高度
    calculateNavBarPosition() {
      // 获取胶囊按钮位置
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      
      // 设置导航栏高度、顶部距离
      this.setData({
        navBarHeight: menuButtonInfo.height + 8,
        navBarTop: menuButtonInfo.top
      });
    },

    // 返回按钮点击事件
    onBack() {
      this.triggerEvent('back');
    }
  }
})