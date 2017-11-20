/**
* 该清洗应用主要的功能是对虎嗅网文章的爬取结果进行一定的处理，支持原生JavaScript
* 请在神箭手云上运行代码：http://docs.shenjian.io/overview/guide/develop/cleaner.html

* 该应用依赖Demo中的<简单的文章爬虫Demo-雷锋网文章>
* 1.请先导入<简单的文章爬虫Demo-雷锋网文章>
* 2.点击运行爬虫
* 3.在设置中将当前清洗应用的输入数据选择为该爬虫的爬取数据
* 4.启动清洗
**/
var configs = {
  fields: [
    {
      name: "article_title",
      required: true 
    },
    {
      name: "article_content",
      required: true
    },
    {
      name: "article_publish_time",
      required: true
    },
    //删除了爬虫中的作者(article_author)字段
    {
      //该字段为新增字段
      name:"article_from"
    }
  ]
};

configs.onEachRow = function(row, dataFrame) {
  //去除所有标题中含有苹果的新闻
  if (row.data.article_title.indexOf("苹果") != -1) {
    return null;
  }
  //读取爬虫中的爬取链接字段，并赋值给新增的article_from
  row.data.article_from = "来源：" + row.extraData.__url;
  //将正文中的雷锋网都替换成神箭手
  row.data.article_content = row.data.article_content.replace(/雷锋网/g, "神箭手");
  
  //由于fields中没有显式申明，爬虫中的作者(article_author)字段自动被删除
  return row;
}

var cleaner = new Cleaner(configs);
cleaner.start();
