// utils/download.js
// 统一下载工具 - 只接收文件URL

const downloadUtil = {
  /**
   * 下载图片到相册
   * @param {string} imageUrl - 图片URL
   * @param {object} options - 可选参数
   * @param {function} options.onSuccess - 下载成功回调
   * @param {function} options.onError - 下载失败回调
   * @param {string} options.loadingText - 加载提示文字
   * @param {string} options.successText - 成功提示文字
   */
  downloadImage(imageUrl, options = {}) {
    // 参数验证
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      const errorMsg = '图片链接无效';
      wx.showToast({
        title: errorMsg,
        icon: 'none'
      });
      options.onError && options.onError(new Error(errorMsg));
      return Promise.reject(new Error(errorMsg));
    }

    // 显示加载提示
    wx.showLoading({
      title: options.loadingText || '下载中...',
      mask: true
    });

    return new Promise((resolve, reject) => {
      // 检查相册权限
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.writePhotosAlbum']) {
            // 未授权，请求授权
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success: () => {
                this.startDownload(imageUrl, options, resolve, reject);
              },
              fail: () => {
                wx.hideLoading();
                const errorMsg = '需要相册权限才能保存图片';
                wx.showModal({
                  title: '权限提示',
                  content: errorMsg + '，请前往设置开启权限',
                  confirmText: '去设置',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
                reject(new Error(errorMsg));
                options.onError && options.onError(new Error(errorMsg));
              }
            });
          } else {
            // 已授权，开始下载
            this.startDownload(imageUrl, options, resolve, reject);
          }
        },
        fail: () => {
          wx.hideLoading();
          const errorMsg = '权限检查失败';
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
          reject(new Error(errorMsg));
          options.onError && options.onError(new Error(errorMsg));
        }
      });
    });
  },

  /**
   * 开始下载图片
   * @private
   */
  startDownload(imageUrl, options, resolve, reject) {
    // 下载图片到本地
    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          // 保存图片到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              const successMsg = options.successText || '下载成功';
              wx.showToast({
                title: successMsg,
                icon: 'success'
              });
              resolve({ success: true, message: successMsg });
              options.onSuccess && options.onSuccess();
            },
            fail: (err) => {
              wx.hideLoading();
              const errorMsg = '保存到相册失败';
              wx.showToast({
                title: errorMsg,
                icon: 'none'
              });
              reject(new Error(errorMsg));
              options.onError && options.onError(err);
            }
          });
        } else {
          wx.hideLoading();
          const errorMsg = `下载失败，状态码: ${res.statusCode}`;
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
          reject(new Error(errorMsg));
          options.onError && options.onError(new Error(errorMsg));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        const errorMsg = '下载失败，请检查网络连接';
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
        reject(err);
        options.onError && options.onError(err);
      }
    });
  },

  /**
   * 批量下载图片
   * @param {string[]} imageUrls - 图片URL数组
   * @param {object} options - 可选参数
   * @returns {Promise}
   */
  downloadMultiple(imageUrls, options = {}) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return Promise.reject(new Error('图片URL数组不能为空'));
    }

    const results = [];
    let completed = 0;
    const total = imageUrls.length;

    return new Promise((resolve, reject) => {
      imageUrls.forEach((url, index) => {
        this.downloadImage(url, {
          ...options,
          loadingText: `下载中 (${index + 1}/${total})`,
          successText: `下载成功 (${index + 1}/${total})`,
          onSuccess: () => {
            completed++;
            results.push({ url, success: true });
            
            if (completed === total) {
              resolve(results);
            }
          },
          onError: (error) => {
            completed++;
            results.push({ url, success: false, error });
            
            if (completed === total) {
              resolve(results);
            }
          }
        }).catch(() => {
          completed++;
          results.push({ url, success: false });
          
          if (completed === total) {
            resolve(results);
          }
        });
      });
    });
  }
};

module.exports = downloadUtil;