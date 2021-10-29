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

    setAppdt(vAppdt) {
      if(vAppdt) 
        return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;

      return "";
    }
  };
});
