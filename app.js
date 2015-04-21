var express = require('express')
var path = require('path')
var mongoose = require('mongoose')
var _ = require('underscore')
var Movie = require('./models/movie')
var bodyParser = require('body-parser');
var app = express()
var port = process.env.PORT || 3000

mongoose.connect('mongodb://localhost/movie')

app.set('views', './views/pages')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: false }))
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

// detail page
app.get('/movie/:id', function(req, res) {
	var _id = req.params.id
	Movie.findById(_id, function(err, movie) {
		res.reder('detail',{
			title: 'movie ' + movie.title,
			movie: movie
		})
	})
})

// admin page
app.get('/admin/movie', function(req, res) {
	res.render('admin',{
		title: "movie 后台录入页",
		movie:{
			title:"1",
			doctor:"2",
			country:"3",
			language:"4",
			poster:"5",
			flash:"6",
			year:"7",
			summary:"8"
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
	var _id = req.body._id
	var movieObj = {
		"title":req.body.title,
		"doctor":req.body.doctor,
		"country":req.body.country,
		"language":req.body.language,
		"poster":req.body.poster,
		"year":req.body.year,
		"summary":req.body.summary
	}
	var _movie
	if(_id !== ''){
		Movie.findById(_id, function(err, movies) {
			if (err) {
				console.log(err);
			}

			_movie = _.extend(movie, movieObj)
			_movie.save(function(err, movie) {
				if (err) {
					console.log(err);
				}
				res.redirect('/movie/' + _id)
			})
		})
	}else{
		_movie = new Movie({
			doctor: movieObj.doctor,
			title: movieObj.title,
			country: movieObj.country,
			langugae: movieObj.language,
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
app.get('/admin/list', function(req, res){
	var _id = req.qurey._id

	if(id){
		Movie.remove({_id: _id}, function(err, movie){
			if(err){
				console.log(err);
			}else{
				res.json({success: 1})
			}
		})
	}
})