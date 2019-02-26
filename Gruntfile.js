module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            dev: {
                options: {
                    mangle: true
                },
                files: [{
                    expand: true,
                    src: ['public/js/**/*.js', 'public/*.js', '!public/**/*min.js'],
                    cwd: '.',
                    rename: function (dst, src) {
                        // To keep src js files and make new files as *.min.js :
                        if (src.indexOf('.min.js') < 0)
                            return (dst ? dst + '/' : '') + src.replace('.js', '.min.js');
                        else
                            return null;
                    }
                }]
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            dist: {
                src: [
                    'https://cdnjs.cloudflare.com/ajax/libs/jquery.isotope/2.2.0/isotope.pkgd.min.js',
                    'public/js/jquery/imagesloaded.pkgd.min.js',
                    'public/js/jquery/jquery.flexslider.min.js',
                    'public/js/jquery/jquery.zoom.min.js',

                    'public/js/jquery/jquery.fancybox.min.js',
                    'public/js/jquery/jquery.scrollbar.min.js',
                    'public/js/owlcarousel/owl.carousel.min.js',

                    'public/js/polyfills.min.js',
                    'public/js/countDown.min.js',
                    'public/js/classie.min.js',
                    'public/js/scripts.min.js',
                    'public/js/cart.min.js',
                    'public/js/app.min.js'
                ],
                dest: 'public/js/all.scripts.min.js',
            }
        },
        purifycss: {
            options: {},
            target: {
                src: ['templates/**/*.hbs', 'public/js/**/*.js'],
                css: [
                    'public/styles/site/global.less',
                    'public/styles/site/layout.less',
                    'public/styles/site/styles.less',
                    '!public/styles/site/all.less'
                ],
                dest: 'public/styles/site/all.less'
            },
        },
        cssmin: {
            options: {
                mergeIntoShorthands: true,
                roundingPrecision: -1
            },
            target: {
                files: [{
                    expand: true,
                    src: ['public/styles/**/*.css', '!public/styles/**/*min.css'],
                    cwd: '.',
                    rename: function (dst, src) {
                        if (src.indexOf('.min.css') < 0)
                            return (dst ? dst + '/' : '') + src.replace('.css', '.min.css');
                        else
                            return (dst ? dst + '/' : '') + src;
                    }
                }]
            }
        },
        css_clean: {
            options: {},
            target: {
                files: [{
                    expand: true,
                    src: ['!public/styles/**/*.css', 'public/styles/**/*min.css'],
                    cwd: '.',
                    rename: function (dst, src) {
                        if (src.indexOf('.min.css') < 0)
                            return (dst ? dst + '/' : '') + src.replace('.css', 'min.css');
                        else
                            return (dst ? dst + '/' : '') + src;
                    }
                }]
            }
        },
        handlebars: {
            compile: {
                options: {
                    namespace: function (filename) {
                        var names = filename.replace(/modules\/(.*)(\/\w+\.hbs)/, '$1');
                        return names.split('/').join('.');
                    },
                },
                files: {
                    'templates.js': ['templates/**/*.hbs']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-css-clean');
    grunt.loadNpmTasks('grunt-purifycss');
    grunt.loadNpmTasks('grunt-contrib-handlebars');

    grunt.registerTask('build', [
        'uglify', 'concat',
        'purifycss', 'cssmin', 'css_clean', 'handlebars'
    ]);
}