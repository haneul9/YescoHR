sap.ui.define(
  [
    'sap/ui/yesco/control/MessageBox', //
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    MessageBox //
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
          INPUT1: 'MSG_00002',
          INPUT2: 'MSG_00003',
          SELECT1: 'MSG_00004',
          SELECT2: 'MSG_00005',
        };

        if (
          mCheckFields.some((o) => {
            if (!oInputData[o.field] || oInputData[o.field] === 'ALL') {
              MessageBox.alert(this.getText(oMessageType[o.type], o.label));
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
