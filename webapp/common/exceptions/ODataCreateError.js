sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (Error, AppUtils) {
    'use strict';

    return Error.extend('sap.ui.yesco.common.exceptions.ODataCreateError', {
      MESSAGE: {
        T: 'LABEL_00104', // 임시저장
        C: 'LABEL_00121', // 신청
        A: 'LABEL_00107', // 추가
      },

      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function (type = 'C') {
        // {임시저장|신청|추가}중 오류가 발생하였습니다.
        Error.prototype.constructor.call(this, { code: 'E', message: AppUtils.getBundleText('MSG_00008', this.MESSAGE[type]) });
      },
    });
  }
);
