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

    const executeMessageBox = (sFunctionName, vMessage, mOptions) => {
      const sTitle = sap.ui.getCore().getComponent('container-ehr').getModel('i18n').getResourceBundle().getText(`LABEL_${sFunctionName.toUpperCase()}`);
      MessageBox[sFunctionName](vMessage, {
        icon: ' ', // MessageBox.Icon.NONE,
        ...mOptions,
        title: sTitle,
        styleClass: `custom-messagebox custom-messagebox-${sFunctionName}`,
      });
    };

    return {
      ...MessageBox,
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      show(...aArgs) {
        executeMessageBox('show', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      alert(...aArgs) {
        executeMessageBox('alert', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      confirm(...aArgs) {
        executeMessageBox('confirm', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      error(...aArgs) {
        executeMessageBox('error', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      information(...aArgs) {
        executeMessageBox('information', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      success(...aArgs) {
        executeMessageBox('success', ...aArgs);
      },
      /**
       * @param  {string} vMessage
       * @param  {object} mOptions
       */
      warning(...aArgs) {
        executeMessageBox('warning', ...aArgs);
      },
    };
  }
);
