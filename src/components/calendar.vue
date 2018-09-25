<template>
    <div class="calendar">
        <ul class="calendar-header">
            <li>
                <span class="left">入住日期</span>
                <span class="right">离开日期</span>
            </li>
            <li class="date-selected">
                <span class="left">{{start_info.day}}</span>
                <label>{{nights?`共${nights}晚`:''}}</label>
                <span class="right">{{end_info.day}}</span>
            </li>
            <li class="week-selected">
                <span class="left">{{start_info.week}}</span>
                <span class="right">{{end_info.week}}</span>
            </li>
        </ul>
        <ul class="calendar-week">
            <li>日</li>
            <li>一</li>
            <li>二</li>
            <li>三</li>
            <li>四</li>
            <li>五</li>
            <li>六</li>
        </ul>
        <!-- calendar-date中的class说明 -->
        <!-- "不可选日期"文字显示灰色：no-select;
		"周末"显示橙色：weekend;
		"今天"显示橙色：today;
		"入住"背景橙色,文字白色：date-begin;
		"离店"背景橙色,文字白色：date-end;
		"房型不足"背景灰色,文字白色：no-room;
		"入住与离店区间日期"背景浅橙色,文字白色：area-selected;
		其中入住离店和区间样式层级高与周末和今天不冲突，房型不足层级最高； -->
        <div class="calendar-date">
            <ul v-for="months in datas" :key="months.month" v-if="datas.length>0">
                <h3>{{format_time(months.month)}}</h3>
                <li @click="chose(day,noSelect(day,day.realTime))" v-for="(day) in months.days" :key="day.realTime" :class="{'no-room':day.hint=='不足','no-select':noSelect(day,day.realTime),'weekend':day.week,'today':today(day.realTime),'area-selected':(day.choseState==2),'date-begin':(day.choseState==1),'date-end':(day.choseState==3)}">
                    <p>{{get_day(day.realTime)?get_day(day.realTime):' '}}</p>
                    <p>{{day.hint?day.hint:' '}}</p>
                </li>
            </ul>
        </div>
        <ul class="bottom-opration fixed-bottom" @click="sure">
            <i class="submit submit-normal" :class="{'grey':(!chose_start||!chose_end)}">{{(!chose_start||!chose_end)?'请选择离店日期':'确认选择'}}</i>
        </ul>
    </div>
</template>

