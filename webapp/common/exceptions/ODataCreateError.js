sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/UI5Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (UI5Error, AppUtils) {
    'use strict';

    return UI5Error.extend('sap.ui.yesco.common.exceptions.ODataCreateError', {
      MESSAGE: {
        T: 'LABEL_00104', // 임시저장
        C: 'LABEL_00121', // 신청
        A: 'LABEL_00106', // 등록
      },

      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function ({ type = 'C', oError }) {
        const { code, message } = oError ? AppUtils.parseError(oError) : { code: 'E', message: AppUtils.getBundleText('MSG_00008', this.MESSAGE[type]) };

        UI5Error.prototype.constructor.call(this, { code, message });
      },
    });
  }
);
