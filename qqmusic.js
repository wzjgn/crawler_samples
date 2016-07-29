/*使用javascript编写的爬虫源码（神箭手开发者kb199276投稿作品），用于爬取qq音乐的歌单信息。
代码粘贴到神箭手云爬虫平台（http://www.shenjianshou.cn/）上就可以直接跑了，不需要安装编译环境。要爬取其他网站，可以更改源码即可。
代码执行具体步骤请参考：https://github.com/ShenJianShou/crawler_samples/blob/master/%E5%A6%82%E4%BD%95%E6%89%A7%E8%A1%8C%E6%A0%B7%E4%BE%8B%E4%BB%A3%E7%A0%81.txt
*/

var configs = {
    domains: ["y.qq.com","i.y.qq.com"],
    scanUrls: ["http://i.y.qq.com/s.plcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?categoryId=10000000&sortId=1&sin=0&ein=19&format=jsonp&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=MusicJsonCallback&needNewCode=0"],
    contentUrlRegexes: ["http://y\\.qq\\.com/#type=taoge&id=\\d+"],
    helperUrlRegexes: ["http://i\\.y\\.qq\\.com/s\\.plcloud/fcgi-bin/fcg_get_diss_by_tag\\.fcg\\?categoryId=10000000&sortId=1&sin=\\d+&ein=\\d+&format=jsonp&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=MusicJsonCallback&needNewCode=0"], 
    fields: [
       {
            name: "list_ID",
                alias: "歌单ID",
            sourceType: SourceType.UrlContext,
            selectorType: SelectorType.JsonPath,
            selector: "$.dissid",
            required: true
        },
        {
            name: "list_name",
            alias: "歌单名",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            required: true
        },
        {
            name: "list_creator",
            alias: "创建人",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            required: true
        },
        {
            name: "list_creator_QQ",
            alias:"创建人QQ",
            sourceType: SourceType.UrlContext,
            selectorType: SelectorType.JsonPath,
            selector: "$.creator.qq",
            required: true
        },
        {
            name: "list_cover",
            alias:"封面图",
            sourceType: SourceType.UrlContext,
            selectorType: SelectorType.JsonPath,
            selector: "$.imgurl",
            required: true
        },
        {
            name: "list_createTime",
            alias:"创建时间",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            required: true
        },
        {
            name: "list_listenerNumber",
            alias:"收听人数",
            sourceType: SourceType.UrlContext,
            selectorType: SelectorType.JsonPath,
            selector: "$.listennum",
            required: true
        },
        {
            name: "list_score",
            alias:"评分",
            sourceType: SourceType.UrlContext,
            selectorType: SelectorType.JsonPath,
            selector: "$.score",
            required: true
        },
        {
            name: "list_introduction",
            alias:"歌单简介",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            required: true
        },
        {
            name: "list_label",
            alias:"标签",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            repeated: true
         },
         {
            name: "list_songList",
            alias:"歌曲列表",
            sourceType: SourceType.AttachedUrl,
            attachedUrl: "http://i.y.qq.com/qzone-music/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&jsonpCallback=jsonCallback&nosign=1&disstid={list_ID}&g_tk=5381&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=utf-8&notice=0&platform=yqq&jsonpCallback=jsonCallback&needNewCode=0",
            selectorType: SelectorType.Regex,
            selector: "\\((.+)\\)",
            repeated: true
         }
    ]
};
configs.beforeCrawl = function(site) {
    site.addHeader("Referer", "http://y.qq.com/y/static/taoge/taoge_list.html");
    site.addCookies("pgv_pvi=3391097856; pgv_info=ssid=s4988394520; ts_last=y.qq.com/y/static/taoge/taoge_list.html; pgv_pvid=8876973598; ts_uid=1713103108;");
};
configs.onProcessHelperUrl = function(url, content, site){
    var json = content.slice(content.indexOf("MusicJsonCallback")+18, -1);
    var jsonObj = JSON.parse(json);
    var id = 0;
    for (var i = 0, n = jsonObj.data.list.length; i < n; i++) {
        var item = jsonObj.data.list[i];
        id = item.dissid;
          var options = {
          method: "get",
          contextData: item
      };
        site.addUrl("http://y.qq.com/#type=taoge&id="+id, options);
    }
    var currentSin = parseInt(url.substring(url.indexOf("sin=")+4, url.indexOf("&ein")));
    var currentEin = parseInt(url.substring(url.indexOf("ein=")+4, url.indexOf("&format")));
    var Sin = currentSin + 20;
    var Ein = currentEin + 20;
    var nextUrl = url.replace("sin=" + currentSin, "sin=" + Sin);
    nextUrl = nextUrl.replace("ein=" + currentEin, "ein=" + Ein);
    site.addUrl(nextUrl);
    return true;
};
configs.afterExtractField = function(fieldName, data, page) {
    if (fieldName == "list_createTime") {
      var jsonObjCtime = JSON.parse(data);
      return jsonObjCtime.cdlist[0].ctime.toString();
    }else if(fieldName == "list_score"){
      if (data === "0"){
        return "无评分";
      }
    }else if(fieldName == "list_introduction"){
        var jsonObj = JSON.parse(data);
      return htmlEntityDecode(jsonObj.cdlist[0].desc);
    }else if(fieldName == "list_creator"){
        var jsonObjNick = JSON.parse(data);
      return htmlEntityDecode(jsonObjNick.cdlist[0].nick);
    }else if(fieldName == "list_name"){
        var jsonObjDissname = JSON.parse(data);
      return htmlEntityDecode(jsonObjDissname.cdlist[0].dissname);
    }else if (fieldName == "list_cover") {
        return cacheImg(data);
    }else if(fieldName == "list_label"){
      var jsonObjTags = JSON.parse(data[0]);
      data.pop();
      for (var i = 0, n = jsonObjTags.cdlist[0].tags.length; i < n; i++) {
      var itemTag = jsonObjTags.cdlist[0].tags[i].name;
      data.push(itemTag);
    }
      return data;
    }else if(fieldName == "list_songList"){
      var song_url = "http://y.qq.com/#type=song&mid=003plbii2C2yiJ&tpl=yqq_song_detail&play=0"
      var album_url = "http://y.qq.com/#type=album&mid=003cQnI43qjMVC&play=0"
      var jsonObjSonglist = JSON.parse(data[0]);
      data.pop();
      for (var j = 0, m = jsonObjSonglist.cdlist[0].songlist.length; j < m; j++) {
        var songlist =  {"song_url":"","song_name":"","song_album":"","song_auther":"","song_duration":"","album_url":""};
        songlist["song_url"] = song_url.replace("mid=003plbii2C2yiJ", "mid=" +jsonObjSonglist.cdlist[0].songlist[j].songmid);
        songlist["song_name"] = jsonObjSonglist.cdlist[0].songlist[j].songname;
        songlist["song_album"] = jsonObjSonglist.cdlist[0].songlist[j].albumname;
        songlist["song_auther"] = jsonObjSonglist.cdlist[0].songlist[j].singer[0].name;
        songlist["song_duration"] = (Math.floor(Number(jsonObjSonglist.cdlist[0].songlist[j].interval)/60)).toString()+"分"+(Number(jsonObjSonglist.cdlist[0].songlist[j].interval)%60).toString()+"秒";
        songlist["album_url"] = album_url.replace("mid=003cQnI43qjMVC", "mid=" +jsonObjSonglist.cdlist[0].songlist[j].albummid);
        data.push(songlist);
      }
      return data;
    }
    return data;
};
var crawler = new Crawler(configs);
crawler.start();
