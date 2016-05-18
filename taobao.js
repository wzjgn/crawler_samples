/*使用javascript编写的爬虫源码，用于爬取淘宝网上的商品信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。

代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt

代码详细讲解请参考：
http://blog.csdn.net/youmumzcs/article/details/51385856
*/

var configs = {
    domains: ["s.taobao.com","item.taobao.com"],
    scanUrls: ["https://s.taobao.com/list?q=%E5%A5%97%E8%A3%85%E5%A5%B3%E5%A4%8F"],
    contentUrlRegexes: ["https?://item\\.taobao\\.com/item\\.htm\\?.*"],
    helperUrlRegexes: ["https?://s\\.taobao\\.com/list\\?q=%E5%A5%97%E8%A3%85%E5%A5%B3%E5%A4%8F.*"],
    enableJS:true,
    fields: [
        {
            // 第一个抽取项
            name: "title",
            selector: "//h3[contains(@class,'tb-main-title')]/@data-title",
            required: true 
        },
        {
            // 第二个抽取项
            name: "price",
            selector: "//em[@id='J_PromoPriceNum'] | //em[contains(@class,'tb-rmb-num')]",
            required: true 
        },
        {
            // 第三个抽取项
            name: "thumbs",
            selector: "//ul[@id='J_UlThumb']/li//img/@src",
            repeated:true
        },
    ]
};
configs.onProcessHelperUrl = function(url, content, site){
    if(!content.indexOf("未找到与")){
        var currentStart = parseInt(url.substring(url.indexOf("&s=") + 3));
        var start = currentStart + 60;
        var nextUrl = url.replace("&s=" + currentStart, "&s=" + start);
        site.addUrl(nextUrl);
    }
    return true;
};
var crawler = new Crawler(configs);
crawler.start();
