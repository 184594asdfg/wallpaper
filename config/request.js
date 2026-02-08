// 请求方法封装
const { getBaseUrl } = require('./api');

// 简单的拦截器实现
const interceptors = {
  // 请求拦截器
  request: (config) => {
    // 这里可以添加token等认证信息
    // 例如: config.header['Authorization'] = `Bearer ${wx.getStorageSync('token')}`;
    return config;
  },
  // 响应拦截器
  response: (response) => {
    return response;
  }
};

// 封装请求方法
const request = (options) => {
  // 默认配置
  const defaultOptions = {
    method: 'GET',
    header: {
      'Content-Type': 'application/json'
    },
    timeout: 10000,
    showLoading: false
  };
  
  // 合并配置
  let finalOptions = {
    ...defaultOptions,
    ...options
  };
  
  // 请求拦截
  finalOptions = interceptors.request(finalOptions);
  
  // 处理URL
  const baseUrl = getBaseUrl();
  const url = finalOptions.url.startsWith('http') ? finalOptions.url : `${baseUrl}${finalOptions.url}`;
  
  // 显示加载状态
  if (finalOptions.showLoading) {
    wx.showLoading({
      title: finalOptions.loadingText,
      mask: true
    });
  }
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...finalOptions,
      url,
      success: (res) => {
        // 隐藏加载状态
        if (finalOptions.showLoading) {
          wx.hideLoading();
        }
        
        // 响应拦截
        const interceptedResponse = interceptors.response(res);
        
        // 统一响应处理
        if (interceptedResponse.statusCode === 200) {
          const responseData = interceptedResponse.data;
          if (responseData.success || responseData.code === 200) {
            resolve(responseData.data);
          } else {
            wx.showToast({
              title: responseData.message || '请求失败',
              icon: 'none'
            });
            reject(new Error(responseData.message || '请求失败'));
          }
        } else {
          wx.showToast({
            title: `网络错误(${interceptedResponse.statusCode})`,
            icon: 'none'
          });
          reject(new Error(`网络错误(${interceptedResponse.statusCode})`));
        }
      },
      fail: (err) => {
        // 隐藏加载状态
        if (finalOptions.showLoading) {
          wx.hideLoading();
        }
        
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// 快捷方法
const get = (url, data, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
};

const post = (url, data, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
};

module.exports = {
  request,
  get,
  post
};

