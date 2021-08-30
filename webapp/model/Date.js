sap.ui.define(['sap/ui/model/type/Date'], function (TypeDate) {
  'use strict';

  const DEFAULT_PATTERN = 'yyyy-MM-dd';

  return {
    today(pattern = DEFAULT_PATTERN) {
      return this.format(new Date(), pattern);
    },

    format(date, pattern = DEFAULT_PATTERN, sourcePattern = DEFAULT_PATTERN) {
      if (date instanceof Date) {
        const formatter = new TypeDate({ pattern: pattern });
        return formatter.formatValue(date, 'string');
      } else if (date instanceof String || typeof date === 'string') {
        const formatter = new TypeDate({
          source: { pattern: sourcePattern },
          pattern: pattern,
        });
        return formatter.formatValue(date, 'string');
      }
      return '';
    },

    parse(dateString, sourcePattern = DEFAULT_PATTERN) {
      const parser = new TypeDate({ source: { pattern: sourcePattern } });
      return parser.parseValue(dateString, 'string');
    },
  };
});
