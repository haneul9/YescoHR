sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    const DATE_FORMAT = 'yyyy.MM.dd';

    return JSONModel.extend('sap.ui.yesco.mvc.model.SessionModel', {
      constructor: function (oUIComponent) {
        JSONModel.apply(this, this.getInitialData());

        this.setUIComponent(oUIComponent);

        this.oPromise = this.retrieve();
      },

      getInitialData() {
        return {
          Dtfmt: DATE_FORMAT,
          DTFMT: DATE_FORMAT.toUpperCase(),
          Werks: 'init',
        };
      },

      setUIComponent(oUIComponent) {
        this._oUIComponent = oUIComponent;
      },

      getUIComponent() {
        return this._oUIComponent;
      },

      retrieve(sPernr) {
        return new Promise((resolve) => {
          const sUrl = '/EmpLoginInfoSet';
          const filters = sPernr ? [new Filter('Pernr', FilterOperator.EQ, sPernr)] : []; // TargetModel용

          this._oUIComponent.getModel(ServiceNames.COMMON).read(sUrl, {
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
        return this.oPromise;
      },
    });
  }
);
