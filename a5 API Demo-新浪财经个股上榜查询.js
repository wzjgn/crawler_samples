/*
  实时获取近5、10、30、60日个股上榜统计数据。包括上榜次数、累积购买额、累积卖出额、净额、买入席位数和卖出席位数。
  
  开发语言：原生JavaScript
  开发教程：http://docs.shenjian.io/develop/summary/summary.html
  请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/api.html
*/
var days="5";//@input(days,统计周期,5、10、30和60日，默认为5日)

var configs = {
    domains: ["finance.sina.com.cn"],
    scanUrls: [],
    fields: [ // API只抽取scanurls中的网页，并且不会再自动发现新链接
        {
            name: "items",
            selector: "//table[@id='dataTable']//tr", 
            repeated: true,
            children: [
              {
                  name: "code",
                  alias: "股票代码",
                  selector: "//td[1]/a/text()", 
                  required: true 
              },
              {
                  name: "name",
                  alias: "股票名称",
                  selector: "//td[2]/a/text()",
                  required: true 
              },
              {
                  name: "count",
                  alias: "上榜次数",
                  selector: "//td[3]" 
              },
              {
                  name: "bamount",
                  alias: "累积购买额(万)",
                  selector: "//td[4]" 
              },
              {
                  name: "samount",
                  alias: "累积卖出额(万)",
                  selector: "//td[5]" 
              },
              {
                  name: "net",
                  alias: "净额(万)",
                  selector: "//td[6]" 
              },
              {
                  name: "bcount",
                  alias: "买入席位数",
                  selector: "//td[7]" 
              },
              {
                  name: "scount",
                  alias: "卖出席位数",
                  selector: "//td[8]" 
              }
            ]
        }
    ]
};

configs.beforeCrawl = function(site){
    if(days!=="5" && days!=="10" && days!=="30" && days!=="60"){
      system.exit("输入的统计周期错误。"); // 停止调用，返回自定义错误信息
    }
    // 根据输入值生成要解析的网页url，并添加到scanurl中
    var url = "http://vip.stock.finance.sina.com.cn/q/go.php/vLHBData/kind/ggtj/index.phtml?last="+days+"&p=1";
    site.addScanUrl(url);
};

var fetcher = new Fetcher(configs);
fetcher.start();
