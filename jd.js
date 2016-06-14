/*使用javascript编写的爬虫源码，用于爬取京东商城上的商品信息和评论。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

var keyword = "d3.js";//@input(keyword, 查询关键字, 爬取该关键字搜索出来的京东商品)
var comment_count = 100;//@input(comment_count, 爬取的评论数, 最多爬取多少条评论)

var page_count = comment_count / 10;
keyword = keyword.trim();
var scanUrls = [];
scanUrls.push("http://search.jd.com/Search?keyword=" + keyword.replace(/ /g, "+") + "&enc=utf-8&scrolling=y&page=200");
var helperUrlRegexes = [];
helperUrlRegexes.push("http://search\\.jd\\.com/Search\\?keyword=" + keyword.replace(/ /g, "\\+").replace(/\./g, "\\.") + "&enc=utf-8&scrolling=y&page=\\d+");

var configs = {
    domains: ["search.jd.com", "item.jd.com", "club.jd.com"],
    scanUrls: scanUrls,
    contentUrlRegexes: ["http://item\\.jd\\.com/\\d+.html"],
    helperUrlRegexes: helperUrlRegexes,
    interval: 10000,
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
            selector: "//div[@id='comment-pages']/span",
            repeated: true,
            children: [
                {
                    name: "page",
                    selector: "//text()"
                },
                {
                    name: "comments",
                    sourceType: SourceType.AttachedUrl,
                    attachedUrl: "http://club.jd.com/productpage/p-{$.productid}-s-0-t-3-p-{page}.html",
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
    var commentUrl = "http://club.jd.com/productpage/p-"+matches[1]+"-s-0-t-3-p-0.html";
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
    var index = page.raw.indexOf("</body>");
    page.raw = page.raw.substring(0, index) + pageHtml + page.raw.substring(index);
    return page;
};

var dataSku = 0;

configs.onProcessHelperPage = function(page, content, site) {
    var num = parseInt(extract(content, "//*[@id='J_goodsList']/ul/li[1]/@data-sku"));
    if (dataSku === 0) {
        dataSku = isNaN(num) ? 0 : num;
    }
    else if (dataSku === num) {
        dataSku = 0;
        return false;
    }
    var currentPageNum = parseInt(page.url.substring(page.url.indexOf("&page=") + 6));
    if (currentPageNum === 0) {
        currentPageNum = 1;
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
