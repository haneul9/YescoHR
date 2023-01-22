sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * Mobile 홈화면 최상단 검색, 오늘자 기념일 인원수, 자주 쓰는 메뉴 아이콘 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M25PortletHandler', {
      getPortletHeightStyleClass() {
        return 'portlet-h0';
      },

      async readContentData() {
        const oController = this.getController();
        const oModel = oController.getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PerAnniversary');
      },

      transformContentData([{ Empcnt1, Empcnt2 }]) {
        return {
          Empcnt1,
          Empcnt2,
          Orgtx: this.getController().getSessionProperty('Orgtx'),
          ButtonText1: this.getMenuName('m/employee'),
          ButtonText2: this.getMenuName('m/organization'),
          ButtonText3: this.getMenuName('m/talent'),
        };
      },

      getMenuName(sMenuUrl) {
        const oMenuModel = this.getMenuModel();
        const sMenid = oMenuModel.getMenid(this.bMobile ? `mobile/${sMenuUrl}` : sMenuUrl);

        return oMenuModel.getProperties(sMenid).Mname;
      },

      onSearch(oEvent) {
        const sQuery = oEvent.getParameter('query');
        if (!sQuery) {
          return;
        }

        this.navTo('m/employee-org', { orgtx: sQuery });
      },

      onPressButton1() {
        this.navTo('m/employee');
      },

      onPressButton2() {
        this.navTo('m/organization');
      },

      onPressButton3() {
        this.navTo('m/talent');
      },
    });
  }
);
