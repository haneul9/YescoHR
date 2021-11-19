sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    JSONModel,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.zample.Ninebox', {
      onBeforeShow() {
        const map = {};
        const oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/9box.json'));
        oModel.attachRequestCompleted((oEvent) => {
          if (!oEvent.getParameters().success) {
            return;
          }

          const oData = oEvent.getSource().getData();
          oData.results.forEach((m) => {
            if (map[`Box${m.box}`]) {
              map[`Box${m.box}`].push(m);
            } else {
              map[`Box${m.box}`] = [m];
            }
          });
          this.debug('9box', map);
          this.byId('nineboxGrid').setModel(new JSONModel(map));
        });
      },
      onPress1() {
        alert('icon 1');
      },
      onPress2() {
        alert('icon 2');
      },
    });
  }
);
