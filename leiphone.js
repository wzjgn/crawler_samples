/*使用javascript编写的爬虫源码，用于爬取雷锋网上所有关于"山寨手机"的文章。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/
var configs = {
    domains: ["leiphone.com"],
    scanUrls: ["http://www.leiphone.com/search?s=%E5%B1%B1%E5%AF%A8%E6%89%8B%E6%9C%BA&site=article"],
    contentUrlRegexes: ["http://www\\.leiphone\\.com/news/\\d+/.+\\.html"],
    helperUrlRegexes: ["http://www\\.leiphone\\.com/search\\?s=%E5%B1%B1%E5%AF%A8%E6%89%8B%E6%9C%BA&site=article(&page=\\d+)?"], 
    fields: [
    {
        // 抽取内容页的文章标题
        name: "article_title",
        selector: "//div[contains(@class,'pageTop')]/h1",
        required: true
    },
    {
        // 抽取内容页的文章内容
        name: "article_content",
        selector: "//div[contains(@class,'pageCont')]",
        required: true
    },
    {
        // 抽取内容页的文章发布日期
        name: "article_publish_time",
        selector: "//div[contains(@class,'pi-author')]/span[1]",
        required: true
    },
    {
        // 抽取内容页的文章作者
        name: "article_author",
        selector: "//div[contains(@class,'pi-author')]/a/text()",
        required: true
    }
  ]
};

// afterExtractField回调函数：将爬取到的时间转换为时间戳，以便发布数据时用
configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "article_publish_time") {
        var timestamp = Date.parse(data);
        return isNaN(timestamp) ? "0" : timestamp/1000 + "";
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
