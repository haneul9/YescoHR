sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils
  ) => {
    'use strict';

    return {
      getEntitySet({ oModel, sUrl, mFilters = {} }) {
        return new Promise((resolve, reject) => {
          oModel.read(`/${sUrl}Set`, {
            filters: _.map(mFilters, (v, p) => new Filter(p, FilterOperator.EQ, v)),
            success: (oData) => {
              AppUtils.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      get({ oModel, sUrl, mKeyMap = {} }) {
        return new Promise((resolve, reject) => {
          oModel.read(oModel.createKey(`/${sUrl}Set`, mKeyMap), {
            success: (oData) => {
              AppUtils.debug(`${sUrl} success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    };
  }
);
