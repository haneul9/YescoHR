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
     * To Do List Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P08PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.P08PortletBox',
          controller: this,
        });

        oPortletModel.setProperty('/selectedTabKey', 'Today');

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletToDoList', { Begda: moment().hours(9).toDate(), Endda: moment().endOf('year').hours(9).toDate() });
      },

      transformContentData(aPortletContentData = []) {
        const oMenuModel = this.oMenuModel;
        const aTodayList = _.chain(aPortletContentData)
          .filter((o) => moment(o.Datum).isSame(moment(), 'day'))
          .map((o) => ({ ...o, ...oMenuModel.getProperties(o.MenidPc) }))
          .value();
        const aFutureList = _.chain(aPortletContentData)
          .filter((o) => !moment(o.Datum).isSame(moment(), 'day'))
          .map((o) => ({ ...o, ...oMenuModel.getProperties(o.MenidPc) }))
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
    });
  }
);
