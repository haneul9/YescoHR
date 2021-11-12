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

    getPosition() {
      const oViewModel = this.getViewModel();

      if (!oViewModel.getProperty('/TargetInfo/Zzjikgbt')) return;

      return `${oViewModel.getProperty('/TargetInfo/Zzjikgbt')}/${oViewModel.getProperty('/TargetInfo/Zzjiktlt')}`;
    },

    setAppdt(vAppdt) {
      if (typeof vAppdt === 'string') {
        return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;
      } else if (typeof vAppdt === 'object') {
        const vDate = vAppdt.toLocaleString();
        const vTime = vAppdt.toTimeString();

        return `${vDate.slice(0, 5)}${vDate.slice(6, 9)}${vDate.slice(10, 11)}, ${vTime.slice(0, 2)}:${vTime.slice(3, 5)}`;
      }

      return '';
    },

    onPagePrint() {
      window.print();
    },

    onInfoMsgClose() {
      this.byId('InfoMegBox').setVisible(false);
    },

    getDocnoTxt(sDocno) {
      return sDocno === '00000000000000' ? '' : parseInt(sDocno, 10);
    },

    onCloseClick() {
      this.byId('listFileDialog').close();
    },
  };
});
