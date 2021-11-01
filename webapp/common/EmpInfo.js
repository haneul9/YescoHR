sap.ui.define([], () => {
  'use strict';

  return {
    get({ bTargetChangeButtonHide = true }) {
      const oCommonModel = this.getModel();
      const sUrl = '/EmpLoginInfoSet';
      const oViewModel = this.getViewModel();
      const oViewModelData = this.getViewModel().getData();

      oCommonModel.read(sUrl, {
        success: (oData, oResponse) => {
          this.debug(`${sUrl} success.`, oData, oResponse);
          const oLoginInfo = oData.results[0];

          if (bTargetChangeButtonHide === true) {
            oLoginInfo.Hide = true;
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
