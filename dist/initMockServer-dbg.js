sap.ui.define(
  [
    'sap/ui/yesco/localService/mockserver', // prettier 방지용 주석
    'sap/m/MessageBox',
  ],
  (
    mockserver, // prettier 방지용 주석
    MessageBox
  ) => {
    'use strict';

    // initialize the mock server
    mockserver
      .init()
      .catch((oError) => {
        MessageBox.error(oError.message);
      })
      .finally(() => {
        // initialize the embedded component on the HTML page
        sap.ui.require(['sap/ui/core/ComponentSupport']);
      });
  }
);
