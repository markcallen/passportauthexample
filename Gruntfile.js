module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        revision: {
          options: {
            property: 'meta.revision',
            ref: 'HEAD',
            short: true
          }
        },
        concurrent: {
            dev: ["nodemon:dev", "node-inspector", "watch"],
            test: ["mochaTest:test"],
            options: {
                logConcurrentOutput: true
            }
        },
        mochaTest: {
          test: {
            options: {
              reporter: 'spec',
              clearRequireCache: true
            },
            src: ['test/routes/**/*.js']
          },
          db: { 
            options: {
              reporter: 'spec',
              clearRequireCache: true
            },
            src: ['test/models/**/*.js']
          },
          coverage: {
            options: {
              reporter: 'html-cov',
              // use the quiet flag to suppress the mocha console output
              quiet: true,
              // specify a destination file to capture the mocha
              // output (the quiet option does not suppress this)
              captureFile: 'coverage.html'
            },
            src: ['test/**/*.js']
          },
        },
        blanket: {
          options: {},
          files: {
            'coverage/': ['app.js', 'routes.js', 'models.js', 'utils.js', 'routes/', 'models/'],
          }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                force: true
            },
            node: {
                options: {
                    node: true
                },
                src: ['*.js', 'routes/**/*.js', 'models/**/*.js', 'test/**/*.js']
            },
            browser: {
                options: {
                    browser: true
                },
                src: ['public/js/**/*.js']
            }
        },
        watch: {
            browserScripts: {
                files: ['public/js/**/*.js'],
                tasks: ['jshint:browser'],
                options: {
                  livereload: true,
                }
            },
            browserTemplates: {
                files: ['public/js/**/*.html', 'public/index.html'],
                tasks: ['jshint:browser'],
                options: {
                  livereload: true,
                }
            },
            css: {
                files: ['public/css/**/*.css'],
                tasks: [''],
                options: {
                  livereload: true,
                }
            },
            //test: {
            //  options: {
            //    spawn: false,
            //  },
            //  files: 'test/**/*.js',
            //  tasks: ['mochaTest']
            //}
        },
        nodemon: {
          dev: {
            script: 'app.js',
            options: {
                /** Environment variables required by the NODE application **/
                env: {
                      "NODE_ENV": "development"
                },
                nodeArgs: ['--debug'],
                ignore: ["public/**", "test/**"],
                delay: 300,

                callback: function (nodemon) {
                  nodemon.on('log', function (event) {
                    console.log(event.colour);
                  });

                  /** Open the application in a new browser window and is optional **/
                  nodemon.on('config:update', function () {
                    // Delay before server listens on port
                    setTimeout(function() {
                      //require('open')('http://localhost:8888');
                      //require('open')('http://127.0.0.1:8080/debug?port=5858');
                    }, 3000);
                  });

                  /** Update .rebooted to fire Live-Reload **/
                  nodemon.on('restart', function () {
                    // Delay before server listens on port
                    setTimeout(function() {
                      require('fs').writeFileSync('.rebooted', 'rebooted');
                    }, 1000);
                  });
                }
              }
          }
        },
        'node-inspector': {
             dev: {}
        }
    });

    var defaultTestSrc = grunt.config('mochaTest.test.src');
    grunt.event.on('watch', function(action, filepath) {
      grunt.config('mochaTest.test.src', defaultTestSrc);
      if (filepath.match('test/')) {
        grunt.config('mochaTest.test.src', filepath);
      }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-livereload');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-git-revision');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-node-inspector');
    grunt.loadNpmTasks('grunt-blanket');

    grunt.registerTask('default', ['concurrent:dev']);
    grunt.registerTask('test', ['concurrent:test']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('testdb', ['mochaTest:db']);
    // @TODO need to get blanket coverage to work
    grunt.registerTask('coverage', ['blanket']);
};
