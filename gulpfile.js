var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var del  = require('del');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var paths = {
  srcRoot: 'src',
  scripts: ['/gitlabtree.js'],
  css: '/main.css',
  libs: '/libs',
  imgs: '/imgs',
  outputPath: 'dist'
};

// 统计task的插件
require('gulp-stats')(gulp);

// 删除outputPath目录
gulp.task('clean', function() {
  del([paths.outputPath]);
});

gulp.task('build', ['static'], function() {
  var libsPath = paths.srcRoot + paths.libs + '/**/*';
  var imgPath = paths.srcRoot + paths.imgs + '/*.png';
  var manifestPath = paths.srcRoot + '/manifest.json';
  gulp.src([libsPath]).pipe(gulp.dest(paths.outputPath + paths.libs));
  gulp.src([imgPath]).pipe(gulp.dest(paths.outputPath + paths.imgs));
  return gulp.src([manifestPath]).pipe(gulp.dest(paths.outputPath));
});

gulp.task('uglify', function () {
  var options = {
    // 是否混淆变量名
    mangle: true,
    // 压缩选项
    compress: {
      drop_console: true, // 非常有用，上线前去掉console信息
      drop_debugger: true // 去掉debugger调试语句
    },
    // 是否不压缩(beautify)代码
    output: {
      beautify: false
    }
  };
  return gulp.src(paths.srcRoot + paths.scripts)
             .pipe(uglify(options))
             .pipe(gulp.dest(paths.outputPath));
});

gulp.task('minify-css', function() {
  return gulp.src(paths.srcRoot + paths.css)
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest(paths.outputPath));
});

gulp.task('static', ['minify-css', 'uglify']);


gulp.task('default', ['build']);

