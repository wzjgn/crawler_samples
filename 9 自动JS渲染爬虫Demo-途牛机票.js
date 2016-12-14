/*
  爬取途牛国内机票价格等信息；
  因为机票信息是js异步加载的，所以该爬虫使用神箭手的自动JS渲染功能；
  只需要设置一个参数‘enableJS’就可以让爬虫自动加载页面所有js，然后和抽取网页源码里的数据一样简单地抽取异步加载的数据。
  
  注意：自动JS渲染的时间较长，简单的js请求建议还是用分析请求的方式来爬取更好！
*/
var fromCity="北京";//@input(fromCity,国内出发城市,比如：北京)
var toCity="上海";//@input(toCity,国内到达城市,比如：上海)
var date="";//@input(date,出发日期,格式请参考：2016-06-01，如不填写表示当天)

var fromCityCode = "";
var toCityCode = "";
// 如果不输入出发日期，设置为当天
if(date===""){
  var currentDate = new Date();
  var year = currentDate.getFullYear();    //获取完整的年份(4位,1970-????)
  var month = currentDate.getMonth()+1;    //获取当前月份(0-11,0代表1月)
  if(month<10){
      month="0"+month;
  }
  var day = currentDate.getDate();       //获取当前日(1-31)
  if(day<10){
      day="0"+day;
  }
  date=year+"-"+month+"-"+day;
}

var configs = {
    domains: ["tuniu.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/www\.tuniu\.com\/flight\/city_\d+_\d+\/\?start=.+/],
    contentHelperRegexes: [""], // 设置待爬队列中所有网页都不是列表页
    enableJS: true, // 设置enableJS为true，那么待爬队列里的所有网页都会自动进行JS渲染
    renderTime: 10000, // 自动渲染最长等待时间：10秒内若网页未请求数据, 自动JS渲染会立即结束。默认值为3秒, 最大值为10分钟
    fields: [  // fields里的数据都是js生成的，开启js渲染后抽取和正常抽取网页源码里的数据一样简单
        {
            name: "flights", // 如果fields里只有一个field（对象数组），表示单页提取多条数据。
            selector: "//div[@id='J_AirLIst']/div[contains(@class,'flg')]", 
            repeated: true,
            children: [   
                {
                    name: "flight_number",
                    alias: "航班号",
                    selector: "//div[contains(@class,'flg_name')]/span[last()]/text()",
                    primaryKey: true // primaryKey设置为true的field会一起作为主键，主键完全相同的数据会自动去重。缺省第一个field是主键
                },
                {
                    name: "airline",
                    alias: "航空公司",
                    selector: "//span[contains(@class,'airlineNames')]/text()"
                },
                {
                    name: "model",
                    alias: "机型",
                    selector: "//div[contains(@class,'flg_name')]/span[last()]/a/text()"
                },
                {
                  	 name: "lowest_price",
                    alias: "最低价格（元）",
                    selector: "//div[contains(@class,'flg_price')]/strong"
                },
                {
                    name: "dep_time",
                    alias: "起飞时间",
                    selector: "//div[contains(@class,'flg_start')]/strong",
                    primaryKey: true
                },
                {
                    name: "dep_airport",
                    alias: "起飞机场",
                    selector: "//div[contains(@class,'flg_start')]/span"
                },
                {
                    name: "arv_time",
                    alias: "到达时间",
                    selector: "//div[contains(@class,'flg_arrival')]/strong",
                    primaryKey: true
                },
                {
                    name: "arv_airport",
                    alias: "到达机场",
                    selector: "//div[contains(@class,'flg_arrival')]/span"
                },
                {
                    name: "duration",
                    alias: "飞行时长",
                    selector: "//div[contains(@class,'flg_duration')]/span"
                },
                {
                  	 name: "ontime_rate",
                    alias: "准点率",
                    selector: "//div[contains(@class,'flg_rate')]/div[last()]"
                }
            ]
        }
    ]
};

configs.beforeCrawl = function(site){
    // 爬取前，先获取城市在途牛上的城市码
    var content = site.requestUrl("http://www.tuniu.com/flight/international/getCities");
    if(content === null || content === "" || typeof(content)=="undefined"){
      system.exit("对方网站无返回"); // 打印错误消息到日志中，并停止运行
    }
    var json = JSON.parse(content); // 返回的是json数据
    var allCodes = json.data;
    for(var i=0;i<allCodes.length;i++){
      var cityName = allCodes[i].cityName;
      if(cityName.indexOf(fromCity)!=-1){
        fromCityCode = allCodes[i].cityCode;
      }
      if(cityName.indexOf(toCity)!=-1){
        toCityCode = allCodes[i].cityCode;
      }
    } 
    if(fromCityCode === ""){
      system.exit("设置的出发城市错误，没有在途牛上找到该城市");
    }
    if(toCityCode === ""){
      system.exit("设置的到达城市错误，没有在途牛上找到该城市");
    }
  
    // 根据取到的城市码，可以得到实际的机票内容页url，并添加到待爬队列中
    var contentUrl = "http://www.tuniu.com/flight/city_"+fromCityCode+"_"+toCityCode+"/?start="+date;
    site.addUrl(contentUrl);
};

configs.onProcessContentPage = function(page, content, site){
    return false;// 不再从内容页发现新的链接
};

configs.afterExtractField = function(fieldName, data, page){
    if(data===null || data==="" || typeof(data)=="undefined"){
      return data;
    }
    if(fieldName=="flights.flight_number"){
      data = data.replace("&nbsp;","");
    }else if(fieldName=="flights.dep_time"){
      return date+" "+data;
    }else if(fieldName=="flights.arv_time"){
      if(data.indexOf('<i class="J_AnotherDay')!=-1){
       // 如果到达时间有+1标志，返回第二天
       data = extract(data, "//text()");
       return getNextDay(date)+" "+data; 
      }else{
      	return date+" "+data;
      }
    }
    return data;
};

/*
  得到date后一天的时间
*/
function getNextDay(date){
    var timestamp = Date.parse(date);
    timestamp = timestamp + 1000*60*60*24;
    date = new Date(timestamp);
    return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
}

var crawler = new Crawler(configs);
crawler.start();
