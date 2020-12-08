export default {
    target: 'static',
    head: {
        title: 'Vue Nuxt Test',
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: 'Nuxt.js project' },
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
};
