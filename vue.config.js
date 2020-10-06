module.exports = {
    lintOnSave: true,
    configureWebpack:{
      module: {
        rules: [
          {
            test: /\.worker\.(c|m)?js$/i,
            use: [
              {
                loader: 'worker-loader',
              },
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            ],
          },
        ],
      },
    }
  }