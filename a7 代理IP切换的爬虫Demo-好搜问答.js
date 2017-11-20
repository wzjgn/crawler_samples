/*
  爬取好搜问答的内容。
  因为好搜有反爬，所以该爬虫通过切换代理IP来防屏蔽。
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
*/
var keywords = ["微信","微博"];//@tags(keywords, 关键字, 分别爬取好搜上这些关键字的搜索结果)

var scanUrls = [];
var helperUrlRegexes = [];
for (var i = 0; i < keywords.length; i++) {
    scanUrls.push("http://wenda.so.com/c/?q="+keywords[i]);
    helperUrlRegexes.push("http://wenda\\.so\\.com/c/\\?q="+encodeURIComponent(keywords[i])+"(&pn=\\d+)?");
}
var configs = {
    domains: ["wenda.so.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/wenda\.so\.com\/q\/\d+.*/],
    helperUrlRegexes: helperUrlRegexes,
    timeout : 10000,
    enableProxy: true, // 1、设置enableProxy为true表示开启自动代理IP切换。启动爬虫前，切换的代理IP类别需要在爬虫设置中设置。
    fields: [
        {
            name: "question_title",
            alias: "问题标题",
            selector: "//h2[contains(@class,'js-ask-title')]",
            required: true
        },
        {
            name: "question_detail",
            alias: "问题内容",
            selector: "//div[@class='q-cnt']"
        },
        {
            name: "question_author",
            alias: "作者",
            selector: "//*[@ask_id]//a[contains(@class,'ask-author')]|//span[contains(@class,'ask-author')]"
        },
        {
            name: "question_publish_time",
            alias: "发布时间",
            selector: "//*[@id='js-detail']//div[@class='text']/span[last()]"
        },
        {
            name: "question_topics",
            alias: "话题",
            selector: "//*[@id='js-detail']//div[@class='text']/span[last()-2]/a",
            repeated: true
        },
        {
            name: "question_answer",
            alias: "回答",
            selector: "//*[@ans_id]",
            repeated: true,
            children: [
                {
                    name: "question_answer_content",
                    alias: "回答内容",
                    selector: "//div[contains(@class,'resolved-cnt') or contains(@class,'other-ans-cnt')]",
                    required: true
                },
                {
                    name: "question_answer_author",
                    alias: "作者",
                    selector: "//*[contains(@class,'ask-author')]"
                },
                {
                    name: "question_answer_author_avatar",
                    alias: "作者头像",
                    selector: "//div[@class='info']//img"
                },
                {
                    name: "question_answer_agree_count",
                    alias: "赞同数",
                    selector: "//a[contains(@class,'good') or contains(@class,'approve')]/span"
                },
                {
                    name: "question_answer_publish_time",
                    alias: "发布时间",
                    selector: "//div[@class='text']/span[last()]"
                }
            ]
        }
    ]
};

configs.beforeCrawl = function (site) {
    for(var i=0;i<scanUrls.length;i++){
        site.addScanUrl(scanUrls[i]);
    }
};

/*
  回调函数isAntiSpider：返回页面是否被反爬，从而告知系统是否强制切换代理IP
  注意：神箭手默认自动切换代理IP的情况是：
  1、页面返回403；
  2、当前代理IP过期；
  3、爬取刚开始的时候。
  除此之外的情况，请重写该函数。
*/
configs.isAntiSpider = function(url, content) {
    if (content.indexOf("您访问360问答过于频繁") != -1) {
        // 2、如果返回的页面中包括以上内容就表示被反爬了，系统会强制切换代理IP后继续爬取，返回true
        return true;
    }
    return false;
};

configs.beforeCacheImage = function(fieldName, url) {
    if (fieldName == "question_answer.question_answer_author_avatar") {
      return url.replace("48_48_100", "200_200_100"); // 返回更大的图片链接（200*200）
    }
    return url;
};

configs.afterExtractField = function(fieldName, data, page) {
    if(data===null || data==="" || typeof(data)=="undefined"){
      return data;
    }
    if (fieldName == "question_publish_time" || fieldName == "question_answer.question_answer_publish_time") {
      var timestamp = parseDateTime(data);
      return isNaN(timestamp) ? "0" : timestamp/1000 + "";
    }
    return data;
};

configs.afterExtractPage = function(page, data){
    if(data.question_detail===null || typeof(data.question_detail)=="undefined" || data.question_detail === ""){
      // 如果问题没有内容，就是用标题作为内容
      data.question_detail = data.question_title;
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
