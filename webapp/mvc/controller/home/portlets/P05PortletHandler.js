sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 공지사항 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P05PortletHandler', {
      init() {
        const oAppComponent = AppUtils.getAppComponent();
        this.oAppMenu = oAppComponent.getAppMenu();
        this.oMenuModel = oAppComponent.getMenuModel();

        AbstractPortletHandler.prototype.init.call(this);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const sUrl = 'PortletFavoriteMenu';

        return Client.getEntitySet(oModel, sUrl);
      },

      transformContentData(aPortletContentData = []) {
        const aList = aPortletContentData.map((mFavoriteMenuData) => this.oMenuModel.getProperties(mFavoriteMenuData.Menid));
        return {
          list: aList,
          listCount: aList.length,
        };
      },

      async toggleFavorite(oEvent) {
        const oEventSource = oEvent.getSource();
        const oContext = oEventSource.getBindingContext();

        const bSuccess = await this.oAppMenu.saveFavorite(oContext.getProperty());
        if (bSuccess) {
          const oPortletModel = this.getPortletModel();
          const sMenid = oContext.getProperty('Menid');
          _.remove(oPortletModel.getProperty('/list'), (mMenuProperties) => {
            return mMenuProperties.Menid === sMenid;
          });
          oPortletModel.refresh();
        }
      },

      formatMenuUrl(...aArgs) {
        return this.oAppMenu.formatMenuUrl(...aArgs);
      },

      formatMenuTarget(...aArgs) {
        return this.oAppMenu.formatMenuTarget(...aArgs);
      },

      handleMenuLink(...aArgs) {
        this.oAppMenu.handleMenuLink(...aArgs);
      },
    });
  }
);
