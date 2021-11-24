sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (Error, AppUtils) {
    'use strict';

    return Error.extend('sap.ui.yesco.common.exceptions.ODataReadError', {
      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function (oError) {
        const { code, message } = oError ? AppUtils.parseError(oError) : { code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00100') };

        Error.prototype.constructor.call(this, { code, message });
      },
    });
  }
);
