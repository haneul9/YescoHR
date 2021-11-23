sap.ui.define(
  [
    'sap/ui/base/Object', //
  ],
  function (BaseObject) {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.exceptions.Error', {
      /**
       * @override
       * @returns {sap.ui.base.Object}
       */
      constructor: function ({ code, message }) {
        this.code = code;
        this.message = message;
      },

      getCode: function () {
        return this.code;
      },

      getMessage: function () {
        return this.message;
      },
    });
  }
);
