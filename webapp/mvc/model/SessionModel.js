sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/model/base/PromiseJSONModel',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ServiceNames,
    PromiseJSONModel
  ) => {
    'use strict';

    const DATE_FORMAT = 'yyyy.MM.dd';

    return PromiseJSONModel.extend('sap.ui.yesco.mvc.model.SessionModel', {
      constructor: function (oUIComponent) {
        JSONModel.apply(this, this.getInitialData());

        this.setUIComponent(oUIComponent);
        this.setPromise(this.retrieve());
      },

      getInitialData() {
        return {
          Dtfmt: DATE_FORMAT,
          DTFMT: DATE_FORMAT.toUpperCase(),
          Werks: 'init',
          Photo: 'asset/image/employee.png',
        };
      },

      async retrieve(sPernr) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpLoginInfoSet';
          const filters = sPernr ? [new Filter('Pernr', FilterOperator.EQ, sPernr)] : []; // AppointeeModel용

          this.getUIComponent()
            .getModel(ServiceNames.COMMON)
            .read(sUrl, {
              filters: filters,
              success: (oData, oResponse) => {
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
                mSessionData.DtfmtYYYYMM = mSessionData.Dtfmt.replace(/([a-zA-Z]{4})([^a-zA-Z]?)([a-zA-Z]{2}).*/, '$1$2$3');
                mSessionData.DtfmtYYYY = mSessionData.Dtfmt.replace(/([a-zA-Z]{4}).*/, '$1');
                mSessionData.DTFMTYYYYMM = mSessionData.DTFMT.replace(/([a-zA-Z]{4})([^a-zA-Z]?)([a-zA-Z]{2}).*/, '$1$2$3');
                mSessionData.DTFMTYYYY = mSessionData.DTFMT.replace(/([a-zA-Z]{4}).*/, '$1');
                mSessionData.Photo ||= 'asset/image/avatar-unknown.svg';

                this.setData(mSessionData, true);

                resolve();
              },
              error: (oError) => {
                AppUtils.debug(`${sUrl} error.`, oError);

                reject(oError);
              },
            });
        });
      },
    });
  }
);
