/*
  该API从北京市社保局网站（http://www.bjrbj.gov.cn/csibiz/indinfo/login.jsp）实时查询社保缴纳记录。
  因为缴纳记录需要输入验证码、身份证号和查询密码登录后才能查到，所以该API包含了神箭手的验证码自动识别和模拟登录功能。
*/
var uid = "";//@input(uid,查询的身份证号)
var pwd = "";//@input(pwd,社保查询密码，密码错误无法查询【登录地址：http://www.bjrbj.gov.cn/csibiz/indinfo/login.jsp】)
var year = "";//@input(year,查询年份)

var configs = {
    domains:["www.bjrbj.gov.cn"],
    scanUrls: [],
    fields: [ //　４、从入口页页面中抽取缴纳记录
      	{
          name:"records",
          repeated: true,
          selector: "//tr[position()>2]",
          children:[
            {
              name: "month",
              alias:"缴费年月",
              selector: "//td[1]"
            },
            {
                name: "type",
                alias:"缴费类型",
                selector: "//td[2]"
            },
            {
                name: "base",
                alias:"缴费基数",
                selector: "//td[3]"
            },
            {
                name: "fromcom",
                alias:"单位缴费",
                selector: "//td[4]"
            },
            {
                name: "fromself",
                alias:"个人缴费",
                selector: "//td[5]"
            },
            {
                name: "comname",
                alias:"缴费单位名称",
                selector: "//td[6]"
            }
          ]
        }
        
    ]
};

configs.beforeCrawl = function(site){
  if(!uid){
    system.exit("请输入要查询的身份证号");
  }
  if(!pwd){
    system.exit("请输入社保查询密码");
  }
  if(!year){
    system.exit("请输入要查询的年份");
  }
  // １、识别登录页面的验证码，使用神箭手的内置函数 getCaptcha
  var safecodedata = getCaptcha(52, "http://www.bjrbj.gov.cn/csibiz/indinfo/validationCodeServlet.do");
  var safecode = JSON.parse(safecodedata);  
  if(safecode.ret > 0){
    // 验证码识别结果正常返回后，生成登录请求的post参数
    var options = {
      method: "POST",
      data: {
          type:"1",
          flag:"3",
          j_username: uid,
          j_password: pwd,
          safecode:safecode.result
      }
    };
    // ２、发送登录请求模拟登录。神箭手会自动保存cookie，并在以后的请求中使用之前保存的所有cookie
    site.requestUrl("http://www.bjrbj.gov.cn/csibiz/indinfo/login_check", options);
    var timestamp = new Date().getTime();
    // ３、将待查询的缴纳记录页面url添加为入口页，抽取其中的缴纳数据
    site.addScanUrl("http://www.bjrbj.gov.cn/csibiz/indinfo/search/ind/indPaySearchAction!oldage?searchYear="+year+"&time="+timestamp);
  }
};

configs.afterExtractField = function (fieldName, data, page, site) {
    if(data==="-"){
      // 如果缴纳记录中某项数据为空(-)，过滤掉该条缴纳记录
      page.skip("records");
    }
    return data;
};

var fetcher = new Fetcher(configs);
fetcher.start();
