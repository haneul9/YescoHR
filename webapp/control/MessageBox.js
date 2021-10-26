sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageBox',
  ],
  function (
    // prettier 방지용 주석
    SapMMessageBox
  ) {
    'use strict';

    const MessageBox = {
      ...SapMMessageBox,
      alert(vMessage, mOptions = {}) {
        SapMMessageBox.alert(vMessage, { ...mOptions, title: '{i18n>MSG_ALERT}' });
      },
      confirm(vMessage, mOptions = {}) {
        SapMMessageBox.confirm(vMessage, { ...mOptions, title: '{i18n>MSG_CONFIRM}' });
      },
      error(vMessage, mOptions = {}) {
        SapMMessageBox.error(vMessage, { ...mOptions, title: '{i18n>MSG_ERROR}' });
      },
      information(vMessage, mOptions = {}) {
        SapMMessageBox.information(vMessage, { ...mOptions, title: '{i18n>MSG_INFORMATION}' });
      },
      show(vMessage, mOptions = {}) {
        SapMMessageBox.show(vMessage, { ...mOptions, title: '{i18n>MSG_SHOW}' });
      },
      success(vMessage, mOptions = {}) {
        SapMMessageBox.success(vMessage, { ...mOptions, title: '{i18n>MSG_SUCCESS}' });
      },
      warning(vMessage, mOptions = {}) {
        SapMMessageBox.warning(vMessage, { ...mOptions, title: '{i18n>MSG_WARNING}' });
      },
    };

    return MessageBox;
  }
);
