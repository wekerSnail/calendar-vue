# calendar

基于vue开发的日历组件

**运行**

`npm run dev`

**打包**

`npm run build`



**离线功能**

- 今天显示
- 今天之前日期置灰
- 入住时间段选择
- 确认输出选择的起始时间和结束时间

**上线功能**

*需要配合接口数据，这边主要结合我这这边接口数据来设计*

- 今天显示
- 今天之前日期置灰
- 房型数量不足时间置灰
- 入住时间段选择
- 置灰时间及不足日期皆不可以选择

| --         | --     | --                       |
| ---------- | ------ | ------------------------ |
| 参数       | 类型   | 备注                     |
| productId  | String | 房型id,接口数据          |
| limitNum   | Number | 可选最小房型数量，默认0  |
| start_time | String | 默认起始时间，yyyy-mm-dd |
| end_time   | String | 默认结束时间，yyyy-mm-dd |
| month_num  | Number | 日历显示月数,默认6个月   |



**使用**

```
  <calendar month_num='4' />
```





[demo地址](https://wekersnail.github.io/calendar-vue/)



**预览**

![离线模式下，没有数量限制](http://wx2.sinaimg.cn/mw690/99acde33gy1fvlm72uhfsj208w0fjwek.jpg)



![配合接口](http://wx2.sinaimg.cn/mw690/99acde33gy1fvlm70j96mj208w0fjwem.jpg)

![配合接口](http://wx3.sinaimg.cn/mw690/99acde33gy1fvlm6vot05j208w0fjmx7.jpg)

![配合接口](http://wx4.sinaimg.cn/mw690/99acde33gy1fvlm6y5ypoj208w0fj74c.jpg)