<script>
import data from "./data";
import { timeFormat, DivScroll } from "utils";
export default {
    props: {
        productId: {
            //房型id
            required: false,
            type: String,
            default: ""
        },
        limitNum: {
            ////最小房型
            required: false,
            type: Number,
            default: 0
        },
        start_time: {
            //选择开始时间
            required: false,
            type: String,
            default: ""
        },
        end_time: {
            //选择结束时间
            required: false,
            type: String,
            default: ""
        },
        month_num: {
            //显示月数
            required: false,
            type: Number,
            default: 6
        }
    },
    watch: {
        openCal(val) {
            this.show = val;
        }
    },
    data() {
        return {
            timeout: "",
            leap: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], //闰年月
            ordinary: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], //普通年月
            now_day: "", //当前日期
            now_month: "", //当前月份
            now_year: "", //当前年份,
            end_month: "", //结束月份
            end_year: "", //结束年份,
            now_day_time: "", //今日时间戳
            datas: [], //处理数据
            temp_data: [], //选中日期缓存数据
            oldData: [], //原数据缓存,
            chose_start: "2018-09-14",
            chose_end: "2018-09-16",
            show: this.openCal
        };
    },
    methods: {
        close() {
            this.show = false;
            this.$emit("close", false);
        },
        format_time(time) {
            //格式化显示月份
            let temp = time.split("-");
            return `${temp[0]}年${temp[1]}月`;
        },
        sure() {
            //确认按钮
            if (!this.chose_start || !this.chose_end) return;
            //确认按钮
            let min = "";
            if (this.productId) {
                if (this.temp_data.length > 0) {
                    min = Number(this.temp_data[0].remainingCount);
                    this.temp_data.forEach(item => {
                        if (Number(item.remainingCount) < min)
                            min = Number(item.remainingCount);
                    });
                }
            }
            this.$emit(
                "calData",
                JSON.stringify({
                    start: this.chose_start,
                    end: this.chose_end,
                    min: min
                })
            );
            this.$emit("close", false);
        },
        whitchWeek(time) {
            //周末时间判断
            let week = new Date(time).getDay();
            switch (week) {
                case 0:
                    return "周日";
                    break;
                case 1:
                    return "周一";
                    break;
                case 2:
                    return "周二";
                    break;
                case 3:
                    return "周三";
                    break;
                case 4:
                    return "周四";
                    break;
                case 5:
                    return "周五";
                    break;
                default:
                    return "周六";
            }
        },
        time_compare(time1, time2) {
            //时间大小比较（传入格式化时间）
            return new Date(time1) > new Date(time2);
        },
        chose_state(item) {
            //日期状态设置（正常，入住，离店）
            if (!this.chose_start && !this.chose_end) return 0;
            if (this.chose_start && this.chose_end && this.productId) {
                //判断现有入住，离店时间中间时间是否满足房型数量，不满足重置入住离店时间
                let during = [],
                    full = false;
                if (this.temp_data.length > 0) {
                    //有缓存使用缓存
                    during = this.temp_data;
                } else {
                    during = this.oldData.filter((just, index) => {
                        //筛取符合时间段数据
                        return (
                            this.time_compare(
                                just.realTime,
                                this.chose_start
                            ) &&
                            this.time_compare(this.chose_end, just.realTime)
                        );
                    });
                }
                full = during.every(each => {
                    //是否都满足房型数量
                    return Number(each.remainingCount) >= this.limitNum;
                });
                if (!full) {
                    this.chose_end = "";
                }
            }
            if (
                this.chose_start == timeFormat(item.realTime) &&
                this.day_time(this.chose_start) >= this.day_time()
            ) {
                //设置入住时间状态
                if (
                    !this.productId ||
                    (this.productId &&
                        Number(item.remainingCount) >= this.limitNum)
                ) {
                    return 1;
                } else {
                    this.chose_start = "";
                    this.chose_end = "";
                    return 0;
                }
            } else if (
                //设置离店时间
                this.chose_end == timeFormat(item.realTime)
            ) {
                if (
                    this.chose_start &&
                    this.time_compare(this.chose_end, this.chose_start)
                ) {
                    //是否满足有开始时间并结束时间大于开始时间
                    return 3;
                } else {
                    this.chose_end = "";
                    return 0;
                }
            } else if (
                //设置中间时间
                this.time_compare(item.realTime, this.chose_start) &&
                this.time_compare(this.chose_end, item.realTime)
            ) {
                return 2;
            } else {
                //正常日期
                return 0;
            }
        },
        today(time) {
            //是否今天
            if (
                timeFormat(this.day_time(time)) == timeFormat(this.now_day_time)
            )
                return true;
            else return false;
        },
        chose(item, flag) {
            //点击操作
            let old_start = this.chose_start;
            let old_end = this.chose_end;
            this.temp_data.splice(0, this.temp_data.length); //置空
            //选中操作
            if (!flag) {
                if (
                    //入住，离店都未选择时
                    (!this.chose_start && !this.chose_end && !this.productId) ||
                    (!this.chose_start &&
                        !this.chose_end &&
                        Number(item.remainingCount) >= this.limitNum &&
                        this.productId)
                ) {
                    this.chose_start = item.realTime;
                } else if (
                    //入住，离店都选择或离店未选择
                    this.chose_start &&
                    this.chose_end
                ) {
                    this.chose_start = item.realTime;
                    this.chose_end = "";
                } else if (this.chose_start && !this.chose_end) {
                    let time =
                        (this.day_time(item.realTime) -
                            this.day_time(this.chose_start)) /
                        (24 * 60 * 60 * 1000);
                    if (time == 1) {
                        this.chose_end = item.realTime;
                    } else if (
                        this.time_compare(item.realTime, this.chose_start)
                    ) {
                        if (this.productId) {
                            let during = [],
                                full = false;
                            this.temp_data = during = this.oldData.filter(
                                (just, index) => {
                                    return (
                                        this.time_compare(
                                            just.realTime,
                                            this.chose_start
                                        ) &&
                                        this.time_compare(
                                            item.realTime,
                                            just.realTime
                                        )
                                    );
                                }
                            );
                            full = during.every(each => {
                                return (
                                    Number(each.remainingCount) >= this.limitNum
                                );
                            });
                            if (full) {
                                this.chose_end = item.realTime;
                            } else {
                                this.chose_start = item.realTime;
                            }
                        } else {
                            this.chose_end = item.realTime;
                        }
                    } else {
                        this.chose_start = item.realTime;
                        this.chose_end = "";
                    }
                }
            } else if (
                flag &&
                this.chose_start &&
                !this.chose_end &&
                this.time_compare(item.realTime, this.chose_start) &&
                this.productId
            ) {
                let during = [],
                    full = false;
                this.temp_data = during = this.oldData.filter((just, index) => {
                    return (
                        this.time_compare(just.realTime, this.chose_start) &&
                        this.time_compare(item.realTime, just.realTime)
                    );
                });
                full = during.every(each => {
                    return Number(each.remainingCount) >= this.limitNum;
                });
                if (full) {
                    this.chose_end = item.realTime;
                    console.log(this.chose_end, 1, "离店");
                }
            }
            this.data_state_change(old_start, old_end, false); //先清除源选中状态
        },
        data_state_change(statr, end, flag) {
            if (statr && !end) {
                let month = this.get_year_month(statr);
                for (let a = 0; a < this.datas.length; a++) {
                    if (this.datas[a].month == month) {
                        for (let b = 0; b < this.datas[a].days.length; b++) {
                            if (this.datas[a].days[b].realTime == statr) {
                                if (!flag) {
                                    this.datas[a].days[b].choseState = 0;
                                    if (
                                        this.get_day(
                                            this.datas[a].days[b].realTime
                                        ) == new Date().getDate()
                                    ) {
                                        //还原今天显示
                                        this.datas[a].days[b].hint = "今天";
                                    } else {
                                        this.datas[a].days[b].hint = "";
                                    }
                                } else {
                                    this.datas[a].days[b].choseState = 1;
                                    this.datas[a].days[b].hint = "入住";
                                }
                                break;
                            }
                        }
                    }
                }
            } else if (statr && end) {
                let start_month = this.get_year_month(statr);
                let end_month = this.get_year_month(end);
                for (let a = 0; a < this.datas.length; a++) {
                    if (
                        new Date(this.datas[a].month) <= new Date(end_month) &&
                        new Date(this.datas[a].month) >= new Date(start_month)
                    ) {
                        for (let b = 0; b < this.datas[a].days.length; b++) {
                            if (this.datas[a].days[b].realTime == statr) {
                                if (!flag) {
                                    this.datas[a].days[b].choseState = 0;
                                    if (
                                        this.get_day(
                                            this.datas[a].days[b].realTime
                                        ) == new Date().getDate()
                                    ) {
                                        this.datas[a].days[b].hint = "今天";
                                    } else {
                                        this.datas[a].days[b].hint = "";
                                    }
                                } else {
                                    this.datas[a].days[b].choseState = 1;
                                    this.datas[a].days[b].hint = "入住";
                                }
                            } else if (
                                this.time_compare(
                                    this.datas[a].days[b].realTime,
                                    statr
                                ) &&
                                this.time_compare(
                                    end,
                                    this.datas[a].days[b].realTime
                                )
                            ) {
                                if (!flag) {
                                    this.datas[a].days[b].choseState = 0;
                                } else {
                                    this.datas[a].days[b].choseState = 2;
                                }
                                this.datas[a].days[b].hint = "";
                            } else if (this.datas[a].days[b].realTime == end) {
                                if (!flag) {
                                    this.datas[a].days[b].choseState = 0;
                                    if (
                                        this.datas[a].days[b].remainingCount <
                                        this.limitNum
                                    ) {
                                        this.datas[a].days[b].hint = "不足";
                                    } else {
                                        this.datas[a].days[b].hint = "";
                                    }
                                } else {
                                    this.datas[a].days[b].choseState = 3;
                                    this.datas[a].days[b].hint = "离店";
                                }
                                break; //结束循环
                            }
                        }
                    }
                }
            }
            if (!flag) {
                this.data_state_change(this.chose_start, this.chose_end, true); //设置选中数据
            }
        },
        hint(item) {
            //初始化日期状态显示
            let start = this.day_time(this.chose_start);
            let end = this.day_time(this.chose_end);
            if (item.choseState && item.choseState == 1) {
                return "入住";
            } else if (item.choseState && item.choseState == 3) {
                return "离店";
            } else if (item.status == "0" && this.productId) {
                return "停售";
            } else if (
                Number(item.remainingCount) < this.limitNum &&
                this.productId
            ) {
                return "不足";
            } else if (this.today(item.realTime)) {
                return "今天";
            } else {
                return "";
            }
        },
        noSelect(item, time) {
            //是否可点击
            if (
                this.day_time(time) < this.now_day_time ||
                (this.productId && Number(item.remainingCount) < this.limitNum)
            ) {
                return true;
            } else {
                return false;
            }
        },
        init_Server(data) {
            //初始化服务端数据
            let list = [];
            let month = "";
            data.forEach((item, index) => {
                if (this.get_year_month(item.realTime) !== month) {
                    let nodays = this.month_week_start(
                        `${this.get_year(item.realTime)}-${this.get_month(
                            item.realTime
                        ) + 1}`
                    );
                    list.push({
                        month: this.get_year_month(item.realTime),
                        days: []
                    });
                    for (let a = 0; a < nodays; a++) {
                        list[list.length - 1].days.push({});
                    }
                }
                item.week = this.isWeekend(item.realTime);
                item.choseState = this.chose_state(item);
                item.hint = this.hint(item);
                list[list.length - 1].days.push(item);
                month = this.get_year_month(item.realTime);
            });
            return list;
        },
        init_noServer() {
            //初始化本地数据
            let months = [];
            let temp_data = [];
            for (let a = 0; a < this.month_num; a++) {
                let now = new Date();
                now.setMonth(Number(this.now_month) - 1 + a);
                let time = timeFormat(now);
                months.push({
                    month: time.substr(0, 7),
                    day_num: this.month_days(time)
                });
            }
            months.forEach(item => {
                let temp = {
                    month: item.month,
                    days: []
                };
                let nodays =
                    this.month_week_start(
                        `${this.get_year(item.month)}-${this.get_month(
                            item.month
                        ) + 1}`
                    ) - 1;
                for (let a = 0; a <= Number(item.day_num) + nodays; a++) {
                    temp.days[a] = {};
                    if (a > nodays) {
                        let day =
                            a - nodays < 10 ? `0${a - nodays}` : a - nodays;
                        let realTime = (temp.days[a].realTime = `${
                            item.month
                        }-${day}`);
                        temp.days[a].week = this.isWeekend(realTime);
                        let choseState = (temp.days[
                            a
                        ].choseState = this.chose_state({
                            realTime
                        }));
                        temp.days[a].hint = this.hint({ choseState, realTime });
                    }
                }
                temp_data.push(temp);
            });
            this.datas = temp_data;
        },
        day_time(time) {
            //获取当天零点时间戳,不传默认今天
            if (time) return new Date(new Date(time).setHours(0, 0, 0, 0));
            else return new Date(new Date().setHours(0, 0, 0, 0));
        },
        get_month(time) {
            //获取月份，从0开始
            return new Date(time).getMonth();
        },
        get_year_month(time) {
            //获取含年份的月份，
            let year = new Date(time).getFullYear();
            let month =
                new Date(time).getMonth() + 1 < 10
                    ? `0${new Date(time).getMonth() + 1}`
                    : new Date(time).getMonth() + 1;
            return `${year}-${month}`;
        },
        get_year(time) {
            //获取年份
            return new Date(time).getFullYear();
        },
        get_day(time) {
            //获取日历
            if (time) return new Date(time).getDate();
            else return "";
        },
        leap_year(year) {
            //闰年判断
            if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
                return true;
            else return false;
        },
        month_week_start(month) {
            //判断每个月第一天是星期几
            let temp_month = month.substring(5, month.length);
            let temp_year = month.substring(0, 4);
            if (Number(temp_month) < 10) temp_month = `0${temp_month}`;
            return Number(new Date(`${temp_year}-${temp_month}`).getDay());
        },
        month_days(month) {
            //获取每月天数
            let year = new Date(month).getFullYear();
            let leap = this.leap_year(year) ? this.leap : this.ordinary;
            let month_index = new Date(month).getMonth();
            return leap[month_index];
        },
        get_end_month() {
            //初始化日历结束时间
            if (this.now_month) {
                let now = new Date();
                now.setMonth(
                    Number(this.now_month) - 1 + Number(this.month_num)
                );
                return {
                    month:
                        now.getMonth() < 10
                            ? `0${now.getMonth()}`
                            : now.getMonth(),
                    year: now.getFullYear()
                };
            } else {
                return {
                    month: "",
                    year: ""
                };
            }
        },
        isWeekend(time) {
            //是否周末
            let week = new Date(time).getDay();
            if (week === 6 || week == 0) {
                return true;
            } else {
                return false;
            }
        }
    },
    computed: {
        start_info() {
            //顶部开始时间
            if (this.chose_start) {
                let month =
                    this.get_month(this.chose_start) + 1 < 10
                        ? `0${this.get_month(this.chose_start) + 1}`
                        : this.get_month(this.chose_start) + 1;
                return {
                    day: `${month}月${this.get_day(this.chose_start)}日`,
                    week: this.whitchWeek(this.chose_start)
                };
            } else {
                return {
                    day: "----",
                    week: "----"
                };
            }
        },
        end_info() {
            //顶部结束时间
            if (this.chose_end) {
                let month =
                    this.get_month(this.chose_end) + 1 < 10
                        ? `0${this.get_month(this.chose_end) + 1}`
                        : this.get_month(this.chose_end) + 1;
                return {
                    day: `${month}月${this.get_day(this.chose_end)}日`,
                    week: this.whitchWeek(this.chose_end)
                };
            } else {
                return {
                    day: "---",
                    week: "----"
                };
            }
        },
        nights() {
            //入住晚数
            if (this.chose_start && this.chose_end) {
                let time =
                    this.day_time(this.chose_end) -
                    this.day_time(this.chose_start);
                return time / 24 / 60 / 60 / 1000;
            } else {
                return "";
            }
        }
    },
    mounted() {
        this.timeout = window.setTimeout(() => {
            new DivScroll(".calendar-date");
        }, 250);
    },
    destroyed() {
        window.clearTimeout(this.timeout);
    },
    created() {
        this.now_day =
            Number(new Date().getDate()) < 10
                ? `0${new Date().getDate()}`
                : new Date().getDate(); //当前日期
        this.now_month =
            Number(new Date().getMonth() + 1) < 10
                ? `0${new Date().getMonth() + 1}`
                : new Date().getMonth() + 1; //当前月份
        this.now_year = new Date().getFullYear(); //当前年份
        let end = this.get_end_month();
        this.end_month = end.month;
        this.end_year = end.year;
        this.now_day_time = this.day_time(
            `${this.now_year}-${this.now_month}-${this.now_day}`
        );
        let end_month_day = this.month_days(
            `${this.end_year}-${this.end_month}`
        );
        this.chose_start = this.start_time; //初始化选择时间
        this.chose_end = this.end_time;
        if (this.productId) {
            /*   srsbt.fn(
                {
                    startTime: timeFormat(
                        new Date(`${this.now_year}-${this.now_month}-01`)
                    ),
                    endTime: timeFormat(
                        new Date(
                            `${this.end_year}-${
                                this.end_month
                            }-${end_month_day}`
                        )
                    ),
                    productId: this.productId
                },
                res => {
                    this.oldData = res.data.detail.dataList;
                    this.datas = this.init_Server(this.oldData);
                }
            ); */
            this.oldData = data;
            this.datas = this.init_Server(this.oldData);
        } else {
            this.init_noServer();
        }
    }
};
</script>


