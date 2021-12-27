sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError
  ) => {
    'use strict';

    return {
      getEntitySet: _.curry((oModel, sUrl, mFilters = {}) => {
        return new Promise((resolve, reject) => {
          oModel.read(`/${sUrl}Set`, {
            filters: _.map(mFilters, (v, p) => new Filter(p, FilterOperator.EQ, v)),
            success: (oData) => {
              AppUtils.debug(`${sUrl} get-entityset success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} get-entityset error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      }),

      get: _.curry((oModel, sUrl, mKeyMap = {}) => {
        return new Promise((resolve, reject) => {
          oModel.read(oModel.createKey(`/${sUrl}Set`, mKeyMap), {
            success: (oData) => {
              AppUtils.debug(`${sUrl} get success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} get error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      }),

      create: _.curry((oModel, sUrl, mPayload) => {
        return new Promise((resolve, reject) => {
          oModel.create(`/${sUrl}Set`, mPayload, {
            success: (oData) => {
              AppUtils.debug(`${sUrl} create success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} create error.`, oError);

              reject(new ODataCreateError(oError));
            },
          });
        });
      }),

      deep: _.curry((oModel, sUrl, mPayload) => {
        return new Promise((resolve, reject) => {
          oModel.create(`/${sUrl}Set`, mPayload, {
            success: (oData) => {
              AppUtils.debug(`${sUrl} deep success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} deep error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      }),

      remove: _.curry((oModel, sUrl, mKeyMap = {}) => {
        return new Promise((resolve, reject) => {
          oModel.remove(oModel.createKey(`/${sUrl}Set`, mKeyMap), {
            success: (oData) => {
              AppUtils.debug(`${sUrl} remove success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} remove error.`, oError);

              reject(new ODataDeleteError(oError));
            },
          });
        });
      }),
    };
  }
);