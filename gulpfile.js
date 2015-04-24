// 引入 gulp
var gulp = require('gulp'); 

// 引入组件
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var path = require('path');
var chalk = require('chalk');
var minify = require('gulp-minify-css');
var inject = require('gulp-inject');
var fs = require('fs');
var merge = require('merge');
var nodemon = require('gulp-nodemon');


function getFolder(dir){
    return fs.readdirSync(dir)
        .filter(function(file){
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

// 检查脚本
gulp.task('lint', function() {
    gulp.src('./public/dev/js/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// 编译Less
gulp.task('less', function() {
    gulp.src('./public/dev/less/_*.less')
        .pipe(rename(function(path){
            path.basename=path.basename.replace(/^_/,'');
        }))
        .pipe(less())
        .pipe(minify())
        .pipe(gulp.dest('./public/assets/css/'));
});

var scriptsPath = './public/dev/js/';

// 合并，压缩文件
gulp.task('scripts', function() {
    var folders = getFolder(scriptsPath);
    var tasks = folders.map(function(folder){
        return gulp.src(path.join(scriptsPath, folder, '/*.js'))
            .pipe(concat(folder+".js"))
            .pipe(gulp.dest('./public/assets/js/'))
            .pipe(uglify())
            .pipe(rename(folder+'.min.js'))
            .pipe(gulp.dest('./public/assets/js/'))
    });
    return merge(tasks);
});


gulp.task('watch',function() {     
    var watchCss = gulp.watch('./public/dev/less/*.less',['less']);
    var watchJs = gulp.watch('./public/dev/js/**/*.js',['scripts']);
    watchCss.on('change',function(event){
        console.log("file: "+chalk.red.bold(event.path)+" done!");
    });
    watchJs.on('change',function(event){
        console.log("file: "+chalk.red.bold(event.path)+" done!")
    });
})

gulp.task('develop', function(){
    nodemon({
        script:'app.js',
        ignore:'.ignore'
    })
    .on('restart',function(){
        console.log('restarted!');
    })
})

// 默认任务 
gulp.task('default',['lint','less','scripts','watch','develop'],function(){
    console.log(chalk.red.bold("************ ")+chalk.green.bgGreen.bold("start watch")+chalk.red.bold(" ************")); 
});
