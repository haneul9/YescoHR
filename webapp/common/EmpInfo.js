sap.ui.define(
  [
    // prettier 방지용 주석
  ],
  () =>
    // prettier 방지용 주석
    {
      'use strict';

      return {
        get(bTargetChangeButtonHide = false) {
          const oSessionData = this.getModel('sessionModel').getData();
          const oViewModel = this.getViewModel();
          const oViewModelData = this.getViewModel().getData();

          oViewModelData.TargetInfo = {
            ...oSessionData,
            Hide: bTargetChangeButtonHide,
          };
          oViewModel.setData(oViewModelData);
        },
      };
    }
);
