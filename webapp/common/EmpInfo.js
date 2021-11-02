sap.ui.define([], () => {
  'use strict';

  return {
    get(bTargetChangeButtonHide = false) {
      const oCommonModel = this.getModel('common');
      const sUrl = '/EmpLoginInfoSet';
      const oViewModel = this.getViewModel();
      const oViewModelData = this.getViewModel().getData();

      oCommonModel.read(sUrl, {
        success: (oData, oResponse) => {
          this.debug(`${sUrl} success.`, oData, oResponse);
          const oLoginInfo = oData.results[0];

          if (bTargetChangeButtonHide) {
            oLoginInfo.Hide = true;
          } else {
            oLoginInfo.Hide = false;
          }

          oViewModelData.TargetInfo = oLoginInfo || {};
          oViewModel.setData(oViewModelData);
        },
        error: (oError) => {
          this.debug(`${sUrl} error.`, oError);
        },
      });
    },
  };
});
