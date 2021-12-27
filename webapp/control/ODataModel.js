sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
  ],
  function (
    // prettier 방지용 주석
    ODataModel,
    AppUtils,
    DateUtils
  ) {
    ('use strict');

    return ODataModel.extend('sap.ui.yesco.control.ODataModel', {
      create(sPath, oData) {
        AppUtils.debug(arguments);

        if (sap.ui.getCore().byId('container-ehr---app')) {
          const sServiceName = _.chain(this.sServiceUrl).split('/').last().value();
          const mModelMetadata = AppUtils.getAppComponent().getModel('metadataModel').getProperty(`/${sServiceName}`);
          const sEntityKey = sPath.replace(/\/|Set$/g, '');
          const mEntityMetadata = mModelMetadata[sEntityKey];

          _.forEach(oData, (value, key) => {
            if (!_.has(mEntityMetadata, key) && !_.isArray(oData[key])) {
              delete oData[key];
            } else if (_.isArray(oData[key])) {
              const mAssociationMetadata = mModelMetadata[mModelMetadata[mEntityMetadata[key]]];

              _.forEach(oData[key], (obj) => {
                _.forEach(obj, (v, k) => {
                  if (!_.has(mAssociationMetadata, k)) delete obj[k];
                  else this.convertValue(obj, k);
                });
              });
            } else {
              this.convertValue(oData, key);
            }
          });

          // Object.keys(oData).forEach((key) => {
          //   this.convertValue(oData, key);

          //   if (!_.has(mEntityMetadata, key) && !Array.isArray(oData[key])) {
          //     delete oData[key];
          //   } else if (Array.isArray(oData[key])) {
          //     const mAssociationMetadata = mModelMetadata[mModelMetadata[mEntityMetadata[key]]];

          //     oData[key].forEach((ass) => {
          //       Object.keys(ass).forEach((assKey) => {
          //         this.convertValue(ass, assKey);
          //         if (!_.has(mAssociationMetadata, assKey)) delete ass[assKey];
          //       });
          //     });
          //   }
          // });
        }

        if (ODataModel.prototype.create) {
          ODataModel.prototype.create.apply(this, arguments); //run the super class's method first
        }
      },

      convertValue(mData, sKey) {
        const sValue = mData[sKey];

        if (_.isEqual(sValue, 'ALL')) {
          _.set(mData, sKey, _.noop());
        } else if (_.isDate(sValue)) {
          _.set(mData, sKey, DateUtils.parse(sValue));
        } else if (_.isNumber(sValue)) {
          _.set(mData, sKey, _.toString(sValue));
        }
      },
    });
  }
);
