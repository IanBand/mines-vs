module.exports = {
    lintOnSave: true,
    configureWebpack:{
      module: {
        rules: [
          {
            test: /\.worker\.js$/,
            loader: 'worker-loader',
            options: {
              esModule: false,
            },
          },
        ],
      },
    }
  }