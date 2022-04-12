sap.ui.define(
  [
    'sap/ui/yesco/common/exceptions/UI5Error', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (UI5Error, AppUtils) {
    'use strict';

    return UI5Error.extend('sap.ui.yesco.common.exceptions.ODataUpdateError', {
      /**
       * @override
       * @param {any} Unknown
       * @returns {sap.ui.base.Object}
       */
      constructor: function (oError) {
        const { code, message } = oError ? AppUtils.parseError(oError) : { code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00108') };
        const { statusCode } = oError;

        UI5Error.prototype.constructor.call(this, { code, message, httpStatusCode: statusCode });
      },
    });
  }
);
