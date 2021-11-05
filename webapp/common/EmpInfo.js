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
          const oSessionModel = this.getModel('session');
          const oViewModel = this.getViewModel();
          const oViewModelData = this.getViewModel().getData();

          oViewModelData.TargetInfo = {
            ...oSessionModel.getData(),
            Hide: bTargetChangeButtonHide,
          };
          oViewModel.setData(oViewModelData);
        },
      };
    }
);
