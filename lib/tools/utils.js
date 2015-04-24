/**
 * @author: zheng.fuz[at]alibaba-inc.com
 * @date: 2012-07-05 14:33
 * 工具集
 */

var fs = require("fs"),
	pathModule = require("path"),
	urlModule = require("url"),
	utilModule = require("util"),
	http = require('http'),
	https = require('https'),
	querystring = require('querystring'),
	S = require('kissy').KISSY,
	exec = require('child_process').exec,
	crypto = require('crypto');

var	login = null;
var Utils = {};

// 写入文件流
Utils.writeStream = function(descStream, targetPath, callback){
	var targetStream = fs.createWriteStream(targetPath);
	descStream.pipe(targetStream);
	descStream.on('end', function(){
		// 暂时这样写，希望寻求更好的实现方式
		callback && setTimeout(callback, 10);
	});
};

// 获取文件
Utils.getFileSync = function(path, encoding){
	if(encoding === undefined){
		encoding = 'utf8';
	}
	var fileCon = '';
    if(fs.existsSync(path)){
    	fileCon = fs.readFileSync(path, encoding);
    }
    return fileCon;
};
// 获取文件json对象
Utils.getJSONSync = function(path){
    var fileCon = Utils.getFileSync(path),
    	data = null;
    if(fileCon){
    	fileCon =fileCon.replace(/ \/\/[^\n]*/g, '');
    	try{
			data = JSON.parse(fileCon);
    	}catch(e){
    		console.log(e);
			return null;
    	}
    }
    return data;
};

var config = Utils.getJSONSync("config.json");

// 获取远程json对象
Utils.getJSON = function(url, callback, errback){
	Utils.getUrl(url, function(data){
		var json = null;
    	try{
			json = JSON.parse(data);
    	}catch(e){
    		//console.log(e);
    		errback && errback(e);
    		return false;
    	}
		callback && callback(json);
	}, errback);
};
Utils.postJSON = function(url, data, callback, errback){
	var sendData = S.isPlainObject(data) ? JSON.stringify(data) : data;	
	Utils.postUrl(url, sendData, null, function(data){
		var json = null;
    	try{
			json = JSON.parse(data);
    	}catch(e){
    		//console.log(e);
    		errback && errback(e);
    		return false;
    	}
		callback && callback(json);
	}, errback);
};
// 发送get请求
Utils.getUrl = function(url, callback, errback){
	var resultData = '',
		option = urlModule.parse(url),
		HttpType = option.protocol.indexOf('https') > -1 ? https : http;

	HttpType.get(url, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(data){
			resultData += data;
		});
		res.on('end', function(){
			callback && callback(resultData);			
		});
	}).on('error', function(e) {
		errback && errback(e.message);
	});
};

// 发送post请求
Utils.postUrl = function(url, data, headers, callback, errback){
	var resultData = '',
		option = urlModule.parse(url),
		sendData = S.isPlainObject(data) ? querystring.stringify(data) : data,
		req,
		HttpType;

	option.method = 'POST';	
	option.headers = {  
		"Content-Type": 'application/x-www-form-urlencoded',  
		"Content-Length": sendData.length  
	};
	if(headers){
		option.headers = S.merge(option.headers, headers);
	}
	HttpType = option.protocol.indexOf('https') > -1 ? https : http;
	req = HttpType.request(option, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(data){
			resultData += data;
		});
		res.on('end', function(){
			callback && callback(resultData);			
		});
	})
	req.on('error', function(e) {
		errback && errback(e.message);
	});
	req.write(sendData + "\n");  
    req.end(); 
};

