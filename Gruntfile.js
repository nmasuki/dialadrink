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
                    src: 'public/js/**/*.js',//['public/js/*.js'],//
                    cwd: '.',
                    rename: function (dst, src) {
                        // To keep src js files and make new files as *.min.js :
                        if (src.indexOf('.min.js') < 0)
                            return (dst ? dst + '/' : '') + src.replace('.js', '.min.js');
                        else
                            return src;
                    }
                }]
            }
        },
        cssmin: {
            options: {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target: {
                files: [{
                    expand: true,
                    src: ['public/styles/**/*.css','public/js/**/*.css'],//
                    cwd: '.',
                    rename: function (dst, src) {
                        if (src.indexOf('.min.css') < 0)
                            return (dst ? dst + '/' : '') + src.replace('.css', '.min.css');
                        else
                            return src;
                    }
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('build', [
        'uglify',
        'cssmin'
    ]);
}
