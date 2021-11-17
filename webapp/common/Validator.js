sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils
  ) => {
    'use strict';

    return {
      INPUT1: 'INPUT1',
      INPUT2: 'INPUT2',
      SELECT1: 'SELECT1',
      SELECT2: 'SELECT2',

      /**************************
       * Functions
       *************************/
      check({ oInputData, mCheckFields }) {
        if (!oInputData) return false;

        const oMessageType = {
          INPUT1: 'MSG_00002', // {0}을 입력하세요.
          INPUT2: 'MSG_00003', // {0}를 입력하세요.
          SELECT1: 'MSG_00004', // {0}을 선택하세요.
          SELECT2: 'MSG_00005', // {0}를 선택하세요.
        };

        if (
          mCheckFields.some((o) => {
            if (!oInputData[o.field] || ((o.type === this.SELECT1 || o.type === this.SELECT2) && oInputData[o.field] === 'ALL')) {
              MessageBox.alert(AppUtils.getBundleText(oMessageType[o.type], o.label));
              return true;
            }
          })
        ) {
          return false;
        }

        return true;
      },
    };
  }
);
