sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/model/SessionModel',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    SessionModel
  ) => {
    'use strict';

    return SessionModel.extend('sap.ui.yesco.mvc.model.AppointeeModel', {
      constructor: function (oUIComponent) {
        JSONModel.apply(this, this.getInitialData());

        this.setProperty('/showChangeButton', false);

        this.setUIComponent(oUIComponent);
        this.setPromise(this.cloneSessionData());
      },

      async cloneSessionData() {
        const oSessionModel = this.getUIComponent().getSessionModel();

        await oSessionModel.getPromise();

        const oSessionData = oSessionModel.getData();
        this.setData({ ...oSessionData }, true);
      },
    });
  }
);
