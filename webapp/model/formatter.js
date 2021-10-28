sap.ui.define([], () => {
  'use strict';

  return {
    /**
     * Rounds the currency value to 2 digits
     *
     * @public
     * @param {string} sValue value to be formatted
     * @returns {string} formatted currency value with 2 digits
     */
    currencyValue(sValue) {
      if (!sValue) {
        return '';
      }

      return parseFloat(sValue).toFixed(2);
    },

    rowHighlight(sValue) {
      switch (sValue) {
        case '10':
          return sap.ui.core.IndicationColor.Indication01;
        case '20':
          return sap.ui.core.IndicationColor.Indication03;
        case '40':
          return sap.ui.core.IndicationColor.Indication04;
        case '45':
          return sap.ui.core.IndicationColor.Indication02;
        case '60':
          return sap.ui.core.IndicationColor.Indication05;
        default:
          return null;
      }
    },
  };
});
