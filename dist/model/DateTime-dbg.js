sap.ui.define(['sap/ui/model/type/DateTime'], (TypeDateTime) => {
  'use strict';

  const DEFAULT_PATTERN = 'yyyy-MM-dd HH:mm:ss';

  return {
    now(pattern = DEFAULT_PATTERN) {
      return this.format(new Date(), pattern);
    },

    format(date, pattern = DEFAULT_PATTERN, sourcePattern = DEFAULT_PATTERN) {
      if (date instanceof Date) {
        const formatter = new TypeDateTime({ pattern: pattern });
        return formatter.formatValue(date, 'string');
      } else if (date instanceof String || typeof date === 'string') {
        const formatter = new TypeDateTime({
          source: { pattern: sourcePattern },
          pattern: pattern,
        });
        return formatter.formatValue(date, 'string');
      }
      return '';
    },

    parse(dateString, sourcePattern = DEFAULT_PATTERN) {
      const parser = new TypeDateTime({ source: { pattern: sourcePattern } });
      return parser.parseValue(dateString, 'string');
    },
  };
});
