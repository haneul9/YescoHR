sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Month', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/MonthDate', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 기념일 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P09PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.P09PortletBox',
          controller: this,
        });

        oPortletModel.setProperty('/selectedYearMonth', new Date());

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const sSelectedYearMonth = this.getController().byId('selectedYearMonth').getValue() || moment().format('YYYYMM');

        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const mFilters = {
          Zyymm: sSelectedYearMonth.replace(/[^\d]/g, ''),
        };

        return Client.getEntitySet(oModel, 'PortletAnniversary', mFilters);
      },

      transformContentData(aPortletContentData = []) {
        const oPortletModel = this.getPortletModel();
        oPortletModel.setProperty('/birthday/list', []);
        oPortletModel.setProperty('/wedding/list', []);

        const aBirthdayList = [];
        const aWeddingList = [];

        aPortletContentData.forEach((mData) => {
          if (mData.Gubun === '1') {
            aBirthdayList.push(mData);
          }
          if (mData.Gubun === '2') {
            aWeddingList.push(mData);
          }
        });

        return {
          birthday: {
            list: aBirthdayList,
            listCount: aBirthdayList.length,
          },
          wedding: {
            list: aWeddingList,
            listCount: aWeddingList.length,
          },
        };
      },

      onChangeSelectedYearMonth() {
        this.showContentData();
      },
    });
  }
);
