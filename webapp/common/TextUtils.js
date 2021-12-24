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
         * 금액 format ex) 1234567 => 1,234,567
         *************************/
        toCurrency(x) {
          // return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return new Intl.NumberFormat('ko-KR').format(x || 0);
        },

        /**************************
         * InputBox에서 금액 입력시 보이는 Ui는 금액format이 되고
         * 실질적인 Property에는 그냥 셋팅됨
         *************************/
        liveChangeCurrency(oEvent) {
          const oEventSource = oEvent.getSource();
          const sPath = oEventSource.getBinding('value').getPath();
          const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');

          oEventSource.setValue(this.toCurrency(sValue));
          oEventSource.getModel().setProperty(sPath, sValue);
        },

        /**************************
         * 신청자에있는 신청일시 oDataFormat
         *************************/
        setAppdt(vAppdt) {
          const sPattern = 'YYYY.MM.DD, HH:mm';

          if (typeof vAppdt === 'string') {
            return moment(vAppdt, 'YYYYMMDD HHmm').format(sPattern);
          } else if (vAppdt instanceof Date) {
            return moment(vAppdt).format(sPattern);
          }

          return '';
        },

        /**************************
         * 결재상태 fragment 신청번호 앞에 0없앰
         *************************/
        getDocnoTxt(sDocno) {
          return (sDocno || '').replace(/^0+/, '');
        },

        setLineThrough(Zfilename, Deleted) {
          console.log(arguments);
          // this.toggleStyleClass('text-line-through', Deleted);

          return Zfilename;
        },
      };
    }
);
