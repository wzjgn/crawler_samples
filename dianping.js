// 大众点评上爬取所有"黄焖鸡米饭"的商户信息
var keywords = "黄焖鸡米饭";
var scanUrls = [];
//国内的城市id到2323，意味着种子url有2323个
//作为sample，这里改成1，只爬取上海的黄焖鸡米饭门店
//for (var i = 1; i <= 2323; i++) {
for (var i = 1; i <= 1; i++) {
    scanUrls.push("http://www.dianping.com/search/keyword/"+i+"/0_"+keywords);
}

var configs = {
    domains: ["dianping.com"],
    scanUrls: scanUrls,
    helperUrlRegexes: ["http://www.dianping.com/search/keyword/\\d+/0_.*"],
    contentUrlRegexes: ["http://www.dianping.com/shop/\\d+/editmember"],
    enableProxy: true,
    interval: 5000,
    fields: [
        {
            name: "shop_name",
            selector: "//div[contains(@class,'shop-review-wrap')]/div/h3/a/text()"
        },
        {
            name: "id",
            selector: "//div[contains(@class,'shop-review-wrap')]/div/h3/a/@href"
        },
        {
            name: "create_time",
            selector: "//div[contains(@class,'block raw-block')]/ul/li[1]/span"
        },
        {
            name: "region_name",
            selector: "//div[@class='breadcrumb']/b[1]/a/span/text()",
            required: true
        },
        {
            name: "province_name",
            selector: "//div[@class='breadcrumb']/b[1]/a/span/text()"
        }
    ]
};

configs.onProcessHelperUrl = function(url, content, site) {
    var urls = extractList(content, "//div[@class='tit']/a[not(contains(@class,'shop-branch'))]/@href");
    for (var i = 0; i < urls.length; i++) {
        site.addUrl(urls[i]+"/editmember");
    }
    var nextPage = extract(content,"//div[@class='page']/a[@class='next']/@href");
    if (nextPage) {
        site.addUrl(nextPage);
        var result = /\d+$/.exec(nextPage);
        if (result) {
            var data = result[0];
            var count = nextPage.length-data.length;
            var lll = nextPage.substr(0, count)+(parseInt(data)+1);
            site.addUrl(nextPage.substr(0, count)+(parseInt(data)+1));
            site.addUrl(nextPage.substr(0, count)+(parseInt(data)+2));
        }
    }
    return false;
}

configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "id") {
        var result = /\d+$/.exec(data);
        if (result) {
            data = result[0];
        }
    }
    else if (fieldName == "shop_name") {
        if (data.indexOf("黄焖鸡米饭") == -1) {
            page.skip();
        }
    }
    else if (fieldName == "create_time") {
        var result = /\d{2}-\d{2}-\d{2}$/.exec(data);
        data = "20"+result[0];
    }
    else if (fieldName == "province_name" || fieldName == "region_name") {
        var position = data.indexOf("县");
        if (position != -1 && position < data.length -1) {
            data = data.substr(0,position+1);
        }
        position = data.indexOf("市");
        if (position != -1 && position < data.length -1) {
            data = data.substr(0,position+1);
        }
        data = data.replace("餐厅","");
        if (fieldName == "province_name") {
            data = getProvinceNameByRegion(data);
        }
    }
    return data;
}

var crawler = new Crawler(configs);
crawler.start();
