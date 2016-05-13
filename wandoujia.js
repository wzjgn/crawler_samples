//使用javascript编写的爬虫源码，用于爬取豌豆荚游戏排行榜（http://www.wandoujia.com/top/game）上的游戏信息。
//代码粘贴到神箭手云爬虫平台上就可以直接跑了，不需要安装编译环境。要爬取其他网站，//可以更改源码即可。

//代码执行步骤：
//1、打开浏览器，输入并打开神箭手官网：http://www.shenjianshou.cn。
//2、登录进入后台。
//3、点击后台的“爬虫模板编写”->“新建爬虫模板”。
//4、将代码拷贝到模板脚本里，点击“保存”。
//5、点击“我的任务”->“创建爬虫任务”。
//6、选择刚编写的模板后保存，跳转到任务页面后点击启动，等一段时间后爬取的结果就会显示在任务页面。

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
