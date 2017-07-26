var configs = {
  domains: ["qiushibaike.com"],// 网站域名，设置域名后只处理这些域名下的网页
  scanUrls: ["https://www.qiushibaike.com/"],// 入口页链接，分别从这些链接开始爬取
  contentUrlRegexes: [/https?:\/\/www\.qiushibaike\.com\/article\/\d+/],// 内容页url的正则，符合这些正则的页面会被当作内容页处理
  helperUrlRegexes: [/https?:\/\/www\.qiushibaike\.com\/(8hr\/page\/\d+.*)?/],// 列表页url的正则，符合这些正则的页面会被当作列表页处理
  fields: [  // 从内容页中抽取需要的数据  
    {
        name: "article_title",
        alias: "文章标题",
        selector: "//*[@id='single-next-link']//div[contains(@class,'content')]/text()[1]",// 默认使用xpath抽取
        required: true // required为true表示该项数据不能为空
    },
    {
       name: "article_content",
       alias: "文章内容",
       selector: "//*[@id='single-next-link']",
       required: true
    },
    {
       name: "article_author",
       alias: "作者",
       selector: "//div[contains(@class,'author')]//h2"
    },
    {
       name: "article_publish_time",
       alias: "文章发布日期",
       selector: "//div[contains(@class,'author')]//h2"
    }
  ]
};

configs.isAntiSpider = function (url, content, page) {
    if(content && content.indexOf("您的请求太过频繁，请稍后再试")>-1){
        return true;
    }
    return false;
};

/*
  回调函数afterExtractField：对抽取出来的数据进行处理
*/
configs.afterExtractField = function(fieldName, data, page){
    if(fieldName=="article_title"){
      if(data.length>10){
        data=data.substring(0,10)+"..."; // 因为糗事百科的文章没有标题，所以取文章的前10个字作为标题
      }
    }else if(fieldName=="article_publish_time"){
      data = Date.parse(new Date())/1000+""; // 发布日期转换成时间戳
      // 使用神箭手进行数据发布时，默认处理的时间戳是10位。如非特殊，请转换成10位时间戳
    }
  return data;
};
  
var crawler = new Crawler(configs);
crawler.start();
