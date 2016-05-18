/*使用javascript编写的爬虫源码，用于爬取京东商城上的商品评论。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。

代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt

代码详细讲解请参考：
http://blog.csdn.net/youmumzcs/article/details/51396283
*/

var configs = {
    domains: ["search.jd.com","item.jd.com","club.jd.com"],
    scanUrls: ["http://search.jd.com/Search?keyword=Python&enc=utf-8&qrst=1&rt=1&stop=1&book=y&vt=2&page=1&s=1&click=0"],
    contentUrlRegexes: ["http://item\\.jd\\.com/\\d+.html"],
    helperUrlRegexes: ["http://search\\.jd\\.com/Search\\?keyword=Python&enc=utf-8&qrst=1&rt=1&stop=1&book=y&vt=2&page=\\d+&s=1&click=0"], 
    fields: [
        {
            // 第一个抽取项
            name: "title",
            selector: "//div[@id='name']/h1",
            required: true 
        },
        {
            // 第一个抽取项
            name: "productid",
            selector: "//div[contains(@class,'fl')]/span[2]",
            required: true 
        },
        {
            name: "comments",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://club.jd.com/productpage/p-{productid}-s-0-t-3-p-0.html",
            selectorType: SelectorType.JsonPath,
            selector: "$.comments",
            repeated: true,
            children:[
                {
                    name: "com_content",
                    selectorType: SelectorType.JsonPath,
                    selector: "$.content"
                },
                {
                    name: "com_nickname",
                    selectorType: SelectorType.JsonPath,
                    selector: "$.nickname"
                },
            ]
        }
    ]
};
configs.onProcessHelperUrl = function(url, content, site){
    if(!content.indexOf("抱歉，没有找到")){
        var currentPage = parseInt(url.substring(url.indexOf("&page=") + 6));
        if(currentPage == 0){
            currentPage = 1;
        }
        var page = currentPage + 2;
        var nextUrl = url.replace("&page=" + currentPage, "&page=" + page);
        site.addUrl(nextUrl);
    }
    return true;
};
var crawler = new Crawler(configs);
crawler.start();
