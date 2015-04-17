var express = require('express')
var pathModule = require('path')
var bodyParser = require('body-parser');
var app = express()
var port = process.env.PORT || 3000

app.set('views', './views/pages')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(pathModule.join(__dirname, 'bower_components')));
app.listen(port)

console.log('started on port ' + port)

// index page
app.get('/', function(req, res) {
	res.render('index',{
		title: "movie 首页",
		movies:[{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},{
			title: '机械战警',
			_id: 1,
			poster: 'http://r3.yking.com/051560000530EEB63675839160D0B79D5'
		},]
	})
})

// detail page
app.get('/movie/:id', function(req, res) {
	res.render('detail',{
		title: "movie 详情页",
		movie:{
			doctor: 'hesai',
			country: 'us',
			title: 'jxzj',
			year: 2014,
			poster:'http://r3.yking.com/051560000530EEB63675839160D0B79D5',
			language: 'english',
			flash: 'http://player.youku.com/player.php/sid/XNJA1Njc0NTUy/v.swf',
			summary: "safdafsafdsadfasfsa"
		}
	})
})

// admin page
app.get('/admin/movie', function(req, res) {
	res.render('admin',{
		title: "movie 后台录入页"
	})
})

// list page
app.get('/admin/list', function(req, res) {
	res.render('list',{
		title: "movie 列表页",
		movies:[{
			title:'hesai',
			_id:1,
			doctor:'hesai',
			country:'us',
			year:2014,
			poster:'http://r3.yking.com/051560000530EEB63675839160D0B79D5',
			language: 'english',
			flash: 'http://player.youku.com/player.php/sid/XNJA1Njc0NTUy/v.swf',
			summary: "safdafsafdsadfasfsa"
		}]
	})
})