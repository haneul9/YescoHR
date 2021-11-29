sap.ui.define(
  [
    'sap/ui/base/Object', //
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (BaseObject, MessageBox, AppUtils) {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.exceptions.UI5Error', {
      LEVEL: {
        INFORMATION: 'I',
        WARNING: 'W',
        ERROR: 'E',
      },
      /**
       * @override
       * @returns {sap.ui.base.Object}
       */
      constructor: function ({ code, message }) {
        this.MESSAGE_LEVEL = {
          INFORMATION: [this.LEVEL.INFORMATION, this.LEVEL.WARNING, this.LEVEL.ERROR],
          WARNING: [this.LEVEL.WARNING, this.LEVEL.ERROR],
          ERROR: [this.LEVEL.ERROR],
        };

        this.code = code;
        this.message = message;
        this.messageLevel = this.MESSAGE_LEVEL.INFORMATION;
      },

      getCode: function () {
        return this.code;
      },

      getMessage: function () {
        return this.message;
      },

      showErrorMessage: function (mOptions = {}) {
        const sCode = this.getCode();
        const sMessage = this.getMessage().replace(/\\n/, '\n');

        if (_.includes(this.messageLevel, sCode)) {
          switch (sCode) {
            case this.LEVEL.INFORMATION:
              MessageBox.information(sMessage, { ...mOptions });
              break;
            case this.LEVEL.WARNING:
              MessageBox.warning(sMessage, { ...mOptions });
              break;
            case this.LEVEL.ERROR:
              MessageBox.error(sMessage, { ...mOptions });
              break;
            default:
              break;
          }
        } else {
          AppUtils.debug(sCode, sMessage);
        }
      },
    });
  }
);
