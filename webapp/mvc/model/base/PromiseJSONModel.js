sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
  ],
  (
    // prettier 방지용 주석
    JSONModel
  ) => {
    'use strict';

    return JSONModel.extend('sap.ui.yesco.mvc.model.base.PromiseJSONModel', {
      setUIComponent(oUIComponent) {
        this._oUIComponent = oUIComponent;
      },

      getUIComponent() {
        return this._oUIComponent;
      },

      setPromise(oPromise) {
        this._oPromise = oPromise;
      },

      getPromise() {
        return this._oPromise;
      },
    });
  }
);