<style scoped>
.pick {
    position: absolute;
    z-index: 999;
    height: 100%;
    top: 0;
}
</style>

<style>
/* 日历 */
.calendar {
    height: calc(100% - 1rem);
    overflow: hidden;
    background: #fff;
}
.calendar-header {
    padding: 0.048309rem 0.724638rem;
}
.calendar-header li {
    overflow: hidden;
    padding: 0.193237rem 0;
    text-align: center;
    font-size: 0.289855rem;
    color: #5b5b5b;
}
.calendar-header li.date-selected {
    color: #333;
    font-size: 0.434783rem;
    font-weight: bold;
}
.calendar-header li.date-selected label {
    padding: 0 0.241546rem;
    color: #fd8238;
    font-size: 0.31401rem;
    border-bottom: 1px solid #fd8238;
}
.calendar-header li.date-selected span {
    min-width: 2.173913rem;
}
.calendar-header li.date-selected span.left {
    text-align: left;
}
.calendar-header li.date-selected span.right {
    text-align: right;
}
.calendar-week {
    background: #f9f9f9;
    display: -moz-box;
    display: -webkit-box;
    display: -o-box;
    display: box;
    -moz-box-orient: horizontal;
    -webkit-box-orient: horizontal;
    -o-box-orient: horizontal;
    box-orient: horizontal;
}
.calendar-week li {
    height: 1.207729rem;
    line-height: 1.207729rem;
    text-align: center;
    -moz-box-flex: 1;
    -webkit-box-flex: 1;
    box-flex: 1;
    width: 0%;
    font-size: 0.386473rem;
    color: #5b5b5b;
}
.calendar-date {
    height: calc(100% - 5.280193rem);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
.calendar-date ul {
    text-align: center;
    padding-bottom: 0.483092rem;
    overflow: hidden;
}
.calendar-date h3 {
    font-size: 0.483092rem;
    color: #333;
    font-weight: bold;
    height: 1.207729rem;
    line-height: 1.207729rem;
    font-size: 0.386473rem;
    color: #5b5b5b;
}
.calendar-date ul li {
    border-radius: 0.072464rem;
    width: 1.356106rem;
    box-sizing: border-box;
    float: left;
    font-size: 0.386473rem;
    color: #333;
    margin: 0.036232rem;
}
.calendar-date ul li p {
    height: 0.57971rem;
    line-height: 0.57971rem;
}
.calendar-date ul li p:last-child {
    font-size: 0.31401rem;
}
.calendar-date ul li.today p:last-child,
.calendar-date ul li.weekend {
    color: #fd8238;
}
.calendar-date ul li.date-begin p:last-child,
.calendar-date ul li.date-end p:last-child {
    color: #fff;
}
.calendar-date ul li.date-begin {
    background: #fd8238;
    color: #fff;
}
.calendar-date ul li.area-selected {
    background: #ffdaa5;
    color: #fff;
}
.calendar-date ul li.no-select {
    color: #aaa;
}
.calendar-date ul li.no-room {
    color: #fff;
    background: #bbb;
}
.calendar-date ul li.date-end {
    background: #fd8238;
    color: #fff;
}
</style>
