sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    ODataModel,
    AppUtils
  ) {
    ('use strict');

    return ODataModel.extend('sap.ui.yesco.control.ODataModel', {
      create(sPath, oData) {
        AppUtils.debug(arguments);

        if (sap.ui.getCore().byId('container-ehr---app')) {
          const [sServiceName] = this.sServiceUrl.split('/').slice(-1);
          const mModelMetadata = AppUtils.getAppComponent().getModel('metadataModel').getProperty(`/${sServiceName}`);
          const sEntityKey = sPath.replace(/\//g, '').replace(/Set$/, '');
          const mEntityMetadata = mModelMetadata[sEntityKey];

          Object.keys(oData).forEach((key) => {
            if (!mEntityMetadata[key] && !Array.isArray(oData[key])) {
              delete oData[key];
            } else if (Array.isArray(oData[key])) {
              const mAssociationMetadata = mModelMetadata[mModelMetadata[mEntityMetadata[key]]];

              oData[key].forEach((ass) => {
                Object.keys(ass).forEach((assKey) => {
                  if (!mAssociationMetadata[assKey]) {
                    delete ass[assKey];
                  }
                });
              });
            }
          });
        }

        if (ODataModel.prototype.create) {
          ODataModel.prototype.create.apply(this, arguments); //run the super class's method first
        }
      },
    });
  }
);
