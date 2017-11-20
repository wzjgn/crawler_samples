/*
  爬取蘑菇街某关键字商品的信息和评价。
  使用到了关键字动态输入、如何爬取内容页的多页数据。
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
*/
// @input等表示该变量可在爬虫设置中动态设置
var keyword = "女装";// @input(keyword,商品搜索关键字，爬取蘑菇街该关键字的搜索结果)
var encodeKey = encodeURIComponent(keyword); // 将搜索关键字先url encode

var configs = {
    domains: ["mogujie.com"],
    scanUrls: ["http://list.mogujie.com/search?q="+encodeKey+"&cKey=43&page=1&sort=pop"],
    contentUrlRegexes: [/http:\/\/shop\.mogujie\.com\/detail.+/],
    helperUrlRegexes: [/http:\/\/list\.mogujie\.com\/search\?.+/],
    fields: [
      {
          name:"product_id",
          alias: "商品ID",
          selector:"//*[@id='J_ItemId']/@value"
      },
      {
          name: "name",
          alias: "商品名",
          selector: "//span[@itemprop='name']",
          required: true 
      },
      {
          name: "price",
          alias: "价格",
          selector: "//span[@id='J_NowPrice']"
      },
      {
          name:"sales_count",
          alias: "累计销量",
          selector:"//span[contains(@class,'J_SaleNum')]"
      },
      {
          name:"comments_count",
          alias: "评价数",
          selector:"//span[contains(text()[1],'评价')]/span"
      },
      {
        name: "comments",
        alias: "评价",
        selector: "//div[@id='sjs']/span", // 3、抽取出每页评价的内容
        repeated: true, 
        children: [
          {
              name: "page", // 页码
              selector: "//text()",
              required: true
          },
          {
              name: "page_comments", // 该页的评价
              sourceType: SourceType.AttachedUrl, // attachedUrl表示在抽取过程中另发请求，再从返回的数据中抽取数据
              attachedUrl: "http://shop.mogujie.com/ajax/pc.rate.ratelist/v1?pageSize=20&sort=1&isNewDetail=1&itemId={$.product_id}&type=1&page={page}",
              selectorType: SelectorType.JsonPath, // 返回的数据是json，使用JsonPath抽取数据
              repeated: true,
              selector: "$.data.list",
              children: [
                {
                    name: "create_time",
                    alias: "评价时间",
                    selectorType: SelectorType.JsonPath,
                    selector: "$.created"
                },
                {
                    name:"content",
                    alias: "评价内容",
                    selectorType: SelectorType.JsonPath,
                    selector:"$.content"
                },
                {
                    name:"author",
                    alias: "评价者",
                    selectorType: SelectorType.JsonPath,
                    selector:"$.userInfo.uname"
                },
                {
                    name:"stock",
                    alias: "购买信息",
                    selectorType: SelectorType.JsonPath,
                    selector:"$.stock",
                    repeated: true
                }
              ]
          }
        ]
      }       
    ]
};

/*
  回调函数afterDownloadPage：对下载的网页进行处理，返回处理后的网页内容系统再进行数据抽取
*/
configs.afterDownloadPage = function(page, site){
    var matches = /shop\.mogujie\.com\/detail/.exec(page.url);
    if(matches){
      // 如果当前下载的页面是内容页，需要先将要在抽取过程中发送的请求链接（获取评价）信息添加到页面中，方便抽取
      
      // 1、首先从内容页获取评价的总数
      var commentsCount = extract(page.raw, "//span[contains(text()[1],'评价')]/span");
      commentsCount = parseInt(commentsCount);
      var commentsPageCount = Math.ceil(commentsCount/20); //根据总评价数算出总评价页数
      // 2、然后将评价的每个页码添加到内容页中返回处理
      var extraHTML = '<div id="sjs">'; // id设置为一个特殊的值，方便抽取
      for(var i=1;i<=commentsPageCount;i++){
        extraHTML+='<span>'+i+'</span>';
      }
      extraHTML+='</div>';
      var index = page.raw.indexOf("</body>");
      page.raw = page.raw.substring(0, index) + extraHTML + page.raw.substring(index);
    }
    return page;
};

/*
  回调函数onProcessHelperUrl：获取下一页列表页和内容页链接，并手动添加到待爬队列中
*/
configs.onProcessHelperPage = function(page, content, site){
    var matches = /page=(\d+)/.exec(page.url);
    if(!matches){
      return false;
    }
    var currentPage = parseInt(matches[1]);
    var json = JSON.parse(content);
    var isEnd = json.result.wall.isEnd;    
    if(!isEnd){
      // 如果有下一页，将下一页列表页链接加入待爬队列
      var nextPage = currentPage+1;
      site.addUrl("http://list.mogujie.com/search?q="+encodeKey+"&cKey=43&page="+nextPage+"&sort=pop");
    }
    // 获取内容页链接，并添加到待爬队列中
    var contents = json.result.wall.docs;
    for(var i=0;i<contents.length;i++){
      site.addUrl(contents[i].link);
    }
    return false;
};

configs.onProcessScanPage = function(page, content, site){
    // 不从入口页自动发现新链接
    return false;
};

configs.onProcessContentPage = function(page, content, site){
    // 不从内容页自动发现新链接
    return false;
};

/*
  afterExtractPage：对抽取的整页数据进行处理
*/
configs.afterExtractPage = function(page, data) {
    if (!data.comments) return data;
    // 4、将抽取的每页评价数据拼成一个数组返回
    var comments = [];
    for (var i = 0; i < data.comments.length; i++) {
        var pageComments = data.comments[i];
        for (var j = 0; j < pageComments.page_comments.length; j++) {
            comments.push(pageComments.page_comments[j]);
        }
    }
    data.comments = comments;
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
