module.exports = ({ config }) => process.env.PG_SIGNUP_UI_TEST === 'true' ? { ...config, slug: 'pg-signup-ui-qa', name: 'PG Signup QA' } : config;
