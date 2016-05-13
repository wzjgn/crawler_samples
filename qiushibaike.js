var configs = {
    domains: ["www.qiushibaike.com"],
    scanUrls: ["http://www.qiushibaike.com/"],
    contentUrlRegexes: ["http://www\\.qiushibaike\\.com/article/\\d+"],
    fields: [
        {
            name: "content",
            selector: "//*[@id='single-next-link']",
            required: true
        },
        {
            name: "author",
            selector: "//div[contains(@class,'author')]//h2"
        }
    ]
};
var crawler = new Crawler(configs);
crawler.start();
