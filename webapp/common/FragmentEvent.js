sap.ui.define(
  [
    // prettier 방지용 주석
  ],
  () =>
    // prettier 방지용 주석
    {
      'use strict';

      return {
        onInfoMsgClose() {
          this.byId('InfoMegBox').setVisible(false);
        },

        onCloseClick() {
          this.byId('listFileDialog').close();
        },
      };
    }
);
