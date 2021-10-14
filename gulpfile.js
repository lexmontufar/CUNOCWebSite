"use strict";

const gulp = require("gulp");
const cache = require("gulp-cache");
const fs = require("fs");
const less = require("gulp-less");
const sass = require("gulp-sass");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const webpackstream = require("webpack-stream");
const gulpLoadPlugins = require('gulp-load-plugins');
const cleanCSS = require('gulp-clean-css');
const runSequence = require('run-sequence');
const imagemin = require("gulp-imagemin");
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const size = require("gulp-size");
const minifyCSS = require('gulp-minify-css');
const critical = require('critical');
const del = require('del');

var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');

const $ = gulpLoadPlugins();
const config = {
    publicDir: './build',
};

gulp.task("styles", () => {
    return gulp.src('src/styles/*.scss')
        .pipe(sass().on('error', function (err) {
          console.log(err.toString());
          this.emit('end');
        }))
        .pipe(gulp.dest('build/css'))
        .pipe(browserSync.stream())
});

gulp.task('webpack-dev', () => {
  return gulp.src('src/js/**/*')
  .pipe(webpackstream(webpackConfig("Develop"), webpack))
  .pipe(gulp.dest('build/js'))
});

gulp.task('webpack', () => {
  return gulp.src('src/js/**/*')
    .pipe(webpackstream(webpackConfig("Production"), webpack))
    .pipe(gulp.dest('build/js'))
});

gulp.task('minify-images', () => {
    return gulp.src(`src/images/**/*.*`)
        .pipe(
            cache(
                imagemin([
                    imagemin.gifsicle({interlaced: true}),
                    imageminJpegRecompress(),
                    imagemin.optipng({optimizationLevel: 5}),
                    imagemin.svgo({plugins: [{removeViewBox: true}]})
                ])
            )
        )
        .pipe(gulp.dest('build/images'))
        .pipe(size({ title: 'images' }))
});

gulp.task('minify-css', gulp.series('styles', () => {
  return gulp.src('build/css/*.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/css'));
}));

gulp.task('clean', () => {
  return del(['build']);
});

gulp.task('nodemon', cb => {
  let started = false;
  return nodemon({
    script: 'app.js'
  }).on('start', () => {
    if (!started) {
      cb();
      started = true;
    }
  });
});


gulp.task('browser-sync', gulp.series('nodemon', () => {
    browserSync.init(null, {
      proxy: 'http://localhost:3000',
      files: ['./**/*.*'],
      port: 7000
    });
  })
);

gulp.task('watch', gulp.series('clean', 'styles', 'minify-images', 'webpack-dev', () => {
  gulp.watch('src/styles/**/*.{scss,css}', gulp.series('styles'));
  gulp.watch('src/js/**/*', gulp.series('webpack-dev'));
}));

gulp.task('watch-dev', gulp.parallel('watch','browser-sync'));

gulp.task('build', gulp.series('clean', 'minify-css','minify-images', 'webpack'));
gulp.task('default', gulp.series('clean', 'styles', 'minify-images','webpack-dev', 'browser-sync'));
gulp.task('qa', gulp.series('browser-sync'));

gulp.task('critical', () => {
  critical.generate({
    base: './',
    inline: true,
    src: 'index.html',
    css: ['build/css/styles.css'],
    dimensions: [{
      width: 320,
      height: 480
    }, {
      width: 768,
      height: 1024
    }, {
      width: 1280,
      height: 960
    }, {
      width: 1920,
      height: 1080
    }],
    dest: 'tmp/build/index.html',
    minify: true,
    extract: false,
    ignore: ['font-face']
  });
});
