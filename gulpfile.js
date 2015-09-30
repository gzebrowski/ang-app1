var gulp = require('gulp'),
  plugins = require("gulp-load-plugins")({lazy: false}),
  wiredep = require('wiredep').stream,
  gulpFilter = require('gulp-filter'),
  bowerSrc = require('gulp-bower-src'),
  sass = require('gulp-sass'),
  symlink = require('gulp-symlink'),
  clean = require('gulp-clean'),
  //jshint = require('gulp-jshint'),
  fs = require('fs'),
  handlebars = require('gulp-compile-handlebars'),
  rename = require('gulp-rename'),
  //rev = require('gulp-rev'),
  runSequence = require('run-sequence'),
  ngAnnotate = require('gulp-ng-annotate'),
  plumber = require('gulp-plumber'),
  crypto = require('crypto'),
  useref = require('gulp-useref'),
  revReplace = require('gulp-rev-replace'),
  uglify = require('gulp-uglify'),
  csso = require('gulp-csso'),
  stripDebug = require('gulp-strip-debug'),
  replacestr = require('gulp-replace-task'),
  ngHtml2Js = require("gulp-ng-html2js"),
  minifyHtml = require("gulp-minify-html"),
  gulpif = require('gulp-if'),
  cwd = require('process').cwd().replace(/\\/g, '/'),
  join = require('join-path');

  

var onError = function (err) {
  console.log('\007' + err);
};
var isProduction = true;
var buildMode = false;

gulp.task('set-build-mode', function () {
    buildMode = true;
});

var checkIfBuildMode = function() {
    return buildMode;
}

