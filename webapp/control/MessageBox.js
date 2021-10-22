sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageBox',
  ],
  function (
    // prettier 방지용 주석
    MessageBox
  ) {
    'use strict';

    return {
      alert(vMessage, mOptions = {}) {
        MessageBox.alert(vMessage, { ...mOptions, title: '{i18n>MSG_ALERT}' });
      },
      confirm(vMessage, mOptions = {}) {
        MessageBox.confirm(vMessage, { ...mOptions, title: '{i18n>MSG_CONFIRM}' });
      },
      error(vMessage, mOptions = {}) {
        MessageBox.error(vMessage, { ...mOptions, title: '{i18n>MSG_ERROR}' });
      },
      information(vMessage, mOptions = {}) {
        MessageBox.information(vMessage, { ...mOptions, title: '{i18n>MSG_INFORMATION}' });
      },
      show(vMessage, mOptions = {}) {
        MessageBox.show(vMessage, { ...mOptions, title: '{i18n>MSG_SHOW}' });
      },
      success(vMessage, mOptions = {}) {
        MessageBox.success(vMessage, { ...mOptions, title: '{i18n>MSG_SUCCESS}' });
      },
      warning(vMessage, mOptions = {}) {
        MessageBox.warning(vMessage, { ...mOptions, title: '{i18n>MSG_WARNING}' });
      },
    };
  }
);
