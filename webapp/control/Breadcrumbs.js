sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Breadcrumbs',
    'sap/m/BreadcrumbsSeparatorStyle',
    'sap/m/Link',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Breadcrumbs,
    SeparatorStyle,
    Link,
    AppUtils
  ) => {
    'use strict';

    return Breadcrumbs.extend('sap.ui.yesco.control.Breadcrumbs', {
      renderer: {},

      constructor: function (...aArgs) {
        Breadcrumbs.apply(this, aArgs);

        const oMenuModel = AppUtils.getAppComponent().getMenuModel();
        this.setModel(oMenuModel)
          .setSeparatorStyle(SeparatorStyle.GreaterThan)
          .bindProperty('currentLocationText', '/breadcrumbs/currentLocationText')
          .bindAggregation('links', {
            path: '/breadcrumbs/links',
            template: new Link({ text: '{name}', enabled: false, subtle: true }),
            templateShareable: false,
          });
      },
    });
  }
);
