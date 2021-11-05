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
      if(typeof vAppdt === "string") {
        return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;
      }else if(typeof vAppdt === "object") {
        const vDate = vAppdt.toLocaleString();
        const vTime = vAppdt.toTimeString();
        
        return `${vDate.slice(0, 5)}${vDate.slice(6, 9)}${vDate.slice(10, 11)}, ${vTime.slice(0,2)}:${vTime.slice(3,5)}`
      }

      return "";
    },

    onInfoMsgClose() {
      this.byId('InfoMegBox').setVisible(false);
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
