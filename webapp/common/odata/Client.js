/* eslint-disable no-else-return */
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
            filters: _.chain(mFilters)
              .omitBy(_.isNil)
              .omitBy((fv) => _.isEqual(fv, 'ALL'))
              .map((v, p) => {
                if (_.isArray(v)) {
                  return new Filter({
                    filters: _.map(v, (value) => new Filter(p, FilterOperator.EQ, value)),
                    and: false,
                  });
                } else {
                  return new Filter(p, FilterOperator.EQ, v === 'all' ? 'ALL' : v);
                }
              })
              .value(),
            success: (oData) => {
              AppUtils.debug(`${sUrl} get-entityset success.`, oData);

              // eslint-disable-next-line no-unused-vars
              resolve(oData.results.map(({ ['__metadata']: _, ...obj }) => obj) ?? []);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} get-entityset error.`, oError);

              AppUtils.handleSessionTimeout(new ODataReadError(oError), reject);
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

              AppUtils.handleSessionTimeout(new ODataReadError(oError), reject);
            },
          });
        });
      }),

      create: _.curry((oModel, sUrl, mPayload) => {
        AppUtils.ODatalog(sUrl, 'C');

        return new Promise((resolve, reject) => {
          oModel.create(`/${sUrl}Set`, mPayload, {
            success: (oData) => {
              AppUtils.debug(`${sUrl} create success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} create error.`, oError);

              AppUtils.handleSessionTimeout(new ODataCreateError({ oError }), reject);
            },
          });
        });
      }),

      deep: _.curry((oModel, sUrl, mPayload) => {
        AppUtils.ODatalog(sUrl, 'N');

        return new Promise((resolve, reject) => {
          oModel.create(`/${sUrl}Set`, mPayload, {
            success: (oData) => {
              AppUtils.debug(`${sUrl} deep success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} deep error.`, oError);

              AppUtils.handleSessionTimeout(new ODataReadError(oError), reject);
            },
          });
        });
      }),

      remove: _.curry((oModel, sUrl, mKeyMap = {}) => {
        AppUtils.ODatalog(sUrl, 'D');

        return new Promise((resolve, reject) => {
          oModel.remove(oModel.createKey(`/${sUrl}Set`, mKeyMap), {
            success: (oData) => {
              AppUtils.debug(`${sUrl} remove success.`, oData);

              resolve(oData ?? {});
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} remove error.`, oError);

              AppUtils.handleSessionTimeout(new ODataDeleteError(oError), reject);
            },
          });
        });
      }),
    };
  }
);
