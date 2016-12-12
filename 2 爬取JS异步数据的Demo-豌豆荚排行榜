/*
  爬取豌豆荚安卓游戏排行版（http://www.wandoujia.com/top/game）上的游戏信息。
  因为列表页是js动态生成的（网页源码中并没有），所以需要分析网络请求，手动添加下一页列表页和内容页链接到待爬队列中。
*/
var configs = {
    domains: ["wandoujia.com"],
    scanUrls: ["http://apps.wandoujia.com/api/v1/apps?type=weeklytopgame&max=12&start=0"],
    contentUrlRegexes: [/http:\/\/www\.wandoujia\.com\/apps\/.*/],
    helperUrlRegexes: [/http:\/\/apps\.wandoujia\.com\/api\/v1\/apps\?type=weeklytopgame&max=12&start=\d+/],
    fields: [
        {
            name: "game_name",
            alias: "游戏名",
            selector: "//span[contains(@class,'title')]",
            required: true 
        },
        {
            name: "game_download",
            alias: "下载量",
            selector: "//i[@itemprop='interactionCount']"
        },
        {
            name:"game_icon",
            alias: "游戏图标",
            selector:"//div[contains(@class,'app-icon')]/img[@itemprop='image']/@src"
        }
        
    ]
};

/*
  回调函数onProcessHelperUrl：获取下一页列表页以及从列表页中获取内容页链接，并手动添加到待爬队列中
*/
configs.onProcessHelperUrl = function(url, content, site) {
    // 列表页返回的数据是json，需要先转换成json格式
    var jarr = JSON.parse(content);
    // 从json数组中获取内容页链接并添加到待爬队列中
    for (var i = 0, n = jarr.length; i < n; i++) {
      var new_url = "http://www.wandoujia.com/apps/"+jarr[i].packageName;
      site.addUrl(new_url);
    }
    // 获取下一页列表页链接并添加到待爬队列中
    var currentStart = parseInt(url.substring(url.indexOf("&start=") + 7));
    var start = currentStart+12;
    if(start < 100){ // 该demo只爬取游戏排行榜前100的游戏
      site.addUrl("http://apps.wandoujia.com/api/v1/apps?type=weeklytopgame&max=12&start="+start);
    }
    return false; // 返回false表示不从当前列表页中自动发现新的链接，从而避免添加无用的链接，提高爬取速度
};

var crawler = new Crawler(configs);
crawler.start();
