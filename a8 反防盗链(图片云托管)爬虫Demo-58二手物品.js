/*
  爬取58上的二手物品信息（转转）
  该demo主要讲解如何在神箭手上进行图片云托管，图片云托管可以解决有些网站防盗链导致爬取的图片链接失效的问题；
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
  
  托管图片的步骤是：
  1、启动爬虫之前，需要在爬虫设置中勾选"图片云托管"，并且设置托管的位置
  2、爬取结果里，后缀名是.jpg/.png/.gif/.jpeg的field，或者img标签里的图片，神箭手在爬取过程中会默认进行下载托管
  3、后缀名非以上情况，或者数组里的图片链接，默认不会下载托管，需要在代码中调用内置函数 hostFile （参考以下代码的afterExtractField回调函数）
*/

var cities = ["北京"];//@tags(cities, 请输入要爬取的城市，分别爬取58上这些城市的二手物品信息)

var configs = {
    domains: ["58.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/zhuanzhuan\.58\.com\/detail\/\d+z\.shtml.*/],
    helperUrlRegexes: [/http:\/\/.+\.58\.com\/sale\/.*/],
    enableProxy: true, // 58有反爬，建议使用企业代理ip(不设置此项也可以，在运行爬虫或者测试爬虫之前，选择代理ip种类即可)
    fields: [
        {
            name: "title",
            alias: "标题",
            selector: "//title",
            required: true 
        },
        {
            name: "price",
            alias: "物品价格",
            selector: "string(//span[contains(@class,'price_now')])"
        },
        {
            name: "description",
            alias: "物品描述",
            selector: "//div[contains(@class,'baby_kuang')]//p"
        },
        {
            name: "location",
            alias: "区域",
            selector: "//span[contains(text()[1],'区域')]/i"
        },
        {
            name: "views_count",
            alias: "浏览人数",
            selector: "//span[contains(@class,'look_time')]"
        },
        {
            name: "wants_count",
            alias: "想买人数",
            selector: "//span[contains(@class,'want_person')]"
        },
        {
            name: "photos",
            alias: "物品照片",
            selector: "//div[contains(@class,'boby_pic')]//img/@src",
            repeated: true
        },
        {
            name: "contact",
            alias: "联系人",
            selector: "//div[contains(@class,'personal')]//p[contains(@class,'personal_name')]"
        },
        {
            name: "contact_thumb",
            alias: "联系人头像",
            selector: "//div[contains(@class,'personal')]//div[contains(@class,'personal_touxiang')]//img/@src"
        }
    ]
};

configs.isAntiSpider = function (url, content, page) {
   if (content.indexOf("访问过于平频繁，本次访问需要输入验证码") !== -1) {
        return true;
    }
    return false;
};

configs.beforeCrawl = function(site){ 
    var cityContent = site.requestUrl("http://www.58.com/changecity.html",{enableJS : true});
    var cityUrls = [];
    if(cities.length<=0){
      cityUrls = extractList(cityContent,"//a/@href");
      for(var i=0;i<cityUrls.length;i++){
        if(/http:\/\/\w+\.58.com\//.test(cityUrls[i])){
          site.addScanUrl(cityUrls[i]+"/sale");
        }
      }
    }else{
      for(var index = 0;index<cities.length;index++){
        var url = extract(cityContent,"//a[text()='"+cities[index]+"']/@href");
        if(url){
          site.addScanUrl(url+"/sale");
        }
      }
    }
};

configs.afterExtractField = function (fieldName, data, page, site) {
    if(!data){
      return data;
    }
    if(fieldName=="title"){
      var index = data.lastIndexOf("_");
      data = data.substring(0,index);
    }else if(fieldName == "contact_thumb"){
      // contact_thumb 不是以jpg，png，gif和jpeg标准图片后缀名结尾的；
      // 所以调用hostFile表示该项数据是图片类型，在爬取过程中可以被当作图片托管
      // hostFile也可以用来设置托管其他类型的文件，比如视频、文档等，具体请查看神箭手开发文档中对这一函数的解释
      data = hostFile(data, FileType.IMAGE);
    }else if(fieldName == "photos"){
      // 数组里的图片链接默认不可被托管；
      // 需要对数组里的每个链接调用hostFile
      for(var i=0;i<data.length;i++){
        data[i] = hostFile(data[i], FileType.IMAGE);
      }
    }else if(fieldName=="location"){
      var skip = true;
      // 判断爬取的位置中是否包含设置的爬取城市
      for(var j=0;j<cities.length;j++){
        if(data.indexOf(cities[j])>-1){
          skip = false;
          break;
        }
      }
      if(skip){
        // 如果不包含设置的爬取城市，过滤掉该条数据不保存
        page.skip();
      }
    }else if(fieldName=="views_count" || fieldName=="wants_count"){
      var matches = /\d+/.exec(data);
      if(matches){
        return matches[0];
      }
    }else if(fieldName=="description"){
      return htmlEntityDecode(data);
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
