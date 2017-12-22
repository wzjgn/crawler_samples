/*
    神箭手云_爬虫开发示例代码
    支持原生JavaScript
    开发教程：http://docs.shenjian.io/develop/summary/summary.html
    请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/crawler.html
    
    本爬虫爬取的是5sing的原创歌曲信息（http://5sing.kugou.com/yc/list?t=-1），包括文件下载地址
    因为5sing的歌曲下载地址必须要登录可见，所以需要先模拟登录：详见代码中的login函数
*/

// 运行和测试时先输入5sing账号信息，爬虫会自动模拟登录
var username = "";//@input(username, 5sing登录账号（歌曲下载地址是登录可见的）)
var password = "";//@password(password, 5sing登录密码)

var configs = {
    domains: ["5sing.kugou.com"],
    scanUrls: [],
    contentUrlRegexes: [/http:\/\/5sing\.kugou\.com\/yc\/\d+\.html/],
    helperUrlRegexes: [/http:\/\/5sing\.kugou\.com\/yc\/list\?t=-1(.*p=\d+.*)?/],
    interval: 10000,
    fields: [
        {
            name: "sid",
            alias: "歌曲id",
            selector: "//*[@id='func_Down']/@data-songid",
            required: true,
            primaryKey : true // 歌曲id作为去重字段
        },
        {
            name: "name",
            alias: "歌曲名",
            selector: "//div[contains(@class,'view_tit')]/h1",
            required: true 
        },
        {
            name: "singer",
            alias: "音乐人",
            selector: "//h3[contains(@class,'user_name')]/a/text()"
        },
        {
            name: "upload_time",
            alias: "上传时间",
            selector: "//em[contains(text()[1],'上传时间')]/../text()"
        },
        {
            name: "download_settting",
            alias: "下载设置",
            selector: "//em[contains(text()[1],'下载设置')]/../text()"
        },
        {
            name: "download_link",
            alias: "文件下载地址",
            sourceType: SourceType.AttachedUrl, // 通过异步请求抽取数据
            attachedUrl: "http://service.5sing.kugou.com/song/getPermission?songId={sid}&songType=1",
            selectorType: SelectorType.JsonPath,
            selector: "$.data.fileName"
        }
    ]
};

configs.initCrawl = function (site) {
  if(!username || !password){
    system.exit("请先设置5sing的账户名和密码！");
  }else{
    if(login(site)){
      // 添加要爬取的歌曲列表首页url
      site.addScanUrl("http://5sing.kugou.com/yc/list?t=-1");
    }
  }
};

configs.onChangeProxy = function (site, page) {
  // 如果ip切换了，需要重新登录（如果没有使用代理ip，该函数不会调用）
  login(site);
};

/*
  模拟登录的函数，神箭手爬虫会自动保存cookies
*/
function login(site){
  // 登录请求的地址
  var loginUrl = "http://5sing.kugou.com/login/";
  // 请求参数
  var options = {
    method: "post",
    data: {
      RefUrl: "http%3A%2F%2F5sing.kugou.com%2Findex.html",
      txtUserName: username,
      txtPassword: password,
      txtCheckCode: "验证码"
    },
    result: "response" //返回包含状态码等信息的对象。不写这句表示返回请求的html结果
  };
  // 发送登录请求
  var response = site.requestUrl(loginUrl, options);
  // 根据请求返回的状态，判断并返回是否登录成功（51sing登录成功会返回302自动跳转）
  if(response.statusCode == "302"){
    console.log("登录成功！");
    return true;
  }else{
    console.log("登录失败！返回信息："+JSON.stringify(response));
    return false;
  }
}

var crawler = new Crawler(configs);
crawler.start();
