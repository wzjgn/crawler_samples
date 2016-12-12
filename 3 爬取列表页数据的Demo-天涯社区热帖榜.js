/*
  爬取天涯社区的热帖榜（http://bbs.tianya.cn/hotArticle.jsp）上的列表页信息，包括标题、作者和回复时间。
  爬取的数据全部来自于列表页。
*/
var configs = {
    domains: ["bbs.tianya.cn"],
    scanUrls: ["http://bbs.tianya.cn/hotArticle.jsp"],
    contentUrlRegexes: [], // 该项为空，表示所有待爬队列里的网页都会被当作内容页处理
    helperUrlRegexes: [/http:\/\/bbs\.tianya\.cn\/hotArticle\.jsp(\?pn=\d+)?/],
    fields: [
      {
        name: "items", // items是一个对象数组，数组里的每一项是抽取的一条数据（包括标题、作者和回复时间）
        selector: "//table[contains(@class,'tab-bbs-list')]/tbody/tr",
        repeated: true, // repeated设置为true表示该项是数组
        children: [ // 数组里每个对象包含的子项
          {
              name: "title",
              alias: "标题",
              selector: "//td[contains(@class,'td-title')]//text()",// 相对于父项的路径，xpath必须以//开头
              required: true 
          },
          {
              name: "author",
              alias: "作者",
              selector: "//a[contains(@class,'author')]/text()"
          },
          {
              name:"replied_time",
              alias: "回复时间",
              selector:"//td[last()]"
          }
        ]
      }       
    ]
};

/*
  回调函数onProcessHelperUrl：获取下一页列表页url，并手动添加到待爬队列中
*/
configs.onProcessHelperUrl = function(url, content, site) {
    // 从当前列表页中获取下一页的链接
    var nextUrl = extract(content, "//a[text()[1]='下页']/@href");
    if(nextUrl==="" || nextUrl===null){
      return false; //  如果是最后一页就不发现新链接了
    }
    site.addUrl(nextUrl);
    return false; 
};

/*
  回调函数afterExtractField：对抽取的数据进行处理
*/
configs.afterExtractField = function(fieldName, data, page){
    if(data===null || data==="" || typeof(data)=="undefined"){
      return data;
    }
    if(fieldName=="items.replied_time"){ // 子项的fieldName前面要加上： 父项的fieldName.
      var timestamp = parseDateTime(data); // 回复时间转换成时间戳，parseDateTime可以处理非标准的时间格式，比如：3天前、一个月前等
      return isNaN(timestamp) ? "0" : timestamp/1000 + ""; // 使用神箭手进行数据发布时，默认处理的时间戳是10位。如非特殊，请转换成10位时间戳
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
