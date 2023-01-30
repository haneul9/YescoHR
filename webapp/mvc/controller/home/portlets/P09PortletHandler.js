sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
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
          name: this.bMobile ? 'sap.ui.yesco.mvc.view.home.mobile.P09PortletBox' : 'sap.ui.yesco.mvc.view.home.fragment.P09PortletBox',
          controller: this,
        });

        oPortletModel.setProperty('/selectedYearMonth', new Date());
        oPortletModel.setProperty('/selectedTabKey', 'birthday');

        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(this.getPortletStyleClasses());

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const sSelectedYearMonth = moment(this.getPortletModel().getProperty('/selectedYearMonth')).format('YYYYMM');

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

        const iListCount = aBirthdayList.length;
        this.getPortletBox()
          .toggleStyleClass('no-data', !iListCount)
          .toggleStyleClass('no-scroll', iListCount && iListCount <= 4); // TODO : Portlet 높이에 행 높이를 나눠서 비교 숫자를 넣어야함

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

      onPressSegmentedButtonItem(oEvent) {
        const iListCount = this.getPortletModel().getProperty(`/${oEvent.getSource().getKey()}/listCount`);

        this.getPortletBox()
          .toggleStyleClass('no-data', !iListCount)
          .toggleStyleClass('no-scroll', iListCount && iListCount <= 4); // TODO : Portlet 높이에 행 높이를 나눠서 비교 숫자를 넣어야함
      },
    });
  }
);
