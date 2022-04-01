sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Year', // XML expression binding용 type preloading
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
     * 나의 휴가 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P12PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: this.bMobile ? 'sap.ui.yesco.mvc.view.home.mobile.P12PortletBox' : 'sap.ui.yesco.mvc.view.home.fragment.P12PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.getMenid('individualWorkState'),
        };

        return Client.getEntitySet(oModel, 'AbsQuotaList', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        const mPortletContentData = {};
        aPortletContentData.forEach((mData) => {
          if (mData.Ktart === '10') {
            const { Total = 0, Used = 0, Remain = 0 } = mPortletContentData.Annual || {};
            mPortletContentData.Annual = { Total: Total + parseFloat(mData.Crecnt), Used: Used + parseFloat(mData.Usecnt), Remain: Remain + parseFloat(mData.Balcnt) };
          }
          if (mData.Ktart === '15') {
            const { Total = 0, Used = 0, Remain = 0 } = mPortletContentData.Annual || {};
            mPortletContentData.Annual = { Total: Total + parseFloat(mData.Crecnt), Used: Used + parseFloat(mData.Usecnt), Remain: Remain + parseFloat(mData.Balcnt) };
          }
          if (mData.Ktart === '20') {
            mPortletContentData.Summer = { Total: parseFloat(mData.Crecnt), Used: parseFloat(mData.Usecnt), Remain: parseFloat(mData.Balcnt) };
          }
        });
        if (!mPortletContentData.Annual) {
          mPortletContentData.Annual = { Total: 0, Used: 0, Remain: 0 };
        }
        if (!mPortletContentData.Summer) {
          mPortletContentData.Summer = { Total: 0, Used: 0, Remain: 0 };
        }

        return mPortletContentData;
      },
    });
  }
);
