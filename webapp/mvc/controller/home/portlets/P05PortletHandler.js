sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 공지사항 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P05PortletHandler', {
      init() {
        this.oAppComponent = AppUtils.getAppComponent();

        AbstractPortletHandler.prototype.init.call(this);
      },

      async readContentData() {
        return this.oAppComponent.getMenuModel().getFavoriteMenus();
      },

      transformContentData(aPortletContentData = []) {
        return {
          list: aPortletContentData,
          listCount: aPortletContentData.length,
        };
      },

      toggleFavorite(...aArgs) {
        this.oAppComponent.getAppMenu().toggleFavorite(...aArgs);
        this.getPortletModel().refresh();
      },

      formatMenuUrl(...aArgs) {
        return this.oAppComponent.getAppMenu().formatMenuUrl(...aArgs);
      },

      formatMenuTarget(...aArgs) {
        return this.oAppComponent.getAppMenu().formatMenuTarget(...aArgs);
      },

      handleMenuLink(...aArgs) {
        this.oAppComponent.getAppMenu().handleMenuLink(...aArgs);
      },
    });
  }
);
