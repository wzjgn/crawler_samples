//使用javascript编写的爬虫源码，用于爬取豌豆荚游戏排行榜（http://www.wandoujia.com/top/game）上的游戏信息。
//代码粘贴到神箭手云爬虫平台上就可以直接跑了，不需要安装编译环境。要爬取其他网站，//可以更改源码即可。

//代码执行具体步骤请参考：
//https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt

var configs = {
    domains: ["apps.wandoujia.com"],
    scanUrls: ["http://apps.wandoujia.com/api/v1/apps?type=weeklytopgame&max=12&start=0"],
    contentUrlRegexes: ["http://www\\.wandoujia\\.com/apps/.*"],
    helperUrlRegexes: ["http://apps\\.wandoujia\\.com/api/v1/apps\\?type=weeklytopgame&max=12&start=\\d+"],//可留空
    fields: [
        {
            // 第一个抽取项
            name: "title",
            selector: "//span[contains(@class,'title')]",
            required: true //是否不能为空
        },
        {
            // 第二个抽取项
            name: "download",
            selector: "//i[@itemprop='interactionCount']",
            required: false //是否不能为空
        },
        {
            //第三个抽取项
            name:"thumb",
            selector:"//div[contains(@class,'app-icon')]/img[@itemprop='image']/@src",
        }
        
    ]
};
configs.onProcessHelperUrl = function(url, content, site) {
    var jarr = JSON.parse(content);
    //发现内容页
    for (var i = 0, n = jarr.length; i < n; i++) {
        var new_url = "http://www.wandoujia.com/apps/"+jarr[i].packageName;
        site.addUrl(new_url);
    }
    var currentStart = parseInt(url.substring(url.indexOf("&start=") + 7));
    var start = currentStart+12;
    if(start < 100){
        site.addUrl("http://apps.wandoujia.com/api/v1/apps?type=weeklytopgame&max=12&start="+start);
    }
    return true;
}
var crawler = new Crawler(configs);
crawler.start();
