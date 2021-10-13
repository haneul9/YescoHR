sap.ui.define(
  [
    'sap/ui/yesco/controller/BaseController', // prettier 방지용 주석
  ],
  (
    BaseController // prettier 방지용 주석
  ) => {
    'use strict';

    // return BaseController.extend('sap.ui.yesco.controller.NotFound', {
    class NotFound extends BaseController {
      onInit() {
        this.getRouter().getTarget('notFound').attachDisplay(this._onNotFoundDisplayed, this);
      }

      _onNotFoundDisplayed(oEvent) {
        this._oData = oEvent.getParameter('data');

        this.getModel('appView').setProperty('/layout', 'OneColumn');
      }

      // override the parent's onNavBack (inherited from BaseController)
      onNavBack() {
        // in some cases we could display a certain target when the back button is pressed
        if (this._oData && this._oData.fromTarget) {
          this.getRouter().getTargets().display(this._oData.fromTarget);
          delete this._oData.fromTarget;
          return;
        }

        // call the parent's onNavBack
        BaseController.prototype.onNavBack.apply(this, arguments);
      }
    }

    return NotFound;
  }
);
