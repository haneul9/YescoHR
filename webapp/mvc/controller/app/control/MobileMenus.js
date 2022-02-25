sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Menus
  ) => {
    'use strict';

    return Menus.extend('sap.ui.yesco.mvc.controller.app.control.MobileMenus', {
      async buildAppMenu() {
        this.oMenuLayer = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.app.fragment.MenuPopover',
          controller: this,
        });

        this.oAppController.getView().addDependent(this.oMenuLayer);

        this.oMenuLayer.setModel(this.oMenuModel).bindElement('/');
      },

      /**
       * 메뉴 popover 열기
       */
      async toggleMenuLayer(oEvent) {
        if (this.oMenuLayer.isOpen()) {
          this.closeMenuLayer();
        } else {
          this.oMenuLayer.openBy(oEvent.getSource());
        }
      },

      /**
       * 메뉴 popover 닫기
       */
      closeMenuLayer() {
        setTimeout(() => {
          this.oMenuLayer.close();
        });
      },

      /**
       * 메뉴의 즐겨찾기 클릭 이벤트 처리
       * @param {object} oEvent
       */
      async toggleFavorite(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const bPressed = oEvent.getParameter('pressed');

        const bSuccess = await this.saveFavorite(oContext.getProperty());
        if (bSuccess) {
          const mActiveInstanceMap = AppUtils.getAppComponent().byId('mobileHome').getModel().getProperty('/activeInstanceMap');
          const oMenuFavoritesPortlet = mActiveInstanceMap.P05 || mActiveInstanceMap.M05;
          if (oMenuFavoritesPortlet) {
            oMenuFavoritesPortlet.refreshFavorites();
          }
        } else {
          const sPath = oContext.getPath();
          oContext.getModel().setProperty(`${sPath}/Favor`, !bPressed);
        }
      },
    });
  }
);
