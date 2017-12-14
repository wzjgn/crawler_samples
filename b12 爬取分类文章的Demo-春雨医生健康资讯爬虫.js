/*
    神箭手云_爬虫开发示例代码
    支持原生JavaScript
    开发教程：http://docs.shenjian.io/develop/summary/summary.html
    请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
    
    按分类爬取春雨医生网的健康资讯：https://www.chunyuyisheng.com/pc/health_news/?channel_id=21
    为了保证只爬取指定分类的文章，在页面下载完成后的回调函数里关闭自动链接发现，手动添加指定分类的内容页和列表页url到待爬队列中
*/

// 输入要爬取的分类url，可以输入多个 
var channelUrls = ["https://www.chunyuyisheng.com/pc/health_news/?channel_id=21", "https://www.chunyuyisheng.com/pc/health_news/?channel_id=35"];//@input(channelUrls, 要爬取的资讯分类首页url)

// 定义抽取数据的规则 和 列表页、内容页url正则
var configs = {
  domains: ["chunyuyisheng.com"],
  scanUrls: [],
  contentUrlRegexes: [/https:\/\/www\.chunyuyisheng\.com\/pc\/article\/\d+.*/],
  helperUrlRegexes: [/https:\/\/www\.chunyuyisheng\.com\/pc\/health_news\/\?channel_id=\d+.*/, /https:\/\/www\.chunyuyisheng\.com\/pc\/health_news\/\#channel/],
  fields: [
    {
      name: "article_title",
      alias: "文章标题", 
      selector : "//h1[contains(@class,'news-detail-title')]",
      required: true 
    },
    {
      name: "article_abstract",
      alias: "文章摘要",
      selector: "//p[contains(@class,'desc')]"
    },
    {
      name: "article_content",
      alias: "文章内容",
      selector: "//div[contains(@class,'news-content')]"
    },
    {
      name: "article_publish_time",
      alias: "发布时间",
      selector: "//p[contains(@class,'time')]"
    }, 
    {
      name: "article_category",
      alias: "文章分类",
      selector: "//ul[contains(@class,'bread-crumb')]//li[position()>1 and contains(@class,'item')]/a"
    }
  ]
};

configs.initCrawl = function (site) {
  // 分别判断输入的资讯分类首页链接是否正确，正确的话添加到入口页url列表中
  for(var i in channelUrls){
    if(!/https:\/\/www\.chunyuyisheng\.com\/pc\/health_news/.exec(channelUrls[i])){
      console.log("输入的资讯分类首页url："+channelUrls[i]+"错误！");
    }else{
      site.addScanUrl(channelUrls[i]);
    }
  }
};

// 下载完入口页内容的回调
configs.onProcessScanPage = function (page, content, site) {
  // 返回false表示不自动从入口页中发现新链接。因为本代码中入口页也属于列表页，所以在列表页回调中统一处理
  return false;
};

// 下载完列表页内容的回调
configs.onProcessHelperPage = function (page, content, site) {
  // 从列表页中抽取内容页url，添加到待爬url队列中
  var contentUrls = extractList(content, "//ul[contains(@class,'health-news-list')]//a[contains(@class,'title')]/@href");
  for(var i in contentUrls){
    site.addUrl(contentUrls[i]);
  }
  // 从列表页中抽取下一页列表页url，添加到待爬url队列中
  var nextPageUrl = extract(content, "//a[contains(text()[1],'下一页') and not(contains(@class,'disabled'))]/@href");console.log(nextPageUrl);
  if(nextPageUrl){
    site.addUrl(nextPageUrl);
  }
  // 返回false表示不自动从列表页中发现新链接
  return false;
};

// 下载完内容页内容的回调
configs.onProcessContentPage = function (page, content, site) {
  // 返回false表示不自动从内容页中发现新链接
  return false;
};

//启动爬虫
var crawler = new Crawler(configs);
crawler.start();
