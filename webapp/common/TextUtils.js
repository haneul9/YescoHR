sap.ui.define(
  [
    // prettier 방지용 주석
  ],
  () =>
    // prettier 방지용 주석
    {
      'use strict';

      return {
        /**************************
         *
         *************************/
        toCurrency(x = 0) {
          // return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return new Intl.NumberFormat('ko-KR').format(x);
        },

        liveChangeCurrency(oEvent) {
          const oEventSource = oEvent.getSource();
          const sPath = oEventSource.getBinding('value').getPath();
          const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');

          oEventSource.setValue(this.toCurrency(sValue));
          oEventSource.getModel().setProperty(sPath, sValue);
        },

        setAppdt(vAppdt) {
          const sPattern = 'YYYY.MM.DD HH:mm';
          if (typeof vAppdt === 'string') {
            return moment(vAppdt, 'YYYYMMDD HHmm').format(sPattern);
          } else if (vAppdt instanceof Date) {
            return moment(vAppdt).format(sPattern);
          }
          return '';
        },

        getDocnoTxt(sDocno = '') {
          return sDocno.replace(/^0+/, '');
        },
      };
    }
);
