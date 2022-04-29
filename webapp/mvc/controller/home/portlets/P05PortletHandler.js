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
     * 즐겨찾기 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P05PortletHandler', {
      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletFavoriteMenu');
      },

      transformContentData(aPortletContentData = []) {
        const oMenuModel = this.getMenuModel();
        const aList = aPortletContentData
          .filter(({ Menid }) => {
            return Menid && oMenuModel.getProperties(Menid);
          })
          .map(({ Menid }) => {
            return { ...oMenuModel.getProperties(Menid), Favor: true };
          });
        return {
          list: aList,
          listCount: aList.length,
        };
      },

      async toggleFavorite(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const bPressed = oEvent.getParameter('pressed');

        const bSuccess = await this.getAppMenu().saveFavorite(oContext.getProperty());
        if (bSuccess) {
          this.refreshFavorites(); // 즐겨찾기 Portlet 새로고침

          this.getMenuModel().removeFavoriteMenid(oContext.getProperty('Menid')); // 메뉴에서 즐겨찾기 제거
        } else {
          const sPath = oContext.getPath();
          oContext.getModel().setProperty(`${sPath}/Favor`, !bPressed);
        }
      },

      async refreshFavorites() {
        const aFavorites = this.readContentData();
        const mFavorites = this.transformContentData(await aFavorites);
        const oPortletModel = this.getPortletModel();

        oPortletModel.setProperty('/list', mFavorites.list);
        oPortletModel.setProperty('/listCount', mFavorites.listCount);
      },
    });
  }
);
