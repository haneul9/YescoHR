sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    ServiceNames,
    AppUtils
  ) => {
    'use strict';

    return {
      get() {
        return new Promise((resolve, reject) => {
          const oModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);

          oModel.read('/CreateAppnoSet', {
            success: function (oData) {
              if (oData && oData.results.length) {
                resolve(oData.results[0].Appno);
              }
            },
            error: function (oError) {
              AppUtils.debug(oError);

              // {결재문서번호}중 오류가 발생하였습니다.
              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00138') });
            },
          });
        });
      },
    };
  }
);
