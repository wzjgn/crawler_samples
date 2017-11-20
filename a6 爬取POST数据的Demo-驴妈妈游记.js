/*
  爬取驴妈妈游记（http://www.lvmama.com/trip/list.html）。
  列表页是post请求，所以在回调函数中将下一页列表页包括post参数一起添加到待爬队列中
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
*/
var configs = {
    domains: ["www.lvmama.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/www\.lvmama\.com\/trip\/show\/\d+/],
    helperUrlRegexes: [/http:\/\/www\.lvmama\.com\/trip\/home\/ajaxGetTripList/], 
    fields: [
        {
            name: "article_title",
            alias: "文章标题",
            selector: "//h1[contains(@class,'eh-text')]/@title",
            required: true 
        },
        {
            name: "article_content",
            alias: "文章正文",
            selector: "//div[contains(@class,'ebm-article')]"
    			},
        {
            name: "article_author",
            alias: "作者",
            selector: "//a[contains(@class,'eh-author')]/text()"
    			},
        {
            name: "article_avatar",
            alias: "作者头像",
            selector: "//img[contains(@class,'ehh-img')]/@src"
    			},
        {
            name: "article_publish_time",
            alias: "发布时间",
            selector: "//p[contains(@class,'eh-sundry')]"
    			},
        {
            name: "article_view_count",
            alias: "浏览数",
            selector: "//p[contains(@class,'eh-sundry')]"
    			},
        {
            name: "article_agree_count",
            alias: "点赞数",
            selector: "//div[contains(@class,'eh-function')]//em[contains(text()[1],'赞')]/following-sibling::b"
    			},
        {
            name: "article_comments_count",
            alias: "评论数",
            selector: "//div[contains(@class,'eh-function')]//em[contains(text()[1],'评论')]/following-sibling::b"
    			}
    ]
};

configs.beforeCrawl = function(site){
    var helperUrl = "http://www.lvmama.com/trip/home/ajaxGetTripList";
    var options = {
      method: "post", // 列表页是post请求
      headers: {
        referer: "http://www.lvmama.com/trip/list.html"
      },
      data: { // post请求的参数
        page: 1
      }
    };
    // 将第一页列表页（包括post请求的参数）添加到待爬队列中
    site.addUrl(helperUrl, options);
};

configs.onProcessScanPage = function(page, content, site){
    return false;
};

configs.onProcessHelperPage = function(page, content, site){
    var nextPageUrl = extract(content, "//div[contains(@class,'wy_state_page')]//a[contains(@class,'next')]/@href");
    if(nextPageUrl===null || nextPageUrl==="" || typeof(nextPageUrl)=="undefined"){
      return false; // 如果没有下一页就不添加新的列表页到待爬队列
    }
    var currentPage = page.request.data.page; // 从当前列表页请求中获取参数
    var nextPage = currentPage+1; 
    var helperUrl = "http://www.lvmama.com/trip/home/ajaxGetTripList";
    var options = {
      method: "post",
      headers: {
        referer: "http://www.lvmama.com/trip/list.html"
      },
      data: { 
        page: nextPage
      },
      reserve: true // 列表页的url是一样的，神箭手默认不会将重复的url添加至待爬队列。所以要设置reserve为true，表示强制将此url插入待爬队列中
    };
    // 将下一页列表页（包括post请求的参数）添加到待爬队列中
    site.addUrl(helperUrl, options);
    return true; // 需要自动发现内容页，所以返回true
};

configs.onProcessContentPage = function(page, content, site){
    return false;
};

configs.afterExtractField = function(fieldName, data, page){
    if(data===null || data==="" || typeof(data)=="undefined"){
      return data;
    }
    if(fieldName=="article_publish_time"){
      // 从数据中抽取发布时间并转换成时间戳返回
      var timeMatches = /于(.+)发布/.exec(data);
      if(timeMatches){
        data = timeMatches[1];
        var timestamp = Date.parse(data);
        return isNaN(timestamp) ? "0" : timestamp/1000 + "";
      }
    }else if(fieldName=="article_view_count"){
      // 从数据中抽取出浏览的次数返回
      var countMatches = /浏览(\d+)次/.exec(data);
      if(countMatches){
        return countMatches[1];
      }
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
