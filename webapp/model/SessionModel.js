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

    const DATE_FORMAT = 'yyyy.MM.dd';

    return JSONModel.extend('sap.ui.yesco.model.SessionModel', {
      constructor: function (oUIComponent) {
        JSONModel.apply(this, {
          Dtfmt: DATE_FORMAT,
          DTFMT: DATE_FORMAT.toUpperCase(),
          Werks: 'init',
        });

        this.oUIComponent = oUIComponent;

        this.promise = this.retrieve();
      },

      retrieve() {
        return new Promise((resolve) => {
          const sUrl = '/EmpLoginInfoSet';
          this.oUIComponent.getModel(ServiceNames.COMMON).read(sUrl, {
            success: (oData, oResponse) => {
              /** WrongParametersLinter */
              AppUtils.debug(`${sUrl} success.`, oData, oResponse);

              const mSessionData = (oData.results || [])[0] || {};
              delete mSessionData.__metadata;

              const Dtfmt = mSessionData.Dtfmt;
              if (Dtfmt && Dtfmt.length >= 8) {
                mSessionData.Dtfmt = Dtfmt.replace(/y/gi, 'y').replace(/m/gi, 'M').replace(/d/gi, 'd');
                mSessionData.DTFMT = Dtfmt.toUpperCase();
              } else {
                mSessionData.Dtfmt = DATE_FORMAT;
                mSessionData.DTFMT = DATE_FORMAT.toUpperCase();
              }

              this.setData(mSessionData, true);

              resolve();
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              resolve();
            },
          });
        });
      },

      getPromise() {
        return this.promise;
      },
    });
  }
);
