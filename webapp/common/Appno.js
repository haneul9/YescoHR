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
            success: (oData) => {
              if (oData && oData.results.length) {
                resolve(oData.results[0].Appno);
              } else {
                reject({ code: 'E', message: AppUtils.getBundleText('MSG_00047') }); // 결재문서번호 생성중 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.
              }
            },
            error: (oError) => {
              AppUtils.debug(oError);

              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00047') }); // 결재문서번호 생성중 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.
            },
          });
        });
      },
    };
  }
);