// 新建文件
Utils.writeFile = function(file, data, callback) {
    var flags = {
        flags: "w", encoding: "utf8", mode: 0644
    };
	fs.writeFile(file, data, flags, function(err) {
		if(err){
			if (err.message.match(/^EMFILE, Too many open files/)) {
				//console.log('Writefile failed, too many open files (' + args[0] + '). Trying again.', 'warn', 'files');
				setTimeout(Utils.writeFile, 100, file, data, flags);
				return;
			}else{
				throw err;
			}
		}
		if(callback){
			callback();
		}
	});
};
// 新建JSON文件
Utils.writeJsonFile = function(destPath, data, isFormat, callback){
	if(isFormat){
		data = JSON.stringify(data, null, 4);
	}else{
		data = JSON.stringify(data);
	}
	Utils.writeFile(destPath, data, function(){
		//console.log('build ' + destPath + ' ok!');
		if(callback){
			callback(data);
		}
	});
};

// 递归执行代码
// deepFunc: 单项值、回调
// cumulateFunc: 单项结果，单项值、deep
var deepDo = function(list, deepFunc, cumulateFunc, callback, deep){
	deep = deep || 0;
	if(!list[deep]){
		if(callback){
			callback();
		}						
		return;
	}		
	deepFunc(list[deep], function(result){
		if(cumulateFunc){
			cumulateFunc(result, list[deep], deep);
		}
		// 递归
		if(deep + 1 < list.length){
			deepDo(list, deepFunc, cumulateFunc, callback, deep + 1);
		}else{	
			if(callback){
				callback();
			}						
		}
	});
};
Utils.deepDo = deepDo;
// 执行命令
Utils.exec = function(command, callback){
	exec(command, function(error, stdout, stderr){
		//console.log(command + ' 执行中...');
		if(stdout){
			//console.log('exec stdout: ' + stdout);
		}
		if(stderr){
			//console.log('exec stderr: ' + stderr);
		}
		if (error) {
			//console.log('exec error: ' + error);
		}
		//console.log(command + ' 执行完毕！');
		if(callback){
			callback();
		}
	});
};

