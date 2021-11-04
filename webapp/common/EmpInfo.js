sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    ServiceNames
  ) => {
    'use strict';

    return {
      get(bTargetChangeButtonHide = false) {
        const oCommonModel = this.getModel(ServiceNames.COMMON);
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
  }
);
