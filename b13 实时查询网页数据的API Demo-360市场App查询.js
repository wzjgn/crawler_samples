/*
	该API接口实时抓取某应用在360市场的评分和下载数等信息，并返回JSON格式的数据
    
    神箭手云_API接口开发
    支持原生JavaScript
    开发教程：http://docs.shenjian.io/develop/summary/summary.html
    请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/api.html
*/
var soft_id = "3892415";//@required(soft_id, 要查询的应用id, 比如：http://zhushou.360.cn/detail/index/soft_id/3892415 这个应用的id就是url中的3892415)

var configs = {
  domains: ["zhushou.360.cn"], //要查询的网站域名
  scanUrls: ["http://zhushou.360.cn/detail/index/soft_id/"+soft_id],// 根据输入的id可以得到要查询的网页url
  fields: [ // 从页面源码中抽取需要的数据。API只抽取scanUrls中的网页，并且不会再自动发现新链接
    {
      name: "app_name",
      alias: "应用名称",
      selector: "//h2[@id='app-name']/span/text()",  //使用xpath抽取数据
      required: true 
    },
    {
      name: "app_logo",
      alias: "logo图",
      selector: "//div[contains(@class,'product')]//img/@src"
    },
    {
      name: "score",
      alias: "评分",
      selector: "//span[contains(@class,'votepanel')]/text()"
    },
    {
      name: "downloads_count",
      alias: "下载数",
      selector: "//span[contains(text()[1],'下载：')]/text()"
    },
    {
      name: "size",
      alias: "大小",
      selector: "//span[contains(text()[1],'下载：')]/following-sibling::span"
    }
  ]
};

configs.afterExtractField = function (fieldName, data, page, site) {
  if(fieldName == "downloads_count"){
    // 去掉抓取下来的下载数里的 下载： 几个字
    return data.replace("下载：","");
  }
  return data;
};

// 启动网页下载和处理
var fetcher = new Fetcher(configs);
fetcher.start();
