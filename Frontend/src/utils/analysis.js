// Question uploads used to store this Chinese "no explanation yet" placeholder in Question.Analysis.
// Rows written before the i18n change still contain it, so it must keep counting as "no explanation".
const LEGACY_PLACEHOLDER = '该题目暂未提供详细的思路解析';

export const hasRealAnalysis = (analysis) => !!analysis && !analysis.includes(LEGACY_PLACEHOLDER);
