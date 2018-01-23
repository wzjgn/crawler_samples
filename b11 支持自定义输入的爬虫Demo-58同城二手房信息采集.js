/* 
  设置自定义输入，根据爬虫设置里输入的城市名来爬取这些城市下的二手房信息
  自定义输入的详细教程请查阅：http://docs.shenjian.io/develop/extensions/templated.html
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
*/
var cities = ["北京"];//@tags(cities,58上的城市名,分别爬取这些城市的二手房信息（如不填写表示爬取全国，如爬取全国爬虫初始化时间较长请耐心等待）)

var configs = {
    domains: ["58.com"],
    scanUrls: [], // 入口页链接先设置为空，因为需要在下面的回调函数中根据自定义输入添加不同的入口页链接
    contentUrlRegexes: [/https?:\/\/.+\.58\.com\/ershoufang\/\d+x\.shtml.*/], //内容页链接正则表达式
    helperUrlRegexes: [/https?:\/\/.+\.58\.com\/.*ershoufang\/pn\d+.*/], //列表页链接正则表达式
    timeout : 10000, //每个请求的超时时间，不宜设置过长否则爬取速度较慢
    fields: [ // 从内容页中抽取的字段
        {
            name: "info_id",
            alias: "信息ID",
            selectorType : SelectorType.Regex,
            selector: /"infoid"\s*:\s*(\d+)/, 
            required: true,
            primaryKey : true
        },
        {
            name: "title",
            alias: "标题",
            selector: "//div[contains(@class,'house-title')]/h1//text()",
            required: true
        },
        {
            name: "city",
            alias: "城市",
            selector: "//div[contains(@class,'nav-top-bar')]/a[1]/text()"
        },
        {
            name: "regions",
            alias: "区域",
            selector: "//div[contains(@class,'nav-top-bar')]/a[position()>1]/text()",
            repeated : true
        },
        {
            name: "latitude",
            alias: "纬度",
            selectorType : SelectorType.Regex,
            selector: /"lat"\s*:\s*(.+?),/
        },
        {
            name: "longitude",
            alias: "经度",
            selectorType : SelectorType.Regex,
            selector: /"lon"\s*:\s*(.+?),/
        },
        {
            name: "tags",
            alias: "标签",
            selector: "//p[contains(@class,'house-update-info')]/span[not(contains(@class,'up'))]/text()",
            repeated : true
        },
        {
            name:"price",
            alias: "价格",
            selector: "//p[contains(@class,'house-basic-item1')]//span[contains(@class,'price')]"
        },
        {
            name:"unit_price",
            alias: "单价",
            selector: "//p[contains(@class,'house-basic-item1')]//span[contains(@class,'unit')]"
        },
        {
            name:"room",
            alias: "户型",
            selector: "//p[contains(@class,'room')]//span[contains(@class,'main')]"
        },
        {
            name:"size",
            alias: "面积",
            selector: "//p[contains(@class,'area')]//span[contains(@class,'main')]"
        },
        {
            name:"toward",
            alias: "朝向",
            selector: "//p[contains(@class,'toward')]//span[contains(@class,'main')]"
        },
        {
            name:"floor",
            alias: "楼层",
            selector: "//p[contains(@class,'room')]//span[contains(@class,'sub')]"
        },
        {
            name:"decoration",
            alias: "装修",
            selector: "//p[contains(@class,'area')]//span[contains(@class,'sub')]"
        },
        {
            name:"year",
            alias: "建筑年代",
            selector: "//p[contains(@class,'toward')]//span[contains(@class,'sub')]"
        },
        {
            name:"community",
            alias: "小区",
            selector: "//ul[contains(@class,'house-basic-item3')]//span[contains(text()[1],'小区')]/following-sibling::span/a[contains(@href,'/xiaoqu/')]/text()"
        },
        {
            name:"location",
            alias: "位置",
            selector: "//ul[contains(@class,'house-basic-item3')]//span[contains(text()[1],'位置')]/following-sibling::span/a[contains(@href,'/xiaoqu/')]/text()"
        },
        {
            name:"photos",
            alias: "图片",
            selector: "//div[contains(@class,'basic-pic-list ')]//li//img/@data-value",
            repeated : true
        },
        {
            name:"desc",
            alias: "描述",
            selector: "//div[@id='generalDesc']//div[contains(@class,'general-item-wrap')]"
        },
        {
            name: "publish_time",
            alias: "发布时间",
            selector: "//p[contains(@class,'house-update-info')]/span[(contains(@class,'up'))][1]/text()"
        }
    ]
};

