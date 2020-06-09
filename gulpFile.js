const { series, parallel, src, dest } = require('gulp');
// js
const browserify = require('browserify');
//const uglify     = require('gulp-uglify');
const terser     = require('gulp-terser');
const header     = require('gulp-header');
const replace    = require('gulp-replace');

const collapse   = require('bundle-collapser/plugin');
const source     = require('vinyl-source-stream');
const buffer     = require('vinyl-buffer');
const mocha      = require('gulp-mocha');

/////////
/// pages
/////

const rootdirname = __dirname;

function pageJs(){
  const headerTxt = '/* ' + new Date().getUTCFullYear() + '- generated at ' + new Date() + '\n*/';
  const browserifyOption = {
      entries: './pages/pages.js',
      extensions: ['.js'],
      //debug: true,
    };
  
    const b = browserify(browserifyOption);
    let bundler = b
      .transform('partialify')
      .transform('babelify', {
        compact: "auto",
          ignore: [],
          presets: ['es2015', 'react']
        });
    
    const rebundle = function() {
      const rc = bundler.plugin(collapse)
        .bundle()
        .pipe(source('page.js'))
        .pipe(buffer())
    //    .pipe(uglify())
        .pipe(header(headerTxt))
        .pipe(dest(rootdirname));
  
        return rc;
      };
    bundler = bundler.on('update', rebundle);
    return rebundle();
}
  
function pageCSS(){
  return 0;/*src("./pages/pages.less")
    .pipe(less())
    .pipe(rename('page.css'))
    .pipe(dest(rootdirname));*/
}

/////////
// dist
/////////
function full(){

  const headerTxt = '/* ' + new Date().getUTCFullYear() + '- generated at ' + new Date() + '\n*/';
  const browserifyOption = {
    entries: './src/Graph.jsx',
    extensions: ['.js','.jsx']
  };
  
  const b = browserify(browserifyOption);
  let bundler = b
    .transform('partialify')
    .transform('babelify', {
      compact: "auto",
      ignore: [],
      presets: ['es2015', 'react']
  }).external('react');
  
  const rebundle = function() {
    const rc = bundler.plugin(collapse)
      .bundle()
      .pipe(source('reactchart.js'))
      .pipe(buffer())
      .pipe(header(headerTxt))
      .pipe(dest('./dist'));
  
      return rc;
    };
  bundler = bundler.on('update', rebundle);
  return rebundle();
}

function min(){

  const headerTxt = '/* ' + new Date().getUTCFullYear() + '- generated at ' + new Date() + '\n*/';
  const browserifyOption = {
    entries: './src/Graph.jsx',
    extensions: ['.js','.jsx']
    //debug: true,
  };
  
  const b = browserify(browserifyOption);
  let bundler = b
    .transform('partialify')
    .transform('babelify', {
      compact: "auto",
      ignore: [],
      presets: ['es2015', 'react']
  }).external('react');
  
  const rebundle = function() {
    const rc = bundler.plugin(collapse)
      .bundle()
      .pipe(source('reactchart.min.js'))
      .pipe(buffer())
      .pipe(terser({
        output: {
          comments: false
        }
      }))
      .pipe(header(headerTxt))
      .pipe(dest('./dist'));
  
      return rc;
    };
  bundler = bundler.on('update', rebundle);
  return rebundle();
}

////////////
// jsx -> js in require
///////////

function jsx2js(){
  return src(['.lib/*.js',"./lib/**/*.js"])
    .pipe(replace(/\.jsx/g,'.js'))
    .pipe(dest('./lib'));
}

////////////
// src -> lib in index
///////////

function src2libIdx(){
  return src(["./index.js"])
    .pipe(replace(/src/g,'lib'))
    .pipe(dest('.'));
}

function src2libHlp() {
  return src(["./helpers/index.js"])
    .pipe(replace(/src/g,'lib'))
    .pipe(dest('./helpers'));
}

//////////////
// .npmignore ignores src/
/////////////

function noSrc(){
  return src(['./.npmignore'])
    .pipe(header('src\n'))
    .pipe(dest('.'));
}


////////////////
/// tests
//////////////

const mochaOptions = {
  globals: [
    'expect', 'sinon', 'v2', 'v3'
  ],
  ignoreLeaks: false
};

const doTest = () => src(['./test/*.test.js'], { allowEmpty: true })
	.pipe(mocha(mochaOptions));

/////

exports.test = doTest;

exports.buildNpm = series(jsx2js,parallel(src2libIdx,src2libHlp),noSrc);

exports.dist = series(full,min);

exports.doc = parallel(pageJs,pageCSS);

exports.default = parallel(series(full,min),parallel(pageJs,pageCSS));

	

