/*使用javascript编写的爬虫源码，用于爬取瓜子二手车上的二车手信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

var scanUrl = "http://www.guazi.com/hz/buy/";//@input(scanUrl, 入口url, 请输入一个需爬取城市的url，格式为：“http://www.guazi.com/城市名称/buy/”)

if (scanUrl.trim().length > 0) {
    var city = scanUrl.trim().substring(scanUrl.indexOf(".com/") + 5, scanUrl.indexOf("/buy/"));
}

var configs = {
    domains: ["guazi.com"],
    scanUrls: [scanUrl],
    contentUrlRegexes: ["https?://www\\.guazi\\.com/" + city + "/\\w+\\.htm"],
    helperUrlRegexes: ["https?://www\\.guazi\\.com/" + city + "/buy/(o\\d+/)?"],
    enableJS: false,
    interval: 10000,
    fields: [
        {
            name: "car_name",
            selector: "//h1[contains(@class,'dt-titletype')]"
        },
        {
            name: "car_price",
            selector: "//span[contains(@class,'fc-org pricestype')]"
        },
        {
            name: "car_license",
            selector: "//li[contains(@class,'one')]/b"
        },
        {
            name: "car_mileage",
            selector: "//ul[contains(@class,'assort')]/li[2]/b"
        },
        {
            name: "car_gearbox",
            selector: "//ul[contains(@class,'assort')]/li[3]/b"
        },
        {
            name: "car_emission_standard",
            selector: "//li[contains(@class,'em-sta detailHoverTips')]/b"
        },
        {
            name: "car_license_location",
            selector: "//ul[contains(@class,'assort')]/li[5]/b"
        },
        {
            name: "car_owner",
            selector: "//li[contains(@class,'owner')]/text()[2]"
        },
        {
            name: "car_description",
            selector: "//*[@id='base']/p"
        }
    ]
};

configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "car_price") {
        var price = extract(data, "//b").replace("&yen;", "¥");
        var coinUnit = exclude(data, "//b");
        return (price + coinUnit);
    }
    else if (fieldName == "car_owner") {
        return data.trim();
    }
    else if (fieldName == "car_description") {
        return data.replace("<em></em>", "");
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
