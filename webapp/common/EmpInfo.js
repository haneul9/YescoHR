sap.ui.define([], () => {
  'use strict';

  return {
    getInfo(Hide) {
      const oCommonModel = this.getModel();
      const sUrl = '/EmpLoginInfoSet';
      const oViewModel = this.getViewModel();
      const oViewModelData = this.getViewModel().getData();

      oCommonModel.read(sUrl, {
        success: (oData, oResponse) => {
          this.debug(`${sUrl} success.`, oData, oResponse);
          const oLoginInfo = oData.results[0];

          if (Hide === 'o') oLoginInfo.Hide = 'o';

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
