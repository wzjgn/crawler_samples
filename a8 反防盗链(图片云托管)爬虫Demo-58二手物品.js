/*
  爬取58上的二手物品信息（转转）
  该demo主要讲解如何在神箭手上进行图片云托管，图片云托管可以解决有些网站防盗链导致爬取的图片链接失效的问题；
  
  托管图片的步骤是：
  1、启动爬虫之前，需要在爬虫设置中勾选"图片云托管"，并且设置托管的位置
  2、爬取结果里，后缀名是.jpg/.png/.gif/.jpeg的field，或者img标签里的图片，神箭手在爬取过程中会默认进行下载托管
  3、后缀名非以上情况，或者数组里的图片链接，默认不会下载托管，需要在代码中调用内置函数 hostFile （参考以下代码的afterExtractField回调函数）
*/

var cities = ["北京"];//@tags(cities, 请输入要爬取的城市，分别爬取58上这些城市的二手物品信息)

var configs = {
    domains: ["58.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/m\.zhuanzhuan\.58\.com\/detail\/\d+z\.shtml.*/],
    helperUrlRegexes: [/http:\/\/m\.58\.com\/\w+\/\w+\/(\d+\/)?(pn\d+\/)?.*/],
    userAgent: UserAgent.Android,  // 从移动端网页爬取，可以设置不同的UA
    enableProxy: true, // 58有反爬，建议使用企业代理ip
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
            selector: "//div[contains(@class,'price')]/span/strong"
        },
        {
            name: "description",
            alias: "物品描述",
            selector: "//div[contains(@class,'miaoshu')]"
        },
        {
            name: "locations",
            alias: "位置",
            selector: "//div[contains(@class,'weizhi')]/span",
            repeated: true
        },
        {
            name: "views_count",
            alias: "浏览人数",
            selector: "//div[contains(@class,'liulan')]"
        },
        {
            name: "photos",
            alias: "物品照片",
            selector: "//div[contains(@class,'image_area')]//li/img/@ref",
            repeated: true
        },
        {
            name: "contact",
            alias: "联系人",
            selector: "//div[contains(@class,'personal_info')]//span[contains(@class,'nickName')]"
        },
        {
            name: "contact_thumb",
            alias: "联系人头像",
            selector: "//div[contains(@class,'personal_info')]//img[contains(@class,'touxiang')]/@src"
        }
    ]
};

configs.isAntiSpider = function(url, content) {
    if (content.indexOf("访问过于平频繁，本次访问需要输入验证码") !== -1) {
        return true;
    }
    return false;
};

configs.beforeCrawl = function(site){ 
    var cityContent = site.requestUrl("http://m.58.com/city.html");
    var cityUrls = [];
    if(cities.length<=0){
      cityUrls = extractList(cityContent,"//ul[contains(@class,'city_lst') and not(contains(@class,'hot'))]/li/a/@href");
      for(var i=0;i<cityUrls.length;i++){
        site.addScanUrl(cityUrls[i]+"sale.shtml");
      }
    }else{
      for(var index = 0;index<cities.length;index++){
        var url = extract(cityContent,"//a[text()='"+cities[index]+"']/@href");
        if(url!==null && typeof(url)!="undefined" && url!==""){
          site.addScanUrl(url+"sale.shtml");
        }
      }
    }
};

configs.afterExtractField = function(fieldName, data, page){
    if(data===null || data==="" || typeof(data)=="undefined"){
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
    }else if(fieldName=="locations"){
      var skip = true;
      // 判断爬取的位置中是否包含设置的爬取城市
      for(var p = 0;p<data.length;p++){
        for(var j=0;j<cities.length;j++){
          if(cities[j]==data[p]){
            skip = false;
            break;
          }
        }
        if(!skip){
          break;
        }
      }
      if(skip){
        // 如果不包含设置的爬取城市，过滤掉该条数据不保存
        page.skip();
      }
    }else if(fieldName=="views_count"){
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
