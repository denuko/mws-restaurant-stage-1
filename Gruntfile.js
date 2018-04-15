module.exports = function(grunt) {
    grunt.initConfig({
        responsive_images: {
            dev: {
                options: {
                    sizes: [{
                            name: 'small',
                            width: 300
                        }, {
                            name: 'medium',
                            width: 400,
                            quality: 60
                        }, {
                            name: 'large',
                            width: 800,
                            quality: 60
                        }]
                },
                files: [{
                        expand: true,
                        src: ['*.{jpg,gif,png}'],
                        cwd: 'img_src/',
                        dest: 'img/'
                    }]
            }
        },
        mkdir: {
            dev: {
                options: {
                    create: ['img']
                }
            }
        },
        /* Clear out the images directory if it exists */
        clean: {
            dev: {
                src: ['img']
            }
        },
        /* Generate the images directory if it is missing */
        /* Copy the "fixed" images that don't go through processing into the images/directory */
        copy: {
            dev: {
                files: [{
                        expand: true,
                        src: ['img_src/fixed/*.{gif,jpg,png}'],
                        dest: 'img/',
                        flatten: true
                    }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
};
