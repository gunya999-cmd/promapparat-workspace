export default[
 {ignores:['dist/**','node_modules/**','coverage/**']},
 {
  files:['**/*.{js,jsx}'],
  languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{window:'readonly',document:'readonly',localStorage:'readonly',crypto:'readonly',Blob:'readonly',URL:'readonly',FileReader:'readonly',console:'readonly',setTimeout:'readonly',clearTimeout:'readonly'}},
  rules:{'no-unreachable':'error','no-constant-binary-expression':'error','no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^React$'}],'no-dupe-keys':'error','no-self-assign':'error'}
 }
];
