/*使用javascript编写的爬虫源码，用于爬取沪商财富上的理财产品信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。

代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt

代码详细讲解请参考：
http://blog.csdn.net/youmumzcs/article/details/51455296
*/

var configs = {
    domains: ["www.hushangcaifu.com"],
    scanUrls: ["http://www.hushangcaifu.com/invest/index1.html"],
    contentUrlRegexes: ["http://www\\.hushangcaifu\\.com/invest/a\\d{4}\\.html"],
    helperUrlRegexes: ["http://www\\.hushangcaifu\\.com/invest/index\\d+\\.html"],
    fields: [
        {
            name: "title",
            selector: "//div[contains(@class,'product-content-top-left-top')]/h3/text()",
            required: true 
        },
        {
            name: "user_name",
            selector: "//div[contains(@class,'product-content-top-left-top')]/p/span/text()"
        },
        {
            name: "total_money",
            selector:"//div[contains(@class,'product-content-top-left-middle')]/div[1]/h4/text()"
        },
        {
            name: "project_time",
            selector:"//div[contains(@class,'product-content-top-left-middle')]/div[2]/h4/text()"
        },
        {
            name: "annual_return",
            selector:"//div[contains(@class,'product-content-top-left-middle')]/div[3]/h4/text()"
        },
        {
            name: "return_method",
            selector:"//div[contains(@class,'product-content-top-left-middle')]/div[4]/h4/text()"
        }
        
    ]
};

var crawler = new Crawler(configs);
crawler.start();
