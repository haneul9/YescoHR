sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 즐겨찾기 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P08PortletHandler', {
      init() {
        const oAppComponent = AppUtils.getAppComponent();
        this.oAppMenu = oAppComponent.getAppMenu();
        this.oMenuModel = oAppComponent.getMenuModel();

        AbstractPortletHandler.prototype.init.call(this);
      },

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.P08PortletBox',
          controller: this,
        });

        oPortletModel.setProperty('/selectedTabKey', 'Today');

        oPortletBox.setModel(oPortletModel).bindElement('/');

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletToDoList', { Begda: moment().hours(9).toDate(), Endda: moment().endOf('year').hours(9).toDate() });
      },

      transformContentData(aPortletContentData = []) {
        const aTodayList = _.chain(aPortletContentData)
          .filter((o) => moment(o.Datum).isSame(moment(), 'day'))
          .map((o) => ({ ...o, ...this.oMenuModel.getProperties(o.MenidPc) }))
          .value();
        const aFutureList = _.chain(aPortletContentData)
          .filter((o) => !moment(o.Datum).isSame(moment(), 'day'))
          .map((o) => ({ ...o, ...this.oMenuModel.getProperties(o.MenidPc) }))
          .value();

        return {
          today: {
            list: aTodayList,
            listCount: aTodayList.length,
          },
          future: {
            list: aFutureList,
            listCount: aFutureList.length,
          },
        };
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
