sap.ui.define(['sap/ui/model/type/Time'], (TypeTime) => {
  'use strict';

  const DEFAULT_PATTERN = 'HH:mm:ss';

  return {
    now(pattern = DEFAULT_PATTERN) {
      return this.format(new Date(), pattern);
    },

    format(date, pattern = DEFAULT_PATTERN, sourcePattern = DEFAULT_PATTERN) {
      if (date instanceof Date) {
        const formatter = new TypeTime({ pattern: pattern });
        return formatter.formatValue(date, 'string');
      } else if (date instanceof String || typeof date === 'string') {
        const formatter = new TypeTime({
          source: { pattern: sourcePattern },
          pattern: pattern,
        });
        return formatter.formatValue(date, 'string');
      }
      return '';
    },

    parse(dateString, sourcePattern = DEFAULT_PATTERN) {
      const parser = new TypeTime({ source: { pattern: sourcePattern } });
      return parser.parseValue(dateString, 'string');
    },
  };
});
