/*使用javascript编写的爬虫源码（神箭手开发者zhebie投稿作品），用于爬取多肉之家上的多肉植物图鉴信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

/*
    name:多肉图鉴采集爬虫
    采集的网址是:http://www.drzj.net/duoroutujian
*/

// http://www.drzj.net/duoroutujian/service/getTuJianList.php
// http://www.drzj.net/duoroutujian/service/getTjDetail.php
var scanUrl = 'http://www.drzj.net/duoroutujian/service/getTuJianList.php';
var contentUrl = 'http://www.drzj.net/duoroutujian/service/getTjDetail.php';
var pageSize = 24;
var isInitUrlFlag = false;
var resultCount = 0;
var global_kid = 0; // 分类 0的话查询全部

/*
  景天科    1
  百合科    2
  仙人掌科    3
  番杏科    4
  大戟科    5
  龙舌兰科    6
  菊科    7
  萝藦科    8
  马齿苋科    9
  夾竹桃科    10
  牻牛儿苗科    11
  鸭跖草科    12
  胡椒科    13
  龙树科    14
  风信子科    15
  石蒜科    16
  唇形科    17
  苦苣苔科    18
  西番莲科    19
  桑科    20
  葡萄科    21
  山药科薯预科    22
  葫芦科    23
*/

var configs = {
    domains: ["drzj.net"],
    scanUrls: [scanUrl],
    contentUrlRegexes: ["http://www\\.drzj\\.net/duoroutujian/service/getTjDetail\\.php\\?b=\\d+"],
    helperUrlRegexes: ["http://www\\.drzj\\.net/duoroutujian/service/getTuJianList\\.php\\?a=\\d+"], //可留空
    // enableProxy: true,
    interval: 3000,
    fields: [
        {
            name: "title",
          	alias: '名字',
            selector: "$.info.[0].name", //默认使用XPath
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },
        {
            name: "description",
         		alias: '简介',
          	selector: "$.info.[0].description",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },
        {
            name: "gallery",
            alias: '图集',
          	selector: "$",
          	repeated: true,
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },/*{
            // pid
            name: "pid",
            selector: "$.info.[0].pid",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },*/{
            name: "classes",
          	alias: '大类',
            selector: "$.info.[0].kname",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "ld_name",
          	alias: '拉丁名',
            selector: "$.info.[0].ld_name",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "price_des",
          	alias: '市场估价',
            selector: "$.info.[0].price_des",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "season",
          	alias: '植物季节',
            selector: "$.info.[0].season",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "reproduce",
          	alias: '繁殖',
            selector: "$.info.[0].reproduce",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "sun",
          	alias: '日照',
            selector: "$.info.[0].sun",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        },{
            name: "water",
          	alias: '浇水量',
            selector: "$.info.[0].water",
          	 //required: true,
          	 selectorType: SelectorType.JsonPath
        }
    ]
};

function addScanUrl(site, url, pageNo, sid, kid) {
  sid = sid | 0;
  kid = kid | 0;
  var options = {
       method: "POST",
       data: {
         page: pageNo,
         sid: sid,
         kid: kid
       }
     };
  site.addUrl(url, options);
}

configs.beforeCrawl = function(site) {
   site.addHeader("Refer", "http://www.drzj.net/duoroutujian/");
   var tmpUrl = scanUrl + '?a=1';
   addScanUrl(site, tmpUrl, 1, 0, global_kid);
};

configs.onProcessHelperPage = function(page, content, site) {
  	 var jsonObj = JSON.parse(page.raw);
  
  	 if (!isInitUrlFlag) {
       // 添加列表页
       isInitUrlFlag = true;
       var pages = Math.ceil(jsonObj.total / pageSize);
       console.log('total:' + jsonObj.total + '\tpages:' + pages);
       for (var pageNo=2; pageNo<=pages; pageNo++) {
         var tmpUrl = scanUrl + '?a=' + pageNo;
         addScanUrl(site, tmpUrl, pageNo, 0, global_kid);
       }

    }
    return false;
};

configs.afterDownloadPage = function(page, site) {
   if (page.url.indexOf('service')>0) {
     var data = JSON.parse(page.raw); 
      if (page.url.indexOf('getTuJianList')>0) {
         var len = data.list.length;
         for (var i=0; i<len; i++) {
            var tmpItem = data.list[i];
           var pid = tmpItem.pid;
            var options = {
              method: "POST",
              data: {
                pid:pid
              }
            };
            var tmpUrl = contentUrl + '?b=' + pid;
            site.addUrl(tmpUrl, options);
        }
        return '';
     } else {
       console.log((++resultCount) + '\t' + data.info[0].name);
     }
   }
    return page;
};

configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "gallery") { // 抓取图集所有url
      var jsonObj = JSON.parse(data); 
      // http://img.drzj.net/duotoutujian/data/img/219/thumbnail/1421134669-7439-200-200.jpg
      // http://img.drzj.net/duotoutujian/data/img/219/orginal/1421134673-6452-640-854.jpg
      var pic1 = ''; // 缩略图
      var pic2 = ''; // 原图
      var picArr = [];
      for (var i=0; i<jsonObj.images.length; i++) {
        var tmpItem = jsonObj.images[i];
        var urlPrefix = 'http://img.drzj.net/duotoutujian/data/img/'+tmpItem.pid;
        pic1 = urlPrefix + '/thumbnail/' + tmpItem.imgName; // 缩略图
        pic2 = urlPrefix + '/orginal/' + tmpItem.largeImgName; // 原图
        picArr.push(pic2);
      }
      return picArr;
    } else if (fieldName == 'water') { // 浇水量
      data = '一个月浇水' + data + '次';
    } else if (fieldName == 'sun') { // 日照
      data = '每天日照' + data + '小时';
    }
    return data;
};

var crawler = new Crawler(configs);
crawler.start();