/*
  在爬取开始前，先根据设置的城市名获取每个城市的入口页链接（也就是二手房列表的第一页）。
  并通过addScanUrl添加到入口页待爬队列中
*/
configs.initCrawl = function (site) {
    var options = {
      headers : {
        "User-Agent" : "Mozilla/6.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/8.0 Mobile/10A5376e Safari/8536.25"
      }
    };
    var cityContent = site.requestUrl("http://m.58.com/city.html", options);
    var cs = [];
    if(cities.length==0){
      cs = extractList(cityContent, "//ul[contains(@class,'city_lst') and not(contains(@class,'hot'))]//a/@href");      
    }else{
      for(var index=0;index<cities.length;index++){
        var url = extract(cityContent, "//ul[contains(@class,'city_lst') and not(contains(@class,'hot'))]//a[text()[1]='"+cities[index]+"']/@href");
        if(!url){
          console.log("未在58上发现该城市："+cities[index]);
        }else{
          cs.push(url);
        }
      }
    }
    for(var i=0;i<cs.length;i++){
      var citypinyin = /m\.58\.com\/(.+?)\//.exec(cs[i]);
      if(citypinyin){
        site.addScanUrl("http://"+citypinyin[1]+".58.com/ershoufang/pn1");
      }
    }
};

/*
  入口页下载完成后，从中获取该城市不同区域的二手房列表第一页链接
  并通过addUrl添加到待爬队列中
  因为已经手动添加了需要的链接，所以return false不让程序再自动发现链接了
*/
configs.onProcessScanPage = function (page, content, site) {
    var regions = extractList(content, "//div[@id='qySelectFirst']/a[not(contains(text()[1],'不限'))]/@href");
    for(var i=0;i<regions.length;i++){
      site.addUrl(regions[i]+"pn1");
    }
    return false;// false： 表示程序将不自动发现链接并添加到待爬队列；true：表示程序会自动发布并添加链接
};

/*
  每个列表页下载完成后，从中获取下一页列表链接和内容页链接
  并通过addUrl添加到待爬队列中
  因为已经手动添加了需要的链接，所以return false不让程序再自动发现链接了
*/
configs.onProcessHelperPage = function (page, content, site) {
    var matches = /58\.com\/ershoufang/.exec(page.url);
    if(matches){
      var regions = extractList(content, "//div[@id='qySelectFirst']/a[not(contains(text()[1],'不限'))]/@href");
      if(regions.length>0){
        return false;//有区域的全部页面不发现链接，只从区域页面中发现链接，避免处理重复，提高爬取速度
      }
    }
      
    var urls = extractList(content, "//h2[contains(@class,'title')]/a/@href");
    for(var i=0;i<urls.length;i++){
       site.addUrl(urls[i]);
    }
    var nextPage = extract(content, "//span[contains(text()[1],'下一页')]/../@href");
    if(nextPage){
       site.addUrl(nextPage);
    }
    return false;
};

configs.onProcessContentPage = function (page, content, site) {   
    return false;// 内容页都不自动发现链接，提高爬取速度
};

/*
  对爬取的原始数据进行再处理
*/
configs.afterExtractField = function (fieldName, data, page, site) {
  if(!data){
    return data;
  }
  if(fieldName == "city"){
    return data.replace("58同城","");
  }else if(fieldName == "regions"){
    for(var i in data){
      data[i] = data[i].replace("二手房","");
    }
  }else if(fieldName == "price"){
    data = data.replace(/<\/?.+?>/g,"");
    return data;
  }else if(fieldName == "unit_price"){
    data = data.replace(/\s+/g,"").replace("说","");
    return data;
  }else if(fieldName == "photos"){
    // 如果是图片数组，需要对每个元素调用hostFile，标志该数组内的每个元素都是可托管的。
    // 那么在爬虫设置中开启托管后，将会对该数组内的元素都自动进行托管
    for(var d in data){
      if(data[d].indexOf("?")>-1){
        data[d] = data[d].substring(0,data[d].indexOf("?"));
      }
      data[d] = hostFile(data[d], FileType.IMAGE);
    }
    return data;
  }
  return data;
};

/*
  启动爬虫
*/
var crawler = new Crawler(configs);
crawler.start();
