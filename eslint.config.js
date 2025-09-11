module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
                console: "readonly",
                process: "readonly",
                __dirname: "readonly",
                setTimeout: "readonly",
                Buffer: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "indent": ["error", 4],
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
        },
    },
    {
        files: ["test/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
                console: "readonly",
                process: "readonly",
                __dirname: "readonly",
                describe: "readonly",
                it: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                before: "readonly",
                after: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "indent": ["error", 4],
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
        },
    },
];