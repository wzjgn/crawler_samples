var configs = {
  domains: ["www.qiushibaike.com"],
  scanUrls: ["http://www.qiushibaike.com/"],
  contentUrlRegex: "http://www\\.qiushibaike\\.com/article/\\d+",
  helperUrlRegexes: ["http://www\\.qiushibaike\\.com/(8hr/page/\\d+\\?s=\\d+)?"],
  enableJS: false,
  interval: 3000,
  fields: [
    {
        name: "article_title",
        selector: "//*[@id='single-next-link']//div[contains(@class,'content')]/text()[1]",
        required: true
    },
    {
       name: "article_content",
       selector: "//*[@id='single-next-link']",
       required: true
    },
    {
       name: "article_author",
       selector: "//div[contains(@class,'author')]//h2"
    },
    {
       name: "article_publish_time",
       selector: "//div[contains(@class,'author')]//h2"
    }
  ]
};

configs.afterExtractField = function(fieldName, data, page){
    if(fieldName=="article_title"){
      if(data.length>10){
        data=data.substring(0,10)+"...";
      }
    }else if(fieldName=="article_publish_time"){
      data = Date.parse(new Date())/1000+"";
    }
  return data;
};
  
var crawler = new Crawler(configs);
crawler.start();