// 格式化日期
Utils.formatDate = function(date, format) {
	format = format || 'yyyy-MM-dd hh:mm:ss';
	if(!date){
		return '';
	}
	var now = new Date(date);
	var o = {
		"M+": now.getMonth() + 1, //month
		"d+": now.getDate(), //day
		"h+": now.getHours(), //hour
		"m+": now.getMinutes(), //minute
		"s+": now.getSeconds(), //second
		"q+": Math.floor((now.getMonth() + 3) / 3), //quarter
		"S": now.getMilliseconds() //millisecond
	}
	if (/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (now.getFullYear() + "")
			.substr(4 - RegExp.$1.length));
	}

	for (var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			format = format.replace(RegExp.$1,
				RegExp.$1.length == 1 ? o[k] :
				("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
};
// 批量格式化日期
Utils.formatDateBatch = function(list, field, format){
	field = field || 'createDate';
	S.each(list, function(item){
		item[field] = Utils.formatDate(item[field], format);
	});
	return list;
};

// 获取日期间隔
Utils.getDateRange = function(dateStart, dateEnd){
	var start = dateStart ? new Date(dateStart) : new Date(),
		end = dateEnd ? new Date(dateEnd) : new Date(),
		range = end - start,
		msLevel = 1000,
		sLevel = msLevel * 60,
		mLevel = sLevel * 60,
		hLevel = mLevel * 24,
		dLevel = hLevel * 7,
		wLevel = hLevel * 30,
		MLevel = hLevel * 365,
		rangeText = '';
	
	if(range < msLevel){
		// 刚刚
		rangeText = '1秒';
	}else if(range < sLevel){
		// xx秒
		rangeText = parseInt(range/msLevel) + '秒';
	}else if(range < mLevel){
		// xx分钟
		rangeText = parseInt(range/sLevel) + '分钟';
	}else if(range < hLevel){
		// xx小时
		rangeText = parseInt(range/mLevel) + '小时';
	}else if(range < dLevel){
		// xx天
		rangeText = (range/hLevel).toFixed(1) + '天';
	}else if(range < wLevel){
		// xx周 xx天
		var w = parseInt(range/dLevel),
			d = parseInt(range/hLevel) - w * 7;
		rangeText = w + '周';
		if(d){
			rangeText = rangeText + '零' + d + '天';
		}
	}else if(range < MLevel){
		// xx个月 xx天
		var M = parseInt(range/wLevel),
			d = parseInt(range/hLevel) - M * 30;
		rangeText = M + '个月';
		if(d){
			rangeText = rangeText + '零' + d + '天';
		}
	}else{
		// xx年 xx个月
		var y = parseInt(range/MLevel),
			M = parseInt(range/wLevel) - y * 12;
		rangeText = y + '年';
		if(M){
			rangeText = rangeText + '零' + M + '个月';
		}
	}
	return rangeText;
};

// 获取页头信息
Utils.headerInfo = function(req, res, next){
	login = login || require('../user/login');
	var headerInfo = {};
	// 获取登录信息
	login.getInfo(req, function(info){
		headerInfo = S.merge(headerInfo, info);
		// 超级管理员
		if(S.inArray(headerInfo.uid, config.superAdmin)){
			headerInfo.permission = 'admin';
		}
		req.systemHeaderInfo = headerInfo;
		next && next();
	});
};

// MD5 加密
Utils.md5 = function(msg){
	var newHash = crypto.createHash('md5');
	newHash.update(msg, 'utf8');
	return newHash.digest('hex');
};
// sha1 加密
Utils.sha1 = function(msg){
	var newHash = crypto.createHash('sha1');
	newHash.update(msg, 'utf8');
	return newHash.digest('hex');
};

// 计算金钱时防止出现无限循环小数
Utils.formatResult = function(r){
	return r.toFixed(2) * 1;
};

// 格式化文章的显示
Utils.formatArticle = function(str){
	if(str){
		str = str.replace(/\n/g, '<br>');
	}else{
		srt = '';
	}
	return str;
};

// 格式化输入的值
Utils.formatInput = function(str){
	str = Utils.removeXss(str);
	str = S.trim(str);
	return str;
};
// 防注入过滤
Utils.removeXss = function(str){
	if(str){
		str = str.replace(/\</g, '&lt;');
		str = str.replace(/\>/g, '&gt;');
	}else{
		str = '';
	}
	return str;
};

// 产生数字随机码，默认6位
Utils.randomNum = function(n){
	n = n || 6;
	return (Math.random() + '').slice(2, 2 + n);
};
// 产生随机码 数字+小写字母+大写字母 默认6位
Utils.randomCode = function(n){
	n = n || 6;
	var codeStore = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
		codeStoreLength = codeStore.length,
		code = [];
	for(var i = 0; i < n; i++){
		var r = parseInt(Math.random() * codeStoreLength);
		code.push(codeStore[r]);
	}
	return code.join('');
};

var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
/**
 * base64编码
 * @param {Object} str
 */
Utils.base64encode = function(str){
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
};
/**
 * base64解码
 * @param {Object} str
 */
Utils.base64decode = function(str){
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        /* c1 */
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        }
        while (i < len && c1 == -1);
        if (c1 == -1) 
            break;
        /* c2 */
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        }
        while (i < len && c2 == -1);
        if (c2 == -1) 
            break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        /* c3 */
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61) 
                return out;
            c3 = base64DecodeChars[c3];
        }
        while (i < len && c3 == -1);
        if (c3 == -1) 
            break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        /* c4 */
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61) 
                return out;
            c4 = base64DecodeChars[c4];
        }
        while (i < len && c4 == -1);
        if (c4 == -1) 
            break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
};

// 读取文件夹，过滤 .svn 文件
// type: 'dir', 'file', 'all' - 默认
Utils.readdirSync = function(path, type){
	var files = [],
		_files = [];
	if(fs.existsSync(path)){
		var stats = fs.statSync(path);
		if(stats.isDirectory()){
			_files = fs.readdirSync(path) || [];
		}
	}
	S.each(_files, function(f){
		if(filterDir(f)){
			if(filterFileType(pathModule.join(path, f), type)){
				files.push(f);
			}
		}
	});
	return files;
};

