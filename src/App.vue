<template>
  <div id="app">
    <calendar />
  </div>
</template>

<script>
import calendar from './components/calendar'

export default {
  name: 'App',
  components: {
    calendar
  },
  data(){
    return{
      show:true,
      id:'test'
    }
  },
  created(){
       //页面实例加载完立即初始化字体
        var cssEl = document.createElement("style");
        document.documentElement.firstElementChild.appendChild(cssEl);
        function setPxPerRem() {
            var dpr = 1;
            var pxPerRem = document.documentElement.clientWidth * dpr / 10;
            cssEl.innerHTML = "html{font-size:" + pxPerRem + "px!important;}";
        }
        setPxPerRem();
        window.onresize = setPxPerRem;
  }
}
</script>

<style>
@import "../static/css/reset.css";
@import "../static/css/sprite.css";
#app {
    height: 100%;
    background-color: #f9f9f9;
    overflow: scroll;
}
</style>
