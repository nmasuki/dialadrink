module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            dev: {
                options: {mangle: true},
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
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-css-clean');

    grunt.registerTask('build', [
        'uglify', 'concat',
        'cssmin', 'css_clean'
    ]);
}