// 读取文件夹-异步，过滤 .svn 文件
Utils.readdir = function(path, callback, type){
	if(fs.existsSync(path)){
		var stats = fs.statSync(path);
		if(stats.isDirectory()){
			fs.readdir(path, function(err, files){
				files = files || [];
				var _files = [];
				S.each(files, function(f){
					if(filterDir(f)){
						if(filterFileType(pathModule.join(path, f), type)){
							_files.push(f);
						}
					}
				});
				callback(err, _files);
			});	
		}
	}
};

// 过滤文件名
var filterDir = function(name){
	var noReadList = ['.svn', '.DS_Store', '._.DS_Store', '.git', '.gitignore'];
	if(!S.inArray(name, noReadList)){
		return true;
	}else{
		return false;
	}
};
// 过滤文件类型
// type: 'dir', 'file', 'all' - 默认
var filterFileType = function(path, type){
	var isDirectory = fs.statSync(path).isDirectory(),
		status = true;
	if(type === 'dir' && !isDirectory){
		status = false;
	}else if(type === 'file' && isDirectory){
		status = false;
	}
	return status;
};

// 删除文件或文件夹
Utils.deletePathSync = function(path){
	if(fs.existsSync(path)){
		var stats = fs.lstatSync(path);
		if(stats.isFile() || stats.isSymbolicLink()){
			fs.unlinkSync(path);
		}else if(stats.isDirectory()){
			fs.readdirSync(path).forEach(function(filename){
				Utils.deletePathSync(pathModule.join(path, filename));
			});
			fs.rmdirSync(path);
		}
		//console.log('delete ' + path + ' ok!');
	}
};
// 重置一个空文件夹
Utils.createNewDirSync = function(path, noReset){
	// 重置
	if(!noReset){
		Utils.deletePathSync(path);
		fs.mkdirSync(path);		
	}else{
		if(!fs.existsSync(path)){
			fs.mkdirSync(path);	
		}	
	}
};
// 拷贝文件夹
Utils.copyDirectory = function(source, dest, callback){
	var checkSource = function(){
		fs.stat(source, function(err, stats){
			if(stats){
				if(stats.isDirectory()){
					Utils.createNewDirSync(dest, true);
					readSource();
				}else{
					console.log('源地址不是文件夹！');
					if(callback){
						callback();
					}
				}
			}else{
				console.log('源地址找不到！');
				if(callback){
					callback();
				}
			}
		});
	};
	var readSource = function(){
		var sourceList = Utils.readdirSync(source);
		deepDo(sourceList, function(f, cback){
			Utils.copyPath(pathModule.join(source, f), pathModule.join(dest, f), cback);
		}, function(){}, callback);
	};
    if(fs.existsSync(source)){
		checkSource();
	}
};
// 拷贝文件
Utils.copyFile = function(source, dest, callback){
	var checkSource = function(){
		fs.lstat(source, function(err, stats){
			if(stats){
				if(stats.isFile()){
					Utils.deletePathSync(dest);				
					readSource();
				}else{
					console.log('源地址不是文件！');
					if(callback){
						callback();
					}
				}
			}else{
				console.log('源地址找不到！');
				if(callback){
					callback();
				}
			}
		});
	};
	var readSource = function(){
		var _read = fs.createReadStream(source, {mode: 0777});
		_read.pipe(fs.createWriteStream(dest, {mode: 0777}));
		_read.on('end', function() {
			console.log('copyfile ' + source + ' ok!');
			if(callback){
				callback();
			}
		});
	};
	
    if(fs.existsSync(source)){
		checkSource();
	}
};
// 拷贝文件或文件夹
Utils.copyPath = function(source, dest, callback){
    if(fs.existsSync(source)){
		var sourceStats = fs.statSync(source);
		
		if(sourceStats){
			if(sourceStats.isFile()){
				Utils.copyFile(source, dest, callback);
			}else if(sourceStats.isDirectory()){
				Utils.copyDirectory(source, dest, callback);
			}
		}else{
			console.log('源路径不存在！');
			if(callback){
				callback();
			}
		}
	}
};




module.exports = Utils;


