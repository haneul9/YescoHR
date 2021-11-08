sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    BaseController,
    AppUtils
  ) => {
    'use strict';

    class NotFound extends BaseController {
      onInit() {
        this.getRouter().getTarget('notFound').attachDisplay(this._onNotFoundDisplayed, this);
      }

      _onNotFoundDisplayed(oEvent) {
        this._oData = oEvent.getParameter('data');

        // this.getModel('appModel').setProperty('/layout', 'OneColumn');

        AppUtils.setAppBusy(false, this);
      }

      // override the parent's onNavBack (inherited from BaseController)
      onNavBack(...args) {
        // in some cases we could display a certain target when the back button is pressed
        if (this._oData && this._oData.fromTarget) {
          this.getRouter().getTargets().display(this._oData.fromTarget);
          delete this._oData.fromTarget;
          return;
        }

        // call the parent's onNavBack
        super.onNavBack(...args);
      }
    }

    return NotFound;
  }
);
