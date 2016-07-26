/*使用javascript编写的爬虫源码，用于爬取京东商城上的商品信息和评论。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

var keyword = "童话";//@input(keyword, 查询关键字, 爬取该关键字搜索出来的京东商品)
var comment_count = 100;//@input(comment_count, 爬取的评论数, 最多爬取多少条评论，注意：爬取的评论越多，爬虫速率越慢)

var page_count = comment_count / 10;
keyword = keyword.trim();
var scanUrls = [];
scanUrls.push("http://search.jd.com/Search?keyword=" + keyword.replace(/ /g, "+") + "&enc=utf-8&scrolling=y&page=1");
var helperUrlRegexes = [];
helperUrlRegexes.push("http://search\\.jd\\.com/Search\\?keyword=" + keyword.replace(/ /g, "\\+").replace(/\./g, "\\.") + "&enc=utf-8&scrolling=y&page=\\d+");

var configs = {
    domains: ["search.jd.com", "item.jd.com", "club.jd.com"],
    scanUrls: scanUrls,
    contentUrlRegexes: ["http://item\\.jd\\.com/\\d+.html"],
    helperUrlRegexes: helperUrlRegexes,
    interval: 15000,
    fields: [
        {
            name: "title",
            alias: "商品名",
            selector: "//div[@id='name']/h1 | //div[contains(@class,'sku-name')]",
            required: true 
        },
        {
            name: "product_price",
            alias: "商品价格",
            selector: "//div[@id='product-price']/span",
            required: true
        },
        {
            name: "product_ID",
            alias: "商品ID",
            selector: "//div[contains(@class,'fl')]/span[2] | //div[contains(@class,'sku')]/span",
            required: true 
        },
        {
            name: "comments",
            alias: "评论",
            selector: "//div[@id='comment-pages']/span",
            repeated: true,
            children: [
                {
                    name: "page",
                    selector: "//text()"
                },
                {
                    name: "comments",
                    alias: "评论",
                    sourceType: SourceType.AttachedUrl,
                    attachedUrl: "http://club.jd.com/productpage/p-{$.product_ID}-s-0-t-3-p-{page}.html",
                    selectorType: SelectorType.JsonPath,
                    selector: "$.comments",
                    repeated: true,
                    children: [
                        {
                            name: "com_publish_time",
                            alias: "评论时间",
                            selectorType: SelectorType.JsonPath,
                            selector: "$.creationTime"
                        },
                        {
                            name: "com_nickname",
                            alias: "评论者",
                            selectorType: SelectorType.JsonPath,
                            selector: "$.nickname"
                        },
                        {
                            name: "com_content",
                            alias: "评论内容",
                            selectorType: SelectorType.JsonPath,
                            selector: "$.content"
                        }
                    ]
                }
            ]
        }
    ]
};

configs.afterDownloadPage = function(page, site) {
    var matches = /item\.jd\.com\/(\d+)\.html/.exec(page.url);
    if (!matches) return page;
    var commentUrl = "http://club.jd.com/productpage/p-" + matches[1] + "-s-0-t-3-p-0.html";
    var result = site.requestUrl(commentUrl);
    var data = JSON.parse(result);
    var commentCount = data.productCommentSummary.commentCount;
    var pages = commentCount / 10;
    if (pages > page_count) pages = page_count;
    var pageHtml = "<div id=\"comment-pages\">";
    for (var i = 0; i < pages; i++) {
        pageHtml += "<span>" + i + "</span>";
    }
    pageHtml += "</div>";

    var priceUrl = "http://p.3.cn/prices/mgets?skuIds=J_" + matches[1];
    var priceData = site.requestUrl(priceUrl);
    if (priceData.indexOf("error") > -1) {
        priceData = site.requestUrl(priceUrl);
    }
    priceData = priceData.replace(/\[/g, "").replace(/\]/g, "").trim();
    var price = JSON.parse(priceData);
    pageHtml += "<div id=\"product-price\"><span>" + price.p + "</span></div>";
    
    var index = page.raw.indexOf("</body>");
    page.raw = page.raw.substring(0, index) + pageHtml + page.raw.substring(index);
    return page;
};

var totalPageNum = 0;

configs.onProcessScanPage = function(page, content, site) {
    totalPageNum = parseInt(extract(page.raw, "//*[@id='J_topPage']//i"));
    var currentPageNum = 1;
    if (currentPageNum > totalPageNum) {
        totalPageNum = 0;
        return false;
    }
    return true;
};

configs.onProcessHelperPage = function(page, content, site) {
    var currentPageNum = parseInt(page.url.substring(page.url.indexOf("&page=") + 6));
    if (currentPageNum > totalPageNum) {
        totalPageNum = 0;
        return false;
    }
    var pageNum = currentPageNum + 1;
    var nextUrl = page.url.replace("&page=" + currentPageNum, "&page=" + pageNum);
    site.addUrl(nextUrl);
    return true;
};

configs.afterExtractPage = function(page, data) {
    if (data.comments === null || data.comments === undefined) return data;
    var comments = [];
    for (var i = 0; i < data.comments.length; i++) {
        var p = data.comments[i];
        for (var j = 0; j < p.comments.length; j++) {
            comments.push(p.comments[j]);
        }
    }
    data.comments = comments;
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
