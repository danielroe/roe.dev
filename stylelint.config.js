export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules: {
    'at-rule-no-deprecated': null,
    'at-rule-prelude-no-invalid': [
      true,
      {
        ignoreAtRules: ['apply'],
      },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'screen'],
      },
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
}
