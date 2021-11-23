sap.ui.define(
  [
    'sap/ui/base/Object', //
    'sap/ui/yesco/control/MessageBox',
  ],
  function (BaseObject, MessageBox) {
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

      showErrorMessage: function (mOptions = {}) {
        if (this.getCode() === 'E') {
          MessageBox.error(this.getMessage(), { ...mOptions });
        }
      },

      showWarningMessage: function (mOptions = {}) {
        if (this.getCode() === 'W') {
          MessageBox.warning(this.getMessage(), { ...mOptions });
        }
      },

      showInformationMessage: function (mOptions = {}) {
        if (this.getCode() === 'I') {
          MessageBox.information(this.getMessage(), { ...mOptions });
        }
      },
    });
  }
);
