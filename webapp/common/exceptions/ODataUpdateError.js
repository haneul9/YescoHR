sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (Error, AppUtils) {
    'use strict';

    return Error.extend('sap.ui.yesco.common.exceptions.ODataUpdateError', {
      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function (type = 'C') {
        // {수정}중 오류가 발생하였습니다.
        Error.prototype.constructor.call(this, { code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00108') });
      },
    });
  }
);
