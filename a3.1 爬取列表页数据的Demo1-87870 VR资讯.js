/*
  爬取87870 VR资讯（http://news.87870.com/xinwen-1-01-1.html）的文章，文章的标签信息只在文章列表页里，在内容页里是抽取不到的。
  所以该Demo中我们使用神箭手提供的 UrlContext 附加数据 将列表页需要的数据附加到内容页中，再进行统一抽取。
*/

var configs = {
    domains: ["news.87870.com"],
    scanUrls: ["http://news.87870.com/ajax/ashx/news/2016NewsList.ashx?action=newslist&cid=01&sort=1&pageindex=1&pagesize=8"],
    contentUrlRegexes: [/http:\/\/news\.87870\.com\/xinwennr-\d+\.html/],
    helperUrlRegexes: [/http:\/\/news\.87870\.com\/ajax\/ashx\/news\/2016NewsList\.ashx\?action=newslist&cid=01&sort=1&pageindex=\d+&pagesize=8/],
    fields: [
        {
            name: "article_title",
            alias: "文章标题",
            selector: "//div[contains(@class,'content-wrap')]/h1",
            required: true
        },
        {
            name: "article_summary",
            alias: "文章导读",
            selector: "//div[contains(@class,'info_guide')]"
        },
        {
            name: "article_content",
            alias: "文章正文",
            selector: "//div[contains(@class,'content-wrap')]/div[contains(@class,'content')]"
        },
        {
            name: "article_publish_time",
            alias: "发布日期",
            selector: "//span[contains(@class,'pub-time')]"
        },
        {
            name: "article_author",
            alias: "作者",
            selector: "//div[contains(@class,'author-info')]//p[contains(@class,'tit')]/text()"
        },
        {
            name: "article_tags",
            alias: "标签",
            // 3、从之前添加到内容页中的附加数据中抽取文章标签
            sourceType: SourceType.UrlContext, // 将来源设置为UrlContext
            selector: "//div[@id='sjs-tags']"
        }
    ]
};

configs.onProcessScanPage = function(page, content, site){
    return false;
};

configs.onProcessHelperPage = function(page, content, site){
    var matches = /pageindex=(\d+)/.exec(page.url);
    if(!matches){
      return false;
    }
    var json = JSON.parse(content);
    var list = json.list;
    if(list===null || list==="" || typeof(list)=="undefined"){
      return false;
    }
    for(var i=0;i<list.length;i++){
      // 1、获取列表页中每篇文章的tags数据
      var tags = list[i].tags;
      var commonID = list[i].commonID;
      var options = {
        method: "GET",
        contextData: '<div id="sjs-tags">'+tags+'</div>' // 将tags数据添加到options的contextData中
      };
      // 2、将options附加到内容页中，再将内容页链接添加到待爬队列中
      site.addUrl("http://news.87870.com/xinwennr-"+commonID+".html", options);
    }
  
    var nextPage = parseInt(matches[1])+1;
    site.addUrl("http://news.87870.com/ajax/ashx/news/2016NewsList.ashx?action=newslist&cid=01&sort=1&pageindex="+nextPage+"&pagesize=8");
    return false;
};

configs.onProcessContentPage = function(page, content, site){
    return false;
};

configs.afterExtractField = function(fieldName, data, page) {
    if(data===null || data==="" || typeof(data)=="undefined"){
      if(fieldName=="article_author"){
        data = extract(page.raw, "//span[contains(@class,'pub-from')]/a/text()"); // 如果没有作者，就抽取来源作为文章作者
      }
      return data;
    }
    if (fieldName == "article_publish_time") {
      var timestamp = parseDateTime(data.trim());
      return isNaN(timestamp) ? "0" : timestamp/1000 + "";
    }else if(fieldName == "article_summary"){
      return exclude(data, "//span[contains(@class,'tag')]"); // 从抽取的导读内容中去掉不需要的部分数据
    } 
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
