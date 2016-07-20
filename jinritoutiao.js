/*使用javascript编写的爬虫源码，用于爬取今日头条的新闻。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

var keyword ="社会,娱乐"; //@input(keyword, 频道名称,多个以英文逗号分隔)
var configs = {
    domains: ["toutiao.com"],
    scanUrls: ["http://toutiao.com/articles_news_society/"],
    contentUrlRegexes: ["http://toutiao.com/[a-zA-Z]{0,}\\d+/","http://toutiao.com/\\w+/\\d+/"],//
    helperUrlRegexes: ["http://toutiao.com/articles_\\w+/","http://toutiao.com/articles_\\w+/p\\d+/"], //可留空
    fields: [
        {
            name: "article_title",
            selector: "//h1[@class='title']", 
            required: true 
        },
        {
            name: "article_content",
            selector: "//div[@class=\"article-content\"]",
            required: true 
        },
        {
        			name:"article_topics",
        			selector:"//a[@class=\"tag-link\"]",
        			repeated: true
      		},
    			 {
        			name: "article_author",
        			selector: "//span[@class=\"Pgc_name\"]/a/text()|//span[@class=\"src\"]",
        			required: false
    				},
    				{
        			name: "article_publish_time",
        			selector: "//span[@class=\"time\"]",
        			required: false
    				},
         {
            name: "article_categories",
            selector: "//a[@ga_event=\"click_channel\"]",
            repeated: true
         }     
    ]
};
configs.onProcessScanPage = function(page, content, site) {    
    var categorys=extractList(content, "//li[@data-node=\"category\"]");    
    for(var i = 0; i < categorys.length; i++)
    {
        var category=categorys[i];
        category=exclude(category, "//a/span");
        var text1=extract(category, "//a/text()");
        var inputcategorys=keyword.split(",");
     for (var j = 0; j < inputcategorys.length; j++) {
          var querykey=inputcategorys[j];
          if(text1.indexOf(querykey)>-1)
          {
             var new_url =extract(category, "//a/@href");
             site.addUrl(new_url);
        	 }
     }
    }
    
    if(keyword.indexOf("社会")>-1)
    {
        return true;
    }
    return false;
};

configs.onProcessHelperPage = function(page, content, site) {
  	var nextpageurl=extract(content, "//a[text()=\"下一页\"]/@href");
   if(nextpageurl!==null&&nextpageurl!==""&&nextpageurl!==undefined){ 
         site.addUrl(nextpageurl);
   }   
   var urls=extractList(content,"//a[@ga_event=\"feed_title\"]/@href");
   for (var i = 0; i < urls.length; i++) {
      var url = urls[i];
      site.addUrl(url);
  	}
   return false;
};

configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "article_publish_time") {
        var timestamp = Date.parse(data);
        return isNaN(timestamp) ? "0" : timestamp/1000 + "";
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
