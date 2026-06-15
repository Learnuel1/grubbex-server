module.exports = {
    "env": {
        "browser": false,
        "es2021": true,
        "node" : true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
        
    ],
    "overrides": [
        {
            "files": ["*-test.js","*.spec.js"],
            "rules": {
              "no-unused-expressions": "off"
            }
          }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    rules: {
        "import/prefer-default-export": "off",
        "prettier/prettier": [
          "error",
          {
            endOfLine: "auto",
          },
        ],
        "no-var": "error",
        semi: "error",
        camelcase: "error",
        eqeqeq: "error",
        indent: ["error", 2, { SwitchCase: 1 }],
        "no-multi-spaces": "error",
        "no-multiple-empty-lines": "error",
        "no-duplicate-imports": "error",
        "no-use-before-define": [
          "error",
          {
            functions: true,
            classes: true,
            variables: true,
            allowNamedExports: false,
          },
        ],
        "brace-style": 2,
        "block-spacing": [
          2,
          "always"
        ],
        "keyword-spacing": [2, {"before": true, "after": true, "overrides": {}}],
        "space-before-blocks": 2,
        "space-before-function-paren": [2, {"anonymous": "always", "named": "never"}],
        "comma-spacing": [2, {"before": false, "after": true}],
        "comma-style": [2, "last"],
        "no-lonely-if": 2,
        "array-bracket-spacing": [2, "never"],
        "no-spaced-func": [2],
        "space-in-parens": [2, "never"],
        "space-infix-ops": 2
      },
      "globals": {
        "after": true,
        "afterEach": true,
        "before": true,
        "beforeEach": true,
        "describe": true,
        "it": true
      }    
}
