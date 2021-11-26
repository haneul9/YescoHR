sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Breadcrumbs',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Breadcrumbs,
    AppUtils
  ) => {
    'use strict';

    return Breadcrumbs.extend('sap.ui.yesco.control.app.Breadcrumbs', {
      renderer: {},

      constructor: function (...aArgs) {
        Breadcrumbs.apply(this, aArgs);

        // mSettings.currentLocationText = '{menuModel>/breadcrumbs/currentLocationText}';
        // mSettings.separatorStyle = 'GreaterThan';
        // mSettings.links = '{menuModel>/breadcrumbs/links}';

        const oMenuModel = AppUtils.getAppComponent().getMenuModel();
        oMenuModel.getPromise().then(() => {
          const mBreadcrumbs = oMenuModel.getProperty('/breadcrumbs');

          console.log('sap.ui.yesco.control.app.Breadcrumbs', mBreadcrumbs);

          this.setCurrentLocationText(mBreadcrumbs.currentLocationText);
        });
      },
    });
  }
);
