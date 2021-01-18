export default {
    head: {
        title: 'lol scrum poker',
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: 'wow such serverless' },
        ],
    },

    srcDir: 'client/',

    modules: [
        '@nuxt/http',
    ],
    buildModules: [
        '@nuxt/typescript-build',
    ],

    render: {
        compressor: false,
    },

    css: [
        '~/assets/style.css',
    ],
};
