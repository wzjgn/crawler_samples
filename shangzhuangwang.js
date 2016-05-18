/*使用javascript编写的爬虫源码，用于爬取尚妆网上的商品信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。

代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt

代码详细讲解请参考：
http://blog.csdn.net/youmumzcs/article/details/51383648
*/

var configs = {
    domains: ["www.showjoy.com","list.showjoy.com","item.showjoy.com"],
    scanUrls: ["http://list.showjoy.com/search/?q=cateIds%3A1,cateName%3A%E9%9D%A2%E8%86%9C"],
    contentUrlRegexes: ["http://item\\.showjoy\\.com/sku/\\d+\\.html"],
    helperUrlRegexes: ["http://list\\.showjoy\\.com/search/\\?q=cateIds%3A1,cateName%3A%E9%9D%A2%E8%86%9C(\\&page=\\d+)?"], 
    fields: [
        {
            // 第一个抽取项
            name: "title",
            selector: "//h3[contains(@class,'choose-hd')]",
            required: true 
        },
        {
            // 第二个抽取项
            name: "comment",
            selector: "//div[contains(@class,'dtabs-hd')]/ul/li[2]", 
            required: false 
        },
        {
            // 第三个抽取项
            name: "sales",
            selector: "//div[contains(@class,'dtabs-hd')]/ul/li[3]", 
            required: false 
        },
        {
            name: "skuid",
            selector: "//input[@id='J_UItemId']/@value",
        },
        {
            name: "price",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://item.showjoy.com/product/getPrice?skuId={skuid}",
            selectorType: SelectorType.JsonPath,
            selector: "$.data.price",
            
        }
    ]
};

configs.onProcessHelperUrl = function(url, content, site){
    if(!content.indexOf("无匹配商品")){
        //如果没有到最后一页，则将页数加1
        var currentPage = parseInt(url.substring(url.indexOf("&page=") + 6));
        var page = currentPage + 1;
        var nextUrl = url.replace("&page=" + currentPage, "&page=" + page);
        site.addUrl(nextUrl);
    }
    return true;
}
configs.afterExtractField = function(fieldName, data){
    if(fieldName == "comment" || fieldName == "sales"){
        var regex = /.*（(\d+)）.*/;
        return (data.match(regex))[1];
    }
    return data;
}
var crawler = new Crawler(configs);
crawler.start();
