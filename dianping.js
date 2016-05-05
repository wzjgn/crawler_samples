// 大众点评上爬取所有"黄焖鸡米饭"的商户信息
var keywords = "黄焖鸡米饭";
var scanUrls = ["http://www.dianping.com/search/keyword/1/0_"+keywords];
for (var i = 1; i <= 2323; i++) {
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

configs.onProcessHelperUrl = function(url, content) {
    var urls = extractList(content, "//div[@class='tit']/a[not(contains(@class,'shop-branch'))]/@href");
    for (var i = 0; i < urls.length; i++) {
        addUrl(urls[i]+"/editmember");
    }
    var nextPage = extract(content,"//div[@class='page']/a[@class='next']/@href");
    if (nextPage) {
        addUrl(nextPage);
        var result = /\d+$/.exec(nextPage);
        if (result) {
            var data = result[0];
            var count = nextPage.length-data.length;
            var lll = nextPage.substr(0, count)+(parseInt(data)+1);
            addUrl(nextPage.substr(0, count)+(parseInt(data)+1));
            addUrl(nextPage.substr(0, count)+(parseInt(data)+2));
        }
    }
    return false;
}

configs.afterExtractField = function(fieldName, data) {
    if (fieldName == "id") {
        var result = /\d+$/.exec(data);
        if (result) {
            data = result[0];
        }
    }
    else if (fieldName == "shop_name") {
        if (data.indexOf("黄焖鸡米饭") == -1) {
            skip();
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

start(configs);
