export const timeFormat = function (timestamp, flag) {
    if (!timestamp) return ''
    var date = new Date(timestamp);
    var Y = date.getFullYear();
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    var D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    if (flag)
      return `${Y}-${M}-${D} ${h}:${m}:${s}`
    else
      return `${Y}-${M}-${D}`
  }

  export const browser = {
    versions: function () {
      var u = navigator.userAgent,
        app = navigator.appVersion;
      return { //移动终端浏览器版本信息
        trident: u.indexOf('Trident') > -1, //IE内核
        presto: u.indexOf('Presto') > -1, //opera内核
        webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
        gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
        mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
        ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
        android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
        iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
        iPad: u.indexOf('iPad') > -1, //是否iPad
        webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
      };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
  }

  export const DivScroll = function (layerNode) {
    //ios滚动果冻效果处理
    //如果没有这个元素的话，那么将不再执行下去
    if (!document.querySelector(layerNode)) return;
    if (!browser.versions.ios) return
    console.log('加载滚动')
    this.popupLayer = document.querySelector(layerNode);
    this.startX = 0;
    this.startY = 0;
  
    this.popupLayer.addEventListener(
      "touchstart",
      function (e) {
        this.startX = e.changedTouches[0].pageX;
        this.startY = e.changedTouches[0].pageY;
      },
      false
    );
  
    // 仿innerScroll方法
    this.popupLayer.addEventListener(
      "touchmove",
      function (e) {
        e.stopPropagation();
        if (!browser.versions.ios) return
        var deltaX = e.changedTouches[0].pageX - this.startX;
        var deltaY = e.changedTouches[0].pageY - this.startY;
        // 只能纵向滚
        if (Math.abs(deltaY) < Math.abs(deltaX)) {
          return false;
        }
  
        if (
          this.offsetHeight + this.scrollTop >=
          this.scrollHeight
        ) {
          if (deltaY < 0) {
            e.preventDefault();
            return false;
          }
        }
        if (this.scrollTop === 0) {
          if (deltaY > 0) {
            e.preventDefault();
            return false;
          }
        }
        // 会阻止原生滚动
        // return false;
      },
      false
    );
    document.addEventListener(
      "touchmove",
      function (e) {
        // 判断默认行为是否可以被禁用
        if (e.cancelable) {
          // 判断默认行为是否已经被禁用
          if (!e.defaultPrevented) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      },
      false
    );
  };