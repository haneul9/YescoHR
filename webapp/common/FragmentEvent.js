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

        onTogglePanel() {
          const oPanel = this.byId('InfoMegBoxPanel');

          oPanel.getHeaderToolbar().getContent()[2].toggleStyleClass('expanded');
          oPanel.setExpanded(!oPanel.getExpanded());
        },
      };
    }
);
