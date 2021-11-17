sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    class SessionModel extends JSONModel {
      constructor(oUIComponent) {
        super();

        this.oUIComponent = oUIComponent;

        this.promise = this.retrieve();
      }

      retrieve() {
        return new Promise((resolve) => {
          const sUrl = '/EmpLoginInfoSet';
          this.oUIComponent.getModel(ServiceNames.COMMON).read(sUrl, {
            success: (oData, oResponse) => {
              AppUtils.debug(`${sUrl} success.`, oData, oResponse);

              const mSessionData = (oData.results || [])[0] || {};
              delete mSessionData.__metadata;

              let sTextCode;
              if (mSessionData.Werks === '1000') {
                sTextCode = 'LABEL_01002';
              } else if (mSessionData.Werks === '2000') {
                sTextCode = 'LABEL_01003';
              } else if (mSessionData.Werks === '3000') {
                sTextCode = 'LABEL_01004';
              } else {
                sTextCode = 'LABEL_01001';
              }
              mSessionData.CompanyName = this.oUIComponent.getBundleText(sTextCode);

              this.setData(mSessionData);

              resolve();
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              this.setData({ CompanyName: this.oUIComponent.getBundleText('LABEL_01001') });

              resolve();
            },
          });
        });
      }

      getPromise() {
        return this.promise;
      }
    }

    return SessionModel;
  }
);
