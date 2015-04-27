var express = require('express')
var path = require('path')
var mongoose = require('mongoose')
var _ = require('underscore')
var Movie = require('./models/movie')
var User = require('./models/user')
var Utils = require('./lib/tools/utils')
var bodyParser = require('body-parser')
var app = express()
var port = process.env.PORT || 3000

var config = Utils.getJSONSync("config.json")

mongoose.connect('mongodb://localhost/movie')

app.set('views', './views/pages')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public/assets')))
app.locals.moment = require("moment")
app.listen(port)

console.log('started on port ' + port)

// index page
app.get('/', function(req, res) {
	Movie.fetch(function(err, movies) {
		if (err) {
			console.log(err)
		}
		res.render('index',{
			title: "movie 首页",
			movies:movies
		})
	})
})

// sign up
app.post('/user/signup', function(req, res){
	var _user = req.body.user

	// user name check	
	User.find({name:_user.name},function(err, user){
		if(err){console.log(err)}
		if(user){
			return res.redirect('/')
		}else{
			var user = new User(_user)
			user.save(function(err, user){
				if(err){
					console.log(err)
				}

				res.redirect("/admin/userlist")
			})
		}
	})
})


// sign in
app.post('/user/signin', function(req, res){
	var _user = req.body.user
	var name = _user.name
	var password = _user.password

	User.findOne({name: name}, function(err, user){
		if(err){console.log(err)}

		if(!user){
			return res.redirect("/")
		}

		user.comparePassword(password, function(err, isMatch){
			if(err){console.log(err)}

			if(isMatch){
				return res.redirect('/')
			}else{
				console.log('Password is not matched')
			}
		})
	})
})

// userlist page
app.get('/admin/userlist', function(req, res) {
	User.fetch(function(err, users){
		if(err){
			console.log(err)
		}

		res.render('userlist',{
			title: "user 列表页",
			users:users
		})
	})
})


// detail page
app.get('/movie/:id', function(req, res) {
	var _id = req.params.id
	Movie.findById(_id, function(err, movie) {
		res.render('detail', {
			title: 'movie' + movie.title,
		 	movie: movie
		})
	})
})

// admin page
app.get('/admin/movie', function(req, res) {
	res.render('admin',{
		title: "movie 后台录入页",
		movie:{
			title:"",
			doctor:"",
			country:"",
			language:"",
			poster:"",
			flash:"",
			year:"",
			summary:""
		}
	})
})

// admin update movie
app.get('/admin/update/:id', function(req, res){
	var _id = req.params.id

	if(_id){
		Movie.findById(_id, function(err, movie){
			res.render('admin', {
				title: 'movie 后台更新页',
				movie: movie
			})
		})
	}
})

// admin post movie
app.post('/admin/movie/new', function(req, res){
	var id = req.body.movie._id
	var movieObj = req.body.movie
	var _movie
	if(id !== ''){
		Movie.findById(id, function(err, movie) {
			if (err) {
				console.log(err);
			}
			_movie = _.extend(movie, movieObj)
			_movie.save(function(err, movie) {
				if (err) {
					console.log(err);
				}
				res.redirect('/movie/' + id)
			})
		})
	}else{
		_movie = new Movie({
			doctor: movieObj.doctor,
			title: movieObj.title,
			country: movieObj.country,
			language: movieObj.language,
			year: movieObj.year,
			poster: movieObj.poster,
			summary: movieObj.summary,
			flash: movieObj.flash
		})

		_movie.save(function(err, movie) {
			if (err) {
				console.log(err);
			}
			res.redirect('/movie/' + movie._id)
		})
	}
})


// list page
app.get('/admin/list', function(req, res) {
	Movie.fetch(function(err, movies){
		if(err){
			console.log(err)
		}

		res.render('list',{
			title: "movie 列表页",
			movies:movies
		})
	})
})

// list delete movie
app.delete('/admin/list', function(req, res){
	var id = req.query.id
	if(id){
		Movie.remove({_id: id}, function(err, movie){
			if(err){
				console.log(err);
			}else{
				res.json({success: 1})
			}
		})
	}
})
