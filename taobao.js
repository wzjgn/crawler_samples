/*使用javascript编写的爬虫源码，用于爬取淘宝网上的商品信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
代码详细讲解请参考：
http://blog.csdn.net/youmumzcs/article/details/51385856
*/

var configs = {
    domains: ["s.taobao.com", "item.taobao.com"],
    scanUrls: ["https://s.taobao.com/list?q=%E5%A5%97%E8%A3%85%E5%A5%B3%E5%A4%8F&s=0"],
    contentUrlRegexes: ["https?://item\\.taobao\\.com/item\\.htm\\?.*"],
    helperUrlRegexes: ["https?://s\\.taobao\\.com/list\\?q=%E5%A5%97%E8%A3%85%E5%A5%B3%E5%A4%8F&s=\\d+"],
    interval: 10000,
    fields: [
        {
            name: "title",
            selector: "//h3[contains(@class,'tb-main-title')]/@data-title",
            required: true
        },
        {
            name: "id",
            selector: "//input[@name='item_id']/@value",
            transient: true
        },
        {
            name: "price",
            selector: "//em[@id='J_PromoPriceNum'] | //em[contains(@class,'tb-rmb-num')]"
        },
        {
            name: "price_promotion",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "https://detailskip.taobao.com/service/getData/1/p2/item/detail/sib.htm?itemId={id}&modules=qrcode,viewer,price,contract,duty,xmpPromotion,dynStock,delivery,sellerDetail,activity,fqg,zjys,coupon&callback=",
            attachedHeaders: {
                "Referer": "https://item.taobao.com"
            },
            selectorType: SelectorType.JsonPath,
            selector: "$.data.promotion.promoData..def..price",
            transient: true
        },
        {
            name: "thumb",
            selector: "//*[@id='J_ImgBooth']"
        }
    ]
};

var totalPageNum = 0;

configs.onProcessScanPage = function(page, content, site) {
    if (content === null) return false;
    var regex = /g_page_config\s*=\s*(\{.*\})?;\s*\n*\s*g_srp_loadCss\(\)\;/;
    var data = regex.exec(page.raw);
    var jsonData;
    if (data !== null && data.length > 1 && typeof(data[1]) === "string") {
        jsonData = JSON.parse(data[1]);
        if (totalPageNum === 0) {
            totalPageNum = parseInt(jsonData.mods.sortbar.data.pager.totalPage);
        }
        var items = jsonData.mods.itemlist.data.auctions;
        for (var i = 0, n = items.length; i < n; i++) {
            site.addUrl("https:" + items[i].detail_url);
        }
    }

    var currentPageNum = parseInt(jsonData.mods.sortbar.data.pager.currentPage);
    if (currentPageNum >= totalPageNum) {
        totalPageNum = 0;
        return false;
    }

    var currentStart = parseInt(page.url.substring(page.url.indexOf("&s=") + 3));
    var start = currentStart + 60;
    var nextUrl = page.url.replace("&s=" + currentStart, "&s=" + start);
    site.addUrl(nextUrl);
    return false;
};

configs.onProcessHelperPage = function(page, content, site) {
    if (content === null) return false;
    var regex = /g_page_config\s*=\s*(\{.*\})?;\s*\n*\s*g_srp_loadCss\(\)\;/;
    var data = regex.exec(page.raw);
    var jsonData;
    if (data !== null && data.length > 1 && typeof(data[1]) === "string") {
        jsonData = JSON.parse(data[1]);
        var items = jsonData.mods.itemlist.data.auctions;
        for (var i = 0, n = items.length; i < n; i++) {
            site.addUrl("https:" + items[i].detail_url);
        }
    }

    var currentPageNum = parseInt(jsonData.mods.sortbar.data.pager.currentPage);
    if (currentPageNum >= totalPageNum) {
        totalPageNum = 0;
        return false;
    }

    var currentStart = parseInt(page.url.substring(page.url.indexOf("&s=") + 3));
    var start = currentStart + 60;
    var nextUrl = page.url.replace("&s=" + currentStart, "&s=" + start);
    site.addUrl(nextUrl);
    return false;
};

configs.afterExtractPage = function(page, data){
    var realPrice = data.price_promotion;
    if(realPrice===""||realPrice==="[]"||realPrice===null||realPrice===undefined){
      realPrice = data.price;
    }
    data.price = realPrice;
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
