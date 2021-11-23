sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (Error, AppUtils) {
    'use strict';

    return Error.extend('sap.ui.yesco.common.exceptions.ODataDeleteError', {
      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function () {
        // {삭제}중 오류가 발생하였습니다.
        Error.prototype.constructor.call(this, { code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00110') });
      },
    });
  }
);