var getWiredepOptions = function() {
  var options = {
    directory: './bower_components/',
    //bowerJson: bowerJson,
    //ignorePath: '..',
    ignorePath: /^\.\.(\/\.\.)*/,
    fileTypes: {
      hbs: {
        block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
        detect: {
          js: /<script.*src=['"](.+)['"]>/gi,
          css: /<link.*href=['"](.+)['"]/gi
        },
        replace: {
          css: function(filePath) {
            if (isProduction && filePath.indexOf(".min") === -1) {
              var minFilePath = filePath.replace('.css', '.min.css');
              var fullPath = join(cwd, minFilePath);
              if (fs.existsSync(fullPath) == undefined) {
                return '<link rel="stylesheet" href=".' + filePath + '" />';
              } else {
                return '<link rel="stylesheet" href=".' + minFilePath + '" />';
              }
            } else {
              return '<link rel="stylesheet" href=".' + filePath + '" />';
            }
          },
          js: function(filePath) {
            if (isProduction && filePath.indexOf(".min") === -1) { // isProduction is a variable that is set to determine build type. Its good practise to use unminified files during development 
              var minFilePath = filePath.replace('.js', '.min.js');
              var fullPath = join(cwd, minFilePath);
              if (fs.existsSync(fullPath) == undefined) {
                return '<script src="..' + filePath + '"></script>';
              } else {
                return '<script src="..' + minFilePath + '"></script>';
              }
            } else {
              return '<script src="..' + filePath + '"></script>';
            }
          }
        },
      }
    },
    dependencies: true,
    devDependencies: false,
    onError: function(err) {
      // log this
    },
    onFileUpdated: function(filePath) {
      // log this
      }
  };
  return options;
};

function checkIfUncompressedJs(fl) {
    /* helper that returns whether this version should be uglify ar not */
    var fl2 = fl.history[1];
    if (fl2.match(/\.uncompr\.js$/i)) {
        return true;
    }
    return false;
}
function calcMd5(val, slice) {
    var md5 = crypto.createHash('md5');
    md5.update(val, 'utf8');
    return slice > 0 ? md5.digest('hex').slice(0, slice) : md5.digest('hex');
}

var filter = gulpFilter('**/*.js', '!**/*.min.js', '!**/*.css');

gulp.task('full_clean', function () {
  return gulp.src('assets/*')
    .pipe(clean());
});


gulp.task('scripts-no-error', function () {
  return gulp.src('./app/static/scripts/**/*.js')
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(ngAnnotate())
    .pipe(gulp.dest('./assets/static/tmp/scripts'));
});
gulp.task('copy-scripts', function () {
  return gulp.src('./assets/static/tmp/scripts/**/*.js')
    .pipe(gulp.dest('./assets/static/scripts'));
});

gulp.task('copy-bowers', function () {
  return gulp.src('./bower_components/**')
    .pipe(gulp.dest('./assets/bower_components/'));
});



gulp.task('templates', function () {
  return gulp.src('./app/static/views/**')
    .pipe(gulp.dest('./assets/static/views'));
});


gulp.task('preprocess-sass', function() {
  return gulp.src(['./app/static/styles/*.scss'])
    .pipe(replacestr({
      patterns: [
        {
            match: /\/\/\s*GULP_INSERT_AND_PROCESS_BASE_STYLES\:[A-Za-z0-9]+/,
            replacement: function (str) {
                var els = str.match(/\/\/\s*GULP_INSERT_AND_PROCESS_BASE_STYLES\:([A-Za-z0-9]+)/);
                var styleKey = els[1];
                var content = fs.readFileSync('./app/static/styles/base.scss', 'utf8');
                var x, replacements = [
                    [/(.*)(rel_size\()(.*)/gm, '`$1$2$3'],
                    [/(.*)([\{\}])(.*)/gm, '`$1$2$3'],
                    [/(.*)(\@include )(.*)/igm, '`$1$2$3'],
                    [/(.*)\$dyn_base_full_content_size:(.*)/gm, ''],
                    [/(.*)(\$DYN_BASE_)(.*)/igm, '`$1$2$3'],
                    [/^(\$dyn_s_)(.*)/gm, '`$1$2'],
                    [/^[^\`\r\n].*/gm, ''],
                    [/^[`]+/gm, ''],
                    [/[\r\n]+/g, '\n'],
                    [/\$DYN_BASE_/g, '$DYN_' + styleKey.toUpperCase() + '_'],
                    [/\$dyn_base_full_content_size/g, '$dyn_s_' + styleKey.toLowerCase() + '_full_content_size']
                ];
                for (x = 0; x < replacements.length; x++) {
                    content = content.replace(replacements[x][0], replacements[x][1]);
                }
                return content;
          }
        }
      ]
    }))
    .pipe(gulp.dest('./assets/static/tmp/sass/'));

});


gulp.task('sass', function () {
  return gulp.src(['./assets/static/tmp/sass/main.scss'])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(sass( //{
      //errLogToConsole: true
    //}
    ))
    .pipe(gulp.dest('./assets/static/styles/'));
});

gulp.task('wiredep', function () {
  return gulp.src('./app/base.hbs')
    .pipe(wiredep(getWiredepOptions()))
    .pipe(rename('base.html'))
    .pipe(gulp.dest('./assets'));
});

function concatScripts() {
  var assets = useref.assets();
  return gulp.src('assets/base.html')
        .pipe(assets)
        .pipe(gulpif(checkIfUncompressedJs, ngAnnotate())) // by using checkIfUncompressedJs we can check out if this is a bower_component or app script
        .pipe(gulpif(checkIfUncompressedJs, uglify()))
        .pipe(gulpif(checkIfUncompressedJs, stripDebug()))
        //.pipe(gulpif(['*.css', '!*.min.css', '!**/*.js'], minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('./assets/'))

}

gulp.task('concat_scripts', function () {
    return concatScripts();
});
gulp.task('concat_scripts2', function () {
    /* replacing comment tag for 2nd useref processing that would concatenate bowers (not uglified) and app scripts (uglified) */
    return gulp.src('assets/base.html')
    .pipe(replacestr({
      patterns: [
        {
          match: /_task_prefix_2_rem2_/g,
          replacement: function () { return '';}
        }
      ]
    }))    
    .pipe(gulp.dest('assets'));
});

gulp.task('dev-remove', function () {
    /* replacing comment tag for 2nd useref processing that would concatenate bowers (not uglified) and app scripts (uglified) */
    return gulp.src('assets/base.html')
    .pipe(replacestr({
      patterns: [
        {
          match: /<!--\s*NOTE\:.*?-->/g,
          replacement: function () { return '';}
        }
      ]
    }))
    .pipe(replacestr({
      patterns: [
        {
          match: /<!--\s*buildremove\s*-->(\n|\r|.)*?<!--\s*endbuildremove\s*-->/g,
          replacement: function () { return '';}
        }
      ]
    }))    
    .pipe(gulp.dest('assets'));
});


gulp.task('concat_scripts3', function () {
    /* repeating useref processing after concat_scripts2 task */
    var res1 = concatScripts();
    return res1;
});

gulp.task('fix-static-paths', function () {
    // this is only for default task, when the statics arent concatenated and compressed
    return gulp.src('assets/base.html')
    .pipe(replacestr({
      patterns: [
        {
          match: /src="\.\.\/app\/static\/scripts\//g,
          replacement: function () { return 'src="/static/scripts/';}
        }
      ]
    }))
    .pipe(replacestr({
      patterns: [
        {
          match: /src="\.\.\/bower_components\//g,
          replacement: function () { return 'src="/bower_components/';}
        }
      ]
    }))
    .pipe(gulp.dest('assets'));
});


gulp.task('copy-assets', function () {
  return gulp.src('./dev_statics/**')
    .pipe(gulp.dest('./assets/static/'));
});

gulp.task('copy-dev-statics', function () {
    gulp.src('./app/static/css/**')
    .pipe(gulp.dest('./assets/static/styles'));

    return gulp.src('./app/static/images/**')
        .pipe(gulp.dest('./assets/static/images'));
});

gulp.task('post-clean', function () {
  return gulp.src('assets/static/tmp')
    .pipe(clean());
});


gulp.task('compile-ang-templates', function() {
    gulp.src("app/static/views/**/*.html")
    .pipe(gulpif(checkIfBuildMode, minifyHtml({empty: true, spare: true, quotes: true })))
    .pipe(ngHtml2Js({
        moduleName: "App.AppPartials",
        prefix: "/static/views/"
        })
    )
    .pipe(plugins.concat("ang_templates.js"))
    .pipe(gulpif(checkIfBuildMode, uglify()))
    .pipe(gulpif(checkIfBuildMode, gulp.dest('./assets/static/tmp/scripts'), gulp.dest('./assets/static/scripts')));
    
    return gulp.src('./assets/base.html')
    .pipe(gulpif(checkIfBuildMode, replacestr({patterns: [
            {
              match: /<!--\s*insert-ang-templates-here\s*-->/,
              replacement: '<script src="static/tmp/scripts/ang_templates.js"></script>'
            }
        ]}), replacestr({patterns: [
            {
              match: /<!--\s*insert-ang-templates-here\s*-->/,
              replacement: '<script src="/static/scripts/ang_templates.js"></script>'
            }
        ]})))
    .pipe(gulp.dest('./assets'));

});



gulp.task('watch', function () {
  gulp.watch(['./app/static/scripts/**/*.js'], function() {runSequence('scripts-no-error', 'copy-scripts', 'post-clean')});
  gulp.watch(['./app/static/views/**'], function() {runSequence('templates', 'compile-ang-templates')});
  gulp.watch(['./app/base.hbs'], function() {runSequence('wiredep', 'compile-ang-templates', 'fix-static-paths')});
  gulp.watch('./app/static/styles/**/*.scss', function() {runSequence('preprocess-sass', 'sass'); });

});
// task default: for developping process
gulp.task('default', function() {runSequence('full_clean', 'copy-bowers', 'templates',
    'scripts-no-error', 'copy-scripts', 'copy-assets', 'copy-dev-statics', 'preprocess-sass', 'sass', 'wiredep',
    'compile-ang-templates', 'fix-static-paths', 'post-clean', 'watch'); });

// task build: for production
gulp.task('build', function() {runSequence('set-build-mode', 'full_clean', 'templates',
    'scripts-no-error', 'copy-assets', 'preprocess-sass', 'sass', 'wiredep', 'dev-remove', 'compile-ang-templates',
    'concat_scripts', 'concat_scripts2', 'concat_scripts3', 'post-clean'); });
