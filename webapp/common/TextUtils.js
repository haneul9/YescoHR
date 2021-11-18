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
        numberWithCommas(x = 0) {
          // return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return new Intl.NumberFormat('ko-KR').format(x);
        },

        liveChangeCost(oEvent) {
          const inputValue = oEvent.getParameter('value').trim();
          const convertValue = inputValue.replace(/[^\d]/g, '');
          const vPath = oEvent.getSource().mBindingInfos.value.binding.getPath();

          oEvent.getSource().setValue(this.textUtils.numberWithCommas(convertValue));
          this.getViewModel().setProperty(vPath, convertValue);
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

        getDocnoTxt(sDocno = '') {
          return sDocno.replace(/^0+/, '');
        },
      };
    }
);
