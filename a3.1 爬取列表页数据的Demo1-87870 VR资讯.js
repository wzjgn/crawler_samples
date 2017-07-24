/*
  爬取87870 VR资讯（http://hy.87870.com/news/list-0-0-1.html）的文章，要爬取的文章标签信息在文章列表页里。
  所以该Demo中我们使用神箭手提供的 UrlContext 附加数据 将列表页需要的数据附加到内容页中，再进行统一抽取。
*/

var configs = {
    domains: ["hy.87870.com"],
    scanUrls: ["http://hy.87870.com/news/list-0-0-1.html"],
    contentUrlRegexes: [/http:\/\/hy\.87870\.com\/news\/details-\d+\.html/],
    helperUrlRegexes: [/http:\/\/hy\.87870\.com\/news\/list-0-0-\d+\.html/],
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
            selector: "//span[contains(@class,'pub-time')]",
            type: "date"
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
            sourceType: SourceType.UrlContext, // 将抽取的数据来源设置为UrlContext
            selector: "//div[@id='sjs-tags']//a/text()",
            repeated : true
        }
    ]
};

configs.onProcessScanPage = function(page, content, site){
    return false;
};

configs.onProcessHelperPage = function(page, content, site){
    var contentList = extractList(content, "//ul[contains(@class,'news-list')]/li");
    if(!contentList){
      return false;
    }
    for(var i=0;i<contentList.length;i++){
      // 1、获取列表页中每篇文章的tags数据
      var tags = extract(contentList[i], "//span[contains(@class,'keyword')]");
      var contentUrl = extract(contentList[i], "//a[contains(@class,'news-tit')]/@href");
      var options = {
        method: "GET",
        contextData: '<div id="sjs-tags">'+tags+'</div>' // 将tags数据添加到options的contextData中
      };
      // 2、将options附加到内容页中，再将内容页链接添加到待爬队列中
      site.addUrl(contentUrl, options);
    }
    // 判断是否有下一页列表页以及将下一页列表页链接添加到待爬队列中
    var nextPage = extract(content, "//a[contains(@class,'next')]/@href");
    if(nextPage){
      site.addUrl(nextPage);
    }
    
    return false; //不让爬虫自动发现新的待爬链接
};

configs.onProcessContentPage = function(page, content, site){
    return false;
};

configs.afterExtractField = function(fieldName, data, page) {
    if(!data){
      if(fieldName=="article_author"){
        data = extract(page.raw, "//span[contains(@class,'pub-from')]/following-sibling::text()"); // 如果没有作者，就抽取来源作为文章作者
      }
      return data;
    }
    if (fieldName == "article_publish_time") {
      var timestamp = parseDateTime(data.trim());
      return isNaN(timestamp) ? "0" : timestamp/1000 + "";// 时间转换为时间戳格式，方便自动发布文章到网站
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